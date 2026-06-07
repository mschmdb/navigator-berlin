/**
 * scripts/lib/ranking/ranking.ts (Story 11.0).
 *
 * Reine Ranking-/Quartil-Funktionen für Kiez/Bezirk-Metriken. Liefert pro Slug
 * einen dichten Rang (1 = bester Wert) plus Quartil über das Feld der nicht-null
 * Werte. `null`-Werte fallen aus dem Ranking (rang/quartil `null`, nicht im Total).
 *
 * Quartil ist rang-basiert (Position im Feld), NICHT wert-basiert. Das stützt das
 * Anti-Stigma-Framing (ADR-015): „unteres Viertel" statt „Platz 143 von 143". Die
 * wert-basierten 0-100-Stufen aus docs/scoring-methodology.md#Quartil-Klassifikation
 * gelten für Choropleth-Skalen und sind hiervon bewusst getrennt.
 */

export type RankDirection = 'higher-better' | 'lower-better';

export interface RankInput {
	readonly slug: string;
	readonly value: number | null;
}

export interface RankResult {
	readonly slug: string;
	/** Dichter Rang 1..total (1 = bester). `null` wenn value `null`. */
	readonly rang: number | null;
	/** Quartil 1..4 (1 = bestes Viertel). `null` wenn value `null`. */
	readonly quartil: number | null;
	/** Anzahl der gerankten (nicht-null) Werte im Feld. */
	readonly total: number;
}

/**
 * Bildet eine Rang-Position auf ein Quartil 1..4 ab (1 = bestes Viertel).
 * `null` bei fehlendem Rang oder nicht-positivem Total.
 */
export function quartileOf(rang: number | null, total: number): number | null {
	if (rang === null || total <= 0) return null;
	// floor((rang-1)/total*4)+1: bester Rang → immer Q1, schlechtester → Q4 (für total>=4).
	const q = Math.floor(((rang - 1) / total) * 4) + 1;
	return Math.min(4, Math.max(1, q));
}

/**
 * Dichtes Ranking über die nicht-null Werte. Ties teilen sich den Rang.
 * `direction` steuert die Richtung: `higher-better` (Standard für Scores) vs.
 * `lower-better` (invertierte Metriken wie PET-Hitze oder Lärm).
 */
export function rankBy(items: readonly RankInput[], direction: RankDirection): RankResult[] {
	const ranked = items.filter((i) => i.value !== null) as ReadonlyArray<{
		slug: string;
		value: number;
	}>;
	const total = ranked.length;

	const sorted = [...ranked].sort((a, b) =>
		direction === 'higher-better' ? b.value - a.value : a.value - b.value
	);

	// Dense rank: gleicher Wert → gleicher Rang.
	const rangBySlug = new Map<string, number>();
	let currentRang = 0;
	let lastValue: number | null = null;
	for (const entry of sorted) {
		if (lastValue === null || entry.value !== lastValue) {
			currentRang += 1;
			lastValue = entry.value;
		}
		rangBySlug.set(entry.slug, currentRang);
	}

	return items.map((item) => {
		if (item.value === null) {
			return { slug: item.slug, rang: null, quartil: null, total };
		}
		const rang = rangBySlug.get(item.slug) ?? null;
		return { slug: item.slug, rang, quartil: quartileOf(rang, total), total };
	});
}
