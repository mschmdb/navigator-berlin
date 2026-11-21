import {
	NO_SCORE_FILL,
	scoreClassIndex
} from '#lib/components/atlas/internal/score-class-color.js';

/**
 * Score-Klassen der Karte auf den Kiez- und Bezirksseiten: dieselben Schwellen wie der
 * Score-Layer, aber deutlich gestufte Helligkeit (Kontrast je Nachbarstufe mindestens 1,5:1),
 * damit die Klassen auch ohne Farbsehen unterscheidbar bleiben.
 */
export const PLACE_MAP_FILLS = ['#D2DFCB', '#9DB898', '#5B8660', '#1F5A2E'] as const;

export function placeMapFill(score: number | null): string {
	if (score === null || !Number.isFinite(score)) return NO_SCORE_FILL;
	return PLACE_MAP_FILLS[scoreClassIndex(score)];
}
