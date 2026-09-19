import { computeSimilarity, type PartyShares } from './analytik.js';

export type KiezShareInput = {
	kiezSlug: string;
	parteiKurzname: string;
	anteil: number;
};

export type SimilarKiezResult = {
	kiezSlug: string;
	score: number;
};

export type SimilarKiezeResponse = {
	results: SimilarKiezResult[];
	hint: string | null;
};

function groupByKiez(rows: readonly KiezShareInput[]): Map<string, PartyShares> {
	const byKiez = new Map<string, Map<string, number>>();
	for (const row of rows) {
		let shares = byKiez.get(row.kiezSlug);
		if (!shares) {
			shares = new Map();
			byKiez.set(row.kiezSlug, shares);
		}
		shares.set(row.parteiKurzname, row.anteil);
	}
	return byKiez;
}

/**
 * Zwilling-Ranking: Top-N Kieze mit der höchsten Anteils-Ähnlichkeit zu
 * `targetSlug`, berechnet aus dem Bulk-Anteils-Vektor einer Wahl
 * (Runtime-Berechnung, siehe Design Notes: 143 Vektoren pro Request sind
 * billig, die Route cached). Kein Treffer für `targetSlug` → leere Liste
 * + Hinweis-Feld statt Fehler.
 */
export function rankSimilarKieze(
	targetSlug: string,
	rows: readonly KiezShareInput[],
	topN = 5
): SimilarKiezeResponse {
	const byKiez = groupByKiez(rows);
	const target = byKiez.get(targetSlug);
	if (!target) return { results: [], hint: 'no_data_for_kiez' };

	const scored: SimilarKiezResult[] = [];
	for (const [kiezSlug, shares] of byKiez) {
		if (kiezSlug === targetSlug) continue;
		scored.push({ kiezSlug, score: computeSimilarity(target, shares) });
	}
	scored.sort((a, b) => b.score - a.score || a.kiezSlug.localeCompare(b.kiezSlug, 'de'));
	return { results: scored.slice(0, topN), hint: null };
}
