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

interface GebietPoint {
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
function mergeEffectiveSeries(points: readonly GebietPoint[]): GebietPoint[] {
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
		const points: GebietPoint[] = gebietRows.map((r) => ({
			jahr: r.jahr as number,
			isRepeatElection: r.is_repeat_election,
			parentJahr: parentJahrFromParentSlug(r.parent_slug),
			partei: r.partei
		}));
		const effective = mergeEffectiveSeries(points);
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
