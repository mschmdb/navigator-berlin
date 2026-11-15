import { RANKED_METRICS, type RankedMetric, type RankingRanks } from './ranking-types.js';

export interface RankRowInput {
	readonly slug: string;
	readonly metricKey: string;
	readonly rang: number | null;
}

function isRankedMetric(key: string): key is RankedMetric {
	return (RANKED_METRICS as readonly string[]).includes(key);
}

/** Rang-Zeilen (slug, metricKey, rang) → slug → Rang je Tabellenspalte. */
export function groupRanksBySlug(rows: readonly RankRowInput[]): Map<string, RankingRanks> {
	const out = new Map<string, Partial<Record<RankedMetric, number | null>>>();
	for (const row of rows) {
		if (!isRankedMetric(row.metricKey)) continue;
		const entry = out.get(row.slug) ?? {};
		entry[row.metricKey] = row.rang;
		out.set(row.slug, entry);
	}
	return out;
}

/**
 * Rang für die Rang-Spalte: der Rang der sortierten Score-Spalte. Bei Sortierung nach
 * Name oder Bezirk gilt der Gesamtrang.
 */
export function rankForSort(
	ranks: RankingRanks,
	sortKey: RankedMetric | 'name' | 'bezirk'
): number | null {
	const metric: RankedMetric = isRankedMetric(sortKey) ? sortKey : 'composite';
	return ranks[metric] ?? null;
}
