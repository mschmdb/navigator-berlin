/**
 * Pure Planungs-Funktion für den Kiez-Build (Story 17, Review-Fund): fasst
 * "Mappings filtern → Gates → Kiez-Split → Anteil-Berechnung → Insert-
 * Values bauen" aus `build-wahl-kiez-aggregat.ts` in eine reine, DB-freie
 * Funktion zusammen, damit dieser zentrale Rechenkern ohne echte Postgres-
 * Verbindung testbar ist (vorher nur im Real-Build erreichbar). Der
 * Build-Script bleibt für I/O zuständig: DB-Reads vor dem Aufruf, DB-Writes
 * (in einer Transaktion) danach.
 */
import type { GruppeMapping } from './gruppe-mapper.js';
import {
	findUrnenOhneGruppe,
	findVerwaisteBriefwahlbezirke,
	findGeometrieUrnenOhneDb,
	findGruppenOhneDbBriefwahl,
	checkGruppenSummeGegenBerlin
} from './gruppe-preflight.js';
import {
	computeKiezStimmenMitBriefwahl,
	type UrneGruppenInfo,
	type ErgebnisRow
} from './briefwahl-split.js';

/** Anteil Urnen ohne (oder mit `0`) Wahlberechtigten, ab dem der Build
 * abbricht statt die Kiez-Split-Ergebnisse mit einer stillen Massen-
 * Degradation auf Gleichverteilung zu liefern. */
export const WAHLBERECHTIGTE_MISSING_THRESHOLD = 0.01;

export type KiezAggregatPlanInput = {
	readonly wahlSlug: string;
	readonly stimmtyp: string;
	readonly wahlId: number;
	/** Roh-Mappings aus `buildGruppeMappings` (Geometrie, ungefiltert). */
	readonly geometryMappings: readonly GruppeMapping[];
	readonly dbUrneUwbIds: readonly string[];
	readonly dbBriefUwbIds: readonly string[];
	readonly wahlberechtigteByUwbId: ReadonlyMap<string, number | null>;
	readonly kiezSlugByUwbId: ReadonlyMap<string, string | null>;
	readonly ergebnisRows: readonly ErgebnisRow[];
	/** Amtliche Berlin-Summe (SUM über `wahl_aggregat_berlin`), unabhängig
	 * von `ergebnisRows` geladen (Review-Fund, siehe `checkGruppenSummeGegenBerlin`). */
	readonly berlinSumme: number;
};

export type GruppenZuordnungValue = { readonly uwbId: string; readonly gruppeId: string };
export type KiezAggregatInsertValue = {
	readonly kiezSlug: string;
	readonly parteiId: number;
	readonly stimmen: number;
	readonly anteil: number;
};

export type KiezAggregatPlan = {
	readonly gruppenZuordnungValues: readonly GruppenZuordnungValue[];
	readonly kiezAggregatInsertValues: readonly KiezAggregatInsertValue[];
	/** Informationszeilen fürs Build-Log (kein Fehler, nur Beobachtung). */
	readonly logs: readonly string[];
};

function fail(wahlSlug: string, stimmtyp: string, wahlId: number, message: string): never {
	throw new Error(`[kiez-aggregat] ${wahlSlug}/${stimmtyp} (wahlId=${wahlId}): ${message} -- Build-Abbruch`);
}

/**
 * Baut den vollständigen Kiez-Aggregat-Plan für eine Wahl/Stimmtyp-
 * Kombination oder wirft, sobald eines der Gates verletzt ist (Boundary
 * "kein stilles Weglassen"). Reihenfolge der Gates entspricht der
 * Reihenfolge, in der sie im echten Build laufen.
 */
export function buildKiezAggregatPlan(input: KiezAggregatPlanInput): KiezAggregatPlan {
	const {
		wahlSlug,
		stimmtyp,
		wahlId,
		geometryMappings,
		dbUrneUwbIds,
		dbBriefUwbIds,
		wahlberechtigteByUwbId,
		kiezSlugByUwbId,
		ergebnisRows,
		berlinSumme
	} = input;
	const logs: string[] = [];

	// Mappings vorab auf DB-bekannte Urnen filtern (Review-Fund: eine
	// Geometrie-Urne ohne DB-Row floss bisher ungefiltert in Kiez-Split +
	// Gruppen-Zuordnung ein -- `wahlberechtigte` dafür ist zwangsläufig
	// `null`, was die GANZE Gruppe auf Gleichverteilung degradiert). Nur
	// geloggt, kein Abbruch: ein Geometrie/DB-Drift ist kein Datenfehler
	// EINER Wahl, sondern beträfe künftige Geometrie-Generationen.
	const geometrieUrnenOhneDb = findGeometrieUrnenOhneDb(geometryMappings, dbUrneUwbIds);
	if (geometrieUrnenOhneDb.length > 0) {
		logs.push(
			`${geometrieUrnenOhneDb.length} Geometrie-Urne(n) ohne DB-Row gefiltert: ${geometrieUrnenOhneDb.slice(0, 10).join(', ')}${geometrieUrnenOhneDb.length > 10 ? ', …' : ''}`
		);
	}
	const dbUrneSet = new Set(dbUrneUwbIds);
	const mappings = geometryMappings.filter((m) => dbUrneSet.has(m.dbUwbId));

	// Verwaisten-Gate (Boundary "Always"): jede DB-Urne braucht eine Gruppe,
	// jeder Briefwahl-Stimmbezirk braucht eine Urnen-Gruppe, die auf ihn zeigt.
	const urnenOhneGruppe = findUrnenOhneGruppe(dbUrneUwbIds, mappings);
	if (urnenOhneGruppe.length > 0) {
		fail(
			wahlSlug,
			stimmtyp,
			wahlId,
			`${urnenOhneGruppe.length} Urne(n) ohne Gruppe: ${urnenOhneGruppe.slice(0, 10).join(', ')}${urnenOhneGruppe.length > 10 ? ', …' : ''}`
		);
	}
	const verwaist = findVerwaisteBriefwahlbezirke(dbBriefUwbIds, mappings);
	if (verwaist.length > 0) {
		fail(
			wahlSlug,
			stimmtyp,
			wahlId,
			`verwaiste Briefwahl-Stimmbezirke ohne Gruppe: ${verwaist.slice(0, 10).join(', ')}${verwaist.length > 10 ? ', …' : ''}`
		);
	}
	// Umgekehrte Richtung (Review-Fund): eine Geometrie-Gruppe ohne
	// DB-Briefwahl-Row passierte bisher still -- der Kiez-Split hätte für
	// diese Gruppe nie Briefwahl verteilt, ohne dass irgendein Gate das
	// meldet.
	const gruppenOhneDbBriefwahl = findGruppenOhneDbBriefwahl(mappings, dbBriefUwbIds);
	if (gruppenOhneDbBriefwahl.length > 0) {
		fail(
			wahlSlug,
			stimmtyp,
			wahlId,
			`${gruppenOhneDbBriefwahl.length} Geometrie-Gruppe(n) ohne DB-Briefwahl-Row: ${gruppenOhneDbBriefwahl.slice(0, 10).join(', ')}${gruppenOhneDbBriefwahl.length > 10 ? ', …' : ''}`
		);
	}

	// Wahlberechtigte-Vollständigkeits-Gate (Review-Fund): fehlende ODER
	// `0`-Wahlberechtigte (0 zählt wie fehlend, siehe `briefwahl-split.ts`)
	// degradieren die betroffene Gruppe auf Gleichverteilung -- bei
	// vereinzelten Lücken eine akzeptable Schätzung, bei einer
	// systematischen Ingest-Lücke (z. B. ein Re-Ingest ohne die
	// `wahlberechtigte`-Spalte) würde die Karte flächendeckend auf
	// Gleichverteilung zurückfallen, ohne dass irgendein Gate das meldet.
	const urnenUwbIds = mappings.map((m) => m.dbUwbId);
	const missingWahlberechtigte = urnenUwbIds.filter((id) => {
		const wb = wahlberechtigteByUwbId.get(id) ?? null;
		return wb === null || wb === 0;
	});
	const missingFraction =
		urnenUwbIds.length > 0 ? missingWahlberechtigte.length / urnenUwbIds.length : 0;
	if (missingFraction > WAHLBERECHTIGTE_MISSING_THRESHOLD) {
		fail(
			wahlSlug,
			stimmtyp,
			wahlId,
			`${missingWahlberechtigte.length}/${urnenUwbIds.length} Urnen (${(missingFraction * 100).toFixed(1)} %) ohne/mit 0 Wahlberechtigten, Schwelle ${(WAHLBERECHTIGTE_MISSING_THRESHOLD * 100).toFixed(0)} %`
		);
	}

	const ergebnisRowsForCheck = ergebnisRows.map((r) => ({ uwbId: r.uwbId, stimmen: r.stimmen }));
	const summenCheck = checkGruppenSummeGegenBerlin(
		ergebnisRowsForCheck,
		mappings,
		dbBriefUwbIds,
		berlinSumme
	);
	if (!summenCheck.matches) {
		fail(
			wahlSlug,
			stimmtyp,
			wahlId,
			`Summen-Check fehlgeschlagen -- Gruppen-Summe=${summenCheck.gruppenSumme} ≠ Berlin-Summe=${summenCheck.berlinSumme} (Differenz ${summenCheck.gruppenSumme - summenCheck.berlinSumme})`
		);
	}

	const urnenInfo: UrneGruppenInfo[] = mappings.map((m) => ({
		dbUwbId: m.dbUwbId,
		gruppeId: m.gruppeId,
		kiezSlug: kiezSlugByUwbId.get(m.dbUwbId) ?? null,
		wahlberechtigte: wahlberechtigteByUwbId.get(m.dbUwbId) ?? null
	}));

	const { kiezStimmen, ohneKiezSumme } = computeKiezStimmenMitBriefwahl(urnenInfo, ergebnisRows);
	const sumKiez = kiezStimmen.reduce((a, r) => a + r.stimmen, 0);
	const urnenOhneKiez = urnenInfo.filter((u) => !u.kiezSlug).length;
	const sumErgebnis = ergebnisRows.reduce((a, r) => a + r.stimmen, 0);
	logs.push(
		`sum-ergebnis=${sumErgebnis} sum-kiez=${sumKiez} ohne-kiez-summe=${ohneKiezSumme} urnen-ohne-kiez=${urnenOhneKiez}/${urnenInfo.length}`
	);

	// Zweite Summen-Invariante (Kiez-Split): sumKiez + Stimmen der Urnen
	// ohne Kiez (inkl. anteiliger Briefwahl) muss exakt der Gruppen-Summe
	// entsprechen -- sonst verschwinden Stimmen irgendwo in der Kiez-Split-
	// Rechnung selbst.
	if (sumKiez + ohneKiezSumme !== summenCheck.gruppenSumme) {
		fail(
			wahlSlug,
			stimmtyp,
			wahlId,
			`Kiez-Split-Invariante fehlgeschlagen -- sumKiez(${sumKiez}) + ohneKiezSumme(${ohneKiezSumme}) = ${sumKiez + ohneKiezSumme} ≠ Gruppen-Summe(${summenCheck.gruppenSumme})`
		);
	}

	const anteilByKiez = new Map<string, number>();
	for (const r of kiezStimmen) {
		anteilByKiez.set(r.kiezSlug, (anteilByKiez.get(r.kiezSlug) ?? 0) + r.stimmen);
	}
	const kiezAggregatInsertValues: KiezAggregatInsertValue[] = kiezStimmen.map((r) => ({
		kiezSlug: r.kiezSlug,
		parteiId: r.parteiId,
		stimmen: r.stimmen,
		anteil:
			(anteilByKiez.get(r.kiezSlug) ?? 0) > 0 ? r.stimmen / (anteilByKiez.get(r.kiezSlug) ?? 1) : 0
	}));

	const gruppenZuordnungValues: GruppenZuordnungValue[] = [
		...mappings.map((m) => ({ uwbId: m.dbUwbId, gruppeId: m.gruppeId })),
		...dbBriefUwbIds.map((uwbId) => ({ uwbId, gruppeId: uwbId }))
	];

	return { gruppenZuordnungValues, kiezAggregatInsertValues, logs };
}
