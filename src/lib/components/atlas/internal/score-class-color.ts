import { DIMENSION_RAMPS } from './dimension-ramps.js';
import { SCALE_STAGE_SUBSETS } from './choropleth-family.js';

/** Grau für Kieze ohne Score (entspricht `--rule` in app.css). */
export const NO_SCORE_FILL = '#c8c6bb';

/** Klassenbeginn des Score-Layers (Schwellen 0/26/51/76). Karte und Bezirksseite teilen sie. */
export const SCORE_CLASS_START = [0, 26, 51, 76] as const;
const CLASS_START = SCORE_CLASS_START;

/** Paare (Schwelle, Farbe) für ein MapLibre-`step`, Stufen 1/2/4/5 der Rampe. */
export function scoreClassStops(ramp: readonly string[]): (number | string)[] {
	return CLASS_START.flatMap((start, i) => [start, ramp[SCALE_STAGE_SUBSETS[4][i] - 1]]);
}

/** Klassenindex 0-3 des Score-Layers (Schwellen 0/26/51/76). */
export function scoreClassIndex(score: number): number {
	const clamped = Math.max(0, Math.min(100, score));
	let index = 0;
	CLASS_START.forEach((start, i) => {
		if (clamped >= start) index = i;
	});
	return index;
}

/** Füllfarbe wie der Gesamt-Score-Layer (Stufen 1/2/4/5 der Gesamt-Rampe). */
export function scoreClassFill(score: number | null): string {
	if (score === null || !Number.isFinite(score)) return NO_SCORE_FILL;
	const stage = SCALE_STAGE_SUBSETS[4][scoreClassIndex(score)];
	return DIMENSION_RAMPS.gesamt[stage - 1];
}
