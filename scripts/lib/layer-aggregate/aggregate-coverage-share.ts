import { round1, type CoverageShareAggregate } from './types.js';

/**
 * Flächen-basierter Coverage-Anteil: % der Ziel-Polygon-Fläche mit Treffer.
 * NICHT feature-count (ADR-014 Abschnitt 3). `hitAreaM2` = Summe der
 * Intersect-Flächen der Source-Features im Ziel-Polygon (vom Caller berechnet).
 */
export function aggregateCoverageShare(
	hitAreaM2: number,
	polygonAreaM2: number
): CoverageShareAggregate {
	if (polygonAreaM2 <= 0) {
		return { type: 'coverage-share', share: 0 };
	}
	const share = Math.max(0, Math.min(100, (hitAreaM2 / polygonAreaM2) * 100));
	return { type: 'coverage-share', share: round1(share) };
}
