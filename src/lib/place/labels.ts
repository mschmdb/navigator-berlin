import { m } from '#lib/paraglide/messages.js';
import { dimensionLabel } from '#lib/components/atlas/inspector-panel/internal/kiez-score-display.js';
import { SCORE_DIMENSION_KEYS } from '#lib/data/comparison-types.js';
import { msgOpts, numberFormat, type LocaleOpts } from './locale';
import type { Dim } from './types';

/** Dimensionsnamen kommen aus der einen Quelle der Seite, in der gewählten Sprache. */
export function dimLabel(dim: Dim, opts?: LocaleOpts): string {
	if (dim === 'composite') return m.place_composite({}, msgOpts(opts));
	const key = SCORE_DIMENSION_KEYS.find((k) => k.field === dim)?.key;
	return key ? dimensionLabel(key, msgOpts(opts)) : dim;
}

export function formatScore(value: number | null, opts?: LocaleOpts): string {
	return value === null ? m.place_no_data({}, msgOpts(opts)) : numberFormat(0, opts).format(value);
}

/** Abstand in ganzen Punkten mit Vorzeichen: „+13“, „−16“, „±0“. */
export function signedPoints(diff: number): string {
	const n = Math.round(diff);
	if (n === 0) return '±0';
	return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}
