/**
 * Story 7 (Zeit-Animation mit Wechsel-Markierung): Client-Zwilling der
 * Wiederholungswahl-Merge-Regel aus `$lib/server/wahl/analytik.ts`
 * (`mergeRepeatElections`/`winningPartei`). Bewusst NICHT von dort
 * importiert (Boundary: kein `$lib/server`-Import im Client) -- die
 * Fixture-Tests (`wechsel-data.test.ts`) klammern beide Implementierungen
 * auf dasselbe Ergebnis.
 *
 * Nimmt die bereits geladene Bulk-Winners-Response (eine Row je
 * Gebiet×Jahr, bereits die stärkste Partei -- kein zweiter Server-Request)
 * und leitet daraus die Wechsel-Liste ab: pro Gebiet die effektive
 * Legislatur-Reihe (Wiederholungswahl ersetzt ihre Eltern-Wahl an deren
 * Position), Wechsel = Partei-Wechsel zwischen zwei aufeinanderfolgenden
 * Einträgen dieser Reihe.
 */
import type { WinnerApiRow } from './winner-map-data.js';

/**
 * Story 8 (Trends/Sankey): exportiert für `sankey-wahljahre.svelte` /
 * `computeUebergaengeFromRows` -- Sankey-Spalten und -Übergänge folgen
 * derselben effektiven Legislatur-Reihe wie die Wechsel-Liste, KEINE zweite
 * Merge-Implementierung (Boundary Code-Map: "wiederverwenden, NICHT duplizieren").
 */
export interface GebietPoint {
	readonly jahr: number;
	readonly isRepeatElection: boolean;
	readonly parentJahr: number | null;
	readonly partei: string;
}

export interface WechselEntry {
	readonly gebietSlug: string;
	readonly gebietName?: string;
	readonly jahr: number;
	readonly von: string;
	readonly nach: string;
}

/** Extrahiert das Jahr aus einem Wahl-Slug (`2021-agh-zweitstimme` -> 2021, `2011-bvv` -> 2011). */
export function parentJahrFromParentSlug(parentSlug: string | null): number | null {
	if (!parentSlug) return null;
	const match = /^(\d{4})-/.exec(parentSlug);
	return match ? Number(match[1]) : null;
}

/**
 * Strukturelles Äquivalent zu `mergeRepeatElections` (analytik.ts): sortiert
 * aufsteigend nach Jahr, eine Wiederholungswahl ersetzt ihre Eltern-Wahl an
 * deren Position statt einen eigenen Slot zu belegen.
 */
export function mergeEffectiveSeries(points: readonly GebietPoint[]): GebietPoint[] {
	const sorted = [...points].sort((a, b) => a.jahr - b.jahr);
	const effective: GebietPoint[] = [];
	for (const point of sorted) {
		if (point.isRepeatElection && point.parentJahr !== null) {
			const parentIndex = effective.findIndex((entry) => entry.jahr === point.parentJahr);
			if (parentIndex !== -1) {
				effective[parentIndex] = point;
				continue;
			}
		}
		effective.push(point);
	}
	return effective;
}

/** Rows eines Gebiets -> `GebietPoint[]` (Rohform vor dem Merge). Gemeinsame
 * Extraktion für Wechsel-Liste UND Sankey-Übergänge (Boundary: eine Stelle). */
function pointsFromGebietRows(gebietRows: readonly WinnerApiRow[]): GebietPoint[] {
	return gebietRows.map((r) => ({
		jahr: r.jahr as number,
		isRepeatElection: r.is_repeat_election,
		parentJahr: parentJahrFromParentSlug(r.parent_slug),
		partei: r.partei
	}));
}

function groupByGebiet(rows: readonly WinnerApiRow[]): Map<string, WinnerApiRow[]> {
	const out = new Map<string, WinnerApiRow[]>();
	for (const row of rows) {
		if (row.jahr === null) continue;
		const list = out.get(row.gebiet_slug);
		if (list) list.push(row);
		else out.set(row.gebiet_slug, [row]);
	}
	return out;
}

/**
 * Wechsel-Liste aus der Bulk-Winners-Response (alle Jahre einer Reihe/Ebene).
 * Eine Wiederholungswahl (z. B. AGH 2021 -> 2023) zählt nie als eigener
 * Wechsel: sie ersetzt ihre Eltern-Wahl in der effektiven Reihe, ein
 * Wechsel entsteht nur, wenn sich die Partei zwischen zwei effektiven
 * Positionen ändert.
 */
export function computeWechselFromRows(rows: readonly WinnerApiRow[]): WechselEntry[] {
	const byGebiet = groupByGebiet(rows);
	const result: WechselEntry[] = [];
	for (const [gebietSlug, gebietRows] of byGebiet) {
		const effective = mergeEffectiveSeries(pointsFromGebietRows(gebietRows));
		for (let i = 1; i < effective.length; i++) {
			const prev = effective[i - 1];
			const curr = effective[i];
			if (prev.partei !== curr.partei) {
				result.push({ gebietSlug, jahr: curr.jahr, von: prev.partei, nach: curr.partei });
			}
		}
	}
	return result;
}

/**
 * Ein gebündelter Partei-Übergang zwischen zwei benachbarten Spalten der
 * effektiven Legislatur-Reihe (Sankey-Kern, AC „Bündelung pro
 * Partei-Übergang, nie pro Gebiet"). `anzahl` zählt Gebiete, NIE Personen
 * (Boundary: „Wählerwanderung" vermeiden).
 */
export interface Uebergang {
	readonly vonJahr: number;
	readonly nachJahr: number;
	readonly von: string;
	readonly nach: string;
	readonly anzahl: number;
}

/**
 * Gebündelte Partei-Übergänge aus der Bulk-Winners-Response, EIN Eintrag je
 * (vonJahr, nachJahr, von, nach) -- auch ein unveränderter Übergang
 * (SPD -> SPD) zählt, damit die Spaltensumme (`sankey-layout.ts`) exakt der
 * Anzahl der Gebiete mit Daten entspricht (I/O-Matrix „Sankey-Bündelung").
 * Rechnet auf derselben effektiven Reihe wie `computeWechselFromRows`
 * (Wiederholungswahl ersetzt ihr Eltern-Jahr).
 */
export function computeUebergaengeFromRows(rows: readonly WinnerApiRow[]): Uebergang[] {
	const byGebiet = groupByGebiet(rows);
	const counts = new Map<string, Uebergang>();
	for (const [, gebietRows] of byGebiet) {
		const effective = mergeEffectiveSeries(pointsFromGebietRows(gebietRows));
		for (let i = 1; i < effective.length; i++) {
			const prev = effective[i - 1];
			const curr = effective[i];
			const key = `${prev.jahr}|${curr.jahr}|${prev.partei}|${curr.partei}`;
			const existing = counts.get(key);
			if (existing) {
				counts.set(key, { ...existing, anzahl: existing.anzahl + 1 });
			} else {
				counts.set(key, {
					vonJahr: prev.jahr,
					nachJahr: curr.jahr,
					von: prev.partei,
					nach: curr.partei,
					anzahl: 1
				});
			}
		}
	}
	return Array.from(counts.values());
}

/** Eine Sankey-Spalte: Jahr der effektiven Reihe + Wiederholungs-Flag
 * (mind. ein Gebiet der Reihe hat an dieser Position eine Wiederholungswahl). */
export interface SankeySpalte {
	readonly jahr: number;
	readonly istWiederholung: boolean;
}

/**
 * Sankey-Spalten aus der Bulk-Winners-Response: die Vereinigung aller
 * effektiven Jahre über alle Gebiete (aufsteigend), damit Gebiete mit
 * kürzerer Datenhistorie (Coverage-Grenze, z. B. BVV-Kiez ab 2016) keine
 * Spalte unterschlagen, die andere Gebiete tragen.
 */
export function effectiveJahreFromRows(rows: readonly WinnerApiRow[]): SankeySpalte[] {
	const byGebiet = groupByGebiet(rows);
	const istWiederholungByJahr = new Map<number, boolean>();
	// Eltern-Jahre GLOBAL über alle Gebiete sammeln: ersetzt ein Gebiet sein
	// Eltern-Jahr per Wiederholungswahl, verschwindet diese Spalte für ALLE
	// Gebiete -- auch für ein Gebiet, dem die Wiederholungs-Row selbst fehlt
	// (Teil-Coverage, sonst AC-Bruch „2021 erscheint nicht als eigene Spalte").
	const ersetzteElternJahre = new Set<number>();
	for (const [, gebietRows] of byGebiet) {
		const points = pointsFromGebietRows(gebietRows);
		for (const point of points) {
			if (point.isRepeatElection && point.parentJahr !== null) {
				ersetzteElternJahre.add(point.parentJahr);
			}
		}
		const effective = mergeEffectiveSeries(points);
		for (const point of effective) {
			const bisher = istWiederholungByJahr.get(point.jahr) ?? false;
			istWiederholungByJahr.set(point.jahr, bisher || point.isRepeatElection);
		}
	}
	return Array.from(istWiederholungByJahr.entries())
		.filter(([jahr]) => !ersetzteElternJahre.has(jahr))
		.sort(([a], [b]) => a - b)
		.map(([jahr, istWiederholung]) => ({ jahr, istWiederholung }));
}

/**
 * Knoten-Anzahl je effektivem Jahr × Partei -- Gebiete zählen (nie Personen),
 * aus DENSELBEN effektiven Reihen wie `computeUebergaengeFromRows` (gemeinsame
 * `pointsFromGebietRows`/`mergeEffectiveSeries`-Extraktion, Boundary: eine
 * Stelle). Ersetzt die frühere, strukturell falsche Herleitung in
 * `sankey-layout.ts` (erste Spalte aus `von`, Rest aus `nach`), die Gebiete
 * verlor, deren Datenhistorie erst in einer MITTLEREN Spalte beginnt.
 */
export function parteiAnzahlProJahrFromRows(
	rows: readonly WinnerApiRow[]
): Map<number, Map<string, number>> {
	const byGebiet = groupByGebiet(rows);
	const result = new Map<number, Map<string, number>>();
	for (const [, gebietRows] of byGebiet) {
		const effective = mergeEffectiveSeries(pointsFromGebietRows(gebietRows));
		for (const point of effective) {
			let byPartei = result.get(point.jahr);
			if (!byPartei) {
				byPartei = new Map<string, number>();
				result.set(point.jahr, byPartei);
			}
			byPartei.set(point.partei, (byPartei.get(point.partei) ?? 0) + 1);
		}
	}
	return result;
}

/** Menge der Jahre je Gebiet, an denen ein Wechsel sichtbar ist -- Jahre der
 * EFFEKTIVEN Legislatur-Reihe (Wiederholungswahl ersetzt ihr Eltern-Jahr),
 * nicht die realen, ungemergten Kalenderjahre. */
export function wechselJahreSetByGebiet(
	rows: readonly WinnerApiRow[]
): Map<string, ReadonlySet<number>> {
	const entries = computeWechselFromRows(rows);
	const out = new Map<string, Set<number>>();
	for (const entry of entries) {
		const set = out.get(entry.gebietSlug);
		if (set) set.add(entry.jahr);
		else out.set(entry.gebietSlug, new Set([entry.jahr]));
	}
	return out;
}

/** Wechsel-Häufigkeit je Gebiet (für die Wechsel-Häufigkeits-Karte/Legende). */
export function wechselCountByGebiet(entries: readonly WechselEntry[]): Map<string, number> {
	const out = new Map<string, number>();
	for (const entry of entries) {
		out.set(entry.gebietSlug, (out.get(entry.gebietSlug) ?? 0) + 1);
	}
	return out;
}

/**
 * Sortierte Wechsel-Liste für die Kapitel-Anzeige: Häufigkeit des jeweiligen
 * Gebiets absteigend, danach alphabetisch (Boundary: Gleichstände
 * deterministisch `localeCompare('de')`, identisch zur Server-Regel),
 * innerhalb eines Gebiets chronologisch.
 */
export function sortWechselEntriesForDisplay(
	entries: readonly WechselEntry[],
	counts: ReadonlyMap<string, number>
): WechselEntry[] {
	return [...entries].sort((a, b) => {
		const countDiff = (counts.get(b.gebietSlug) ?? 0) - (counts.get(a.gebietSlug) ?? 0);
		if (countDiff !== 0) return countDiff;
		const nameDiff = (a.gebietName ?? a.gebietSlug).localeCompare(b.gebietName ?? b.gebietSlug, 'de');
		if (nameDiff !== 0) return nameDiff;
		return a.jahr - b.jahr;
	});
}
