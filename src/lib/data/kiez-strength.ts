import { COMPOSITE_DIMENSIONS, type KiezScoreDimension } from '$lib/data';
import type { ComparisonDimRow } from './comparison-types.js';

export interface KiezStrength {
	readonly key: KiezScoreDimension;
	readonly rang: number;
	readonly total: number;
}

/** Nur Dimensionen, die in den Kiez-Score einfließen (Kultur und Kriminalität sind Kontext, ADR-019). */
const SCORED: ReadonlySet<string> = new Set(COMPOSITE_DIMENSIONS);

/**
 * Score-Dimension mit dem besten Berlin-Rang, nur im oberen Viertel (Quartil 1).
 * Bei Gleichstand gewinnt die erste Zeile der Eingabe (feste Dimensions-Reihenfolge).
 * Schwächen liefert die Funktion bewusst nie (Anti-Stigma).
 */
export function pickKiezStrength(rows: readonly ComparisonDimRow[]): KiezStrength | null {
	let best: KiezStrength | null = null;
	for (const row of rows) {
		if (!SCORED.has(row.key)) continue;
		if (row.quartil !== 1 || row.rang === null || row.total <= 0) continue;
		if (best === null || row.rang < best.rang) {
			best = { key: row.key, rang: row.rang, total: row.total };
		}
	}
	return best;
}
