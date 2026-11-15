import { m } from '$lib/paraglide/messages.js';
import { dimensionLabel } from '$lib/components/atlas/inspector-panel/internal/kiez-score-display.js';
import { SCORE_DIMENSION_KEYS } from '$lib/data/comparison-types.js';
import { msgOpts, numberFormat, numberLocale, type LocaleOpts } from './locale';
import type { Dim } from './types';

/** Dimensionsnamen kommen aus der einen Quelle der Seite, in der gewählten Sprache. */
export function dimLabel(dim: Dim, opts?: LocaleOpts): string {
	if (dim === 'composite') return m.skizze_composite({}, msgOpts(opts));
	const key = SCORE_DIMENSION_KEYS.find((k) => k.field === dim)?.key;
	return key ? dimensionLabel(key, msgOpts(opts)) : dim;
}

export function formatScore(value: number | null, opts?: LocaleOpts): string {
	return value === null ? m.skizze_no_data({}, msgOpts(opts)) : numberFormat(0, opts).format(value);
}

export function formatInt(value: number, opts?: LocaleOpts): string {
	return numberFormat(0, opts).format(value);
}

export function formatPercent(share01: number, opts?: LocaleOpts): string {
	return `${numberFormat(0, opts).format(share01 * 100)} %`;
}

/** Ganze Prozent aus einem Wert in 0 bis 100: „12 %“ (de), „12%“ (en). */
export function fmtPct(value: number, opts?: LocaleOpts): string {
	return msgOpts(opts).locale === 'en' ? `${Math.round(value)}%` : `${Math.round(value)} %`;
}

/** Fläche in km² mit einer Nachkommastelle. */
export function formatKm2(value: number, opts?: LocaleOpts): string {
	return new Intl.NumberFormat(numberLocale(opts), { maximumFractionDigits: 1 }).format(value);
}
