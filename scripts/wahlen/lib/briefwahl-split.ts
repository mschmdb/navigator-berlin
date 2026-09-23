/**
 * Story 17 (Briefwahl-Gruppen): Rechenkern für die anteilige Briefwahl-
 * Verteilung im Kiez-Aggregat. Pure Functions, DB-frei (Muster
 * `src/lib/server/wahl/analytik.ts`).
 *
 * Design Notes: für Urne `u` in Gruppe `g` gilt
 * `brief_u = brief_g × wb_u / Σ wb(g)` (wb = Wahlberechtigte). Ein
 * Gruppen-Centroid würde Gruppen an Kiezgrenzen komplett einem Kiez
 * zuschlagen; die Urnen-Zuordnung bleibt dadurch exakt, nur die Briefwahl
 * ist geschätzt.
 *
 * "Largest remainder"-Rundung statt Pro-Zelle-Rundung: die verteilten
 * Briefwahl-Stimmen einer Gruppe+Partei summieren sich exakt auf den
 * Briefwahl-Rohwert zurück (keine Rundungs-Drift über viele Gruppen
 * hinweg) -- Voraussetzung für die Summen-Gegenprobe gegen das
 * Berlin-Aggregat (Boundary "keine Stimme geht verloren").
 */

export type ErgebnisRow = {
	readonly uwbId: string;
	readonly parteiId: number;
	readonly stimmen: number;
};

export type UrneGruppenInfo = {
	readonly dbUwbId: string;
	readonly gruppeId: string;
	/** `null`, wenn der Urnen-Centroid in keinem Kiez liegt (bestehender Fallback, kiez-mapper.ts). */
	readonly kiezSlug: string | null;
	/** `null`, wenn diese Urne keinen Wahlberechtigten-Wert hat (älterer Ingest ohne Re-Fetch). */
	readonly wahlberechtigte: number | null;
};

export type KiezParteiStimmen = {
	readonly kiezSlug: string;
	readonly parteiId: number;
	readonly stimmen: number;
};

export type KiezSplitResult = {
	readonly kiezStimmen: readonly KiezParteiStimmen[];
	/**
	 * Summe der Stimmen (eigene Urnen-Stimmen + anteilige Briefwahl), die
	 * KEINEM Kiez zugeordnet werden konnten (Urnen-Centroid außerhalb aller
	 * Kieze, bestehender Fallback aus `kiez-mapper.ts`) -- statt sie
	 * stillschweigend fallen zu lassen, fließen sie hier in eine explizite
	 * Summe, damit der Aufrufer die Invariante `sumKiez + ohneKiezSumme ==
	 * gruppenSumme` prüfen kann (I/O-Matrix "Summen-Check", zweite
	 * Invariante für den Kiez-Split).
	 */
	readonly ohneKiezSumme: number;
};

/**
 * Verteilt `total` ganzzahlig proportional zu `weights` (Largest-Remainder-
 * Verfahren): die Summe der Rückgabe ist immer exakt `total`. Gleichstand
 * bei den Nachkommaanteilen wird deterministisch über den Eingabe-Index
 * aufgelöst (Aufrufer sortiert vorher, z. B. nach dbUwbId).
 */
export function distributeLargestRemainder(total: number, weights: readonly number[]): number[] {
	if (weights.length === 0) return [];
	if (total <= 0) return weights.map(() => 0);

	const sumWeights = weights.reduce((a, b) => a + b, 0);
	if (sumWeights <= 0) return weights.map(() => 0);

	const raw = weights.map((w) => (total * w) / sumWeights);
	const floors = raw.map(Math.floor);
	const flooredSum = floors.reduce((a, b) => a + b, 0);
	let remainder = total - flooredSum;

	const order = raw
		.map((r, i) => ({ i, frac: r - floors[i] }))
		.sort((a, b) => b.frac - a.frac || a.i - b.i);

	const result = [...floors];
	for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
		result[order[k].i] += 1;
	}
	return result;
}

/**
 * Kiez-Aggregat inklusive anteilig verteilter Briefwahl (löst die frühere
 * `ist_briefwahl_aggregat = false`-Filterung ab). Nimmt die Urne→Gruppe→Kiez-
 * Zuordnung (aus Geometrie + `wahl_stimmbezirk_gruppe`) und ALLE `ergebnis`-
 * Rows der Wahl (Urne UND Briefwahl-Stimmbezirke) entgegen.
 *
 * Fehlt für mind. eine Urne einer Gruppe der Wahlberechtigten-Wert (oder ist
 * die Summe 0), fällt die gesamte Gruppe auf Gleichverteilung zurück (Design
 * Notes, Methodik-Doku).
 */
export function computeKiezStimmenMitBriefwahl(
	urnen: readonly UrneGruppenInfo[],
	ergebnisRows: readonly ErgebnisRow[]
): KiezSplitResult {
	const stimmenByUwbId = new Map<string, Map<number, number>>();
	for (const row of ergebnisRows) {
		const inner = stimmenByUwbId.get(row.uwbId) ?? new Map<number, number>();
		inner.set(row.parteiId, (inner.get(row.parteiId) ?? 0) + row.stimmen);
		stimmenByUwbId.set(row.uwbId, inner);
	}

	const urnenByGruppe = new Map<string, UrneGruppenInfo[]>();
	for (const u of urnen) {
		const list = urnenByGruppe.get(u.gruppeId) ?? [];
		list.push(u);
		urnenByGruppe.set(u.gruppeId, list);
	}

	const kiezPartei = new Map<string, number>();
	const bump = (kiezSlug: string, parteiId: number, delta: number) => {
		const key = `${kiezSlug}\u0000${parteiId}`;
		kiezPartei.set(key, (kiezPartei.get(key) ?? 0) + delta);
	};
	let ohneKiezSumme = 0;

	for (const [gruppeId, members] of urnenByGruppe) {
		const sorted = [...members].sort((a, b) => a.dbUwbId.localeCompare(b.dbUwbId));
		const briefMap = stimmenByUwbId.get(gruppeId);

		// `0` zählt wie `null` als fehlend (Review-Fund): jeder reale
		// Wahlbezirk hat > 0 Wahlberechtigte, eine `0` ist ein Ingest-Lücke-
		// Artefakt, kein legitimes Gewicht. Ohne diese Gleichsetzung bekäme
		// eine einzelne Urne mit `wahlberechtigte = 0` in einer sonst
		// vollständigen Gruppe per Largest-Remainder immer exakt 0 Anteil an
		// der Briefwahl, statt die Gruppe auf Gleichverteilung zurückfallen
		// zu lassen.
		const hasWahlberechtigte =
			sorted.every((u) => u.wahlberechtigte !== null && u.wahlberechtigte !== 0) &&
			sorted.reduce((a, u) => a + (u.wahlberechtigte ?? 0), 0) > 0;
		const weights = hasWahlberechtigte
			? sorted.map((u) => u.wahlberechtigte as number)
			: sorted.map(() => 1);

		// Eigene Urnen-Stimmen (immer, unabhängig von Briefwahl-Daten). Ohne
		// Kiez-Zuordnung fließen sie in `ohneKiezSumme` statt stillschweigend
		// verworfen zu werden (Summen-Invariante unten).
		for (const u of sorted) {
			const own = stimmenByUwbId.get(u.dbUwbId);
			if (!own) continue;
			for (const [parteiId, stimmen] of own) {
				if (u.kiezSlug) bump(u.kiezSlug, parteiId, stimmen);
				else ohneKiezSumme += stimmen;
			}
		}

		if (!briefMap) continue;
		for (const [parteiId, briefTotal] of briefMap) {
			const shares = distributeLargestRemainder(briefTotal, weights);
			for (let i = 0; i < sorted.length; i++) {
				const u = sorted[i];
				if (shares[i] === 0) continue;
				if (u.kiezSlug) bump(u.kiezSlug, parteiId, shares[i]);
				else ohneKiezSumme += shares[i];
			}
		}
	}

	const kiezStimmen: KiezParteiStimmen[] = [];
	for (const [key, stimmen] of kiezPartei) {
		const [kiezSlug, parteiIdRaw] = key.split('\u0000');
		kiezStimmen.push({ kiezSlug, parteiId: Number(parteiIdRaw), stimmen });
	}
	return { kiezStimmen, ohneKiezSumme };
}
