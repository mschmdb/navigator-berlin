import { formatCount, formatDecimal, formatPercent, formatWithUnit } from '$lib/i18n/format.js';
import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime.js';
import { STORY_INK, STORY_SERIES } from '../tokens';
import type { Kennzahlen } from './types';

export type ShapeKey = 'circle' | 'square' | 'triangle' | 'bar' | 'lines' | 'donut';

export interface LegendRow {
	readonly key: ShapeKey;
	readonly label: string;
	/** Fertig formatierter Wert, bei fehlenden Daten "keine Daten". */
	readonly value: string;
	readonly hasData: boolean;
	readonly color: string;
}

const COLORS = STORY_SERIES['punkt-linie-kiez'].colors;

export interface LegendShape {
	readonly key: ShapeKey;
	readonly label: string;
	readonly color: string;
}

/** Die sechs Formen mit Bedeutung, ohne Werte. Das Gesamtplakat nutzt nur diese Legende. */
export function legendShapes(locale?: Locale): LegendShape[] {
	const o = locale ? { locale } : undefined;
	return [
		{ key: 'circle', label: m.plk_legend_circle({}, o), color: COLORS.kreis.hex },
		{ key: 'square', label: m.plk_legend_square({}, o), color: COLORS.quadrat.hex },
		{ key: 'triangle', label: m.plk_legend_triangle({}, o), color: COLORS.dreieck.hex },
		{ key: 'bar', label: m.plk_legend_bar({}, o), color: COLORS.balken.hex },
		{ key: 'lines', label: m.plk_legend_lines({}, o), color: STORY_INK },
		{ key: 'donut', label: m.plk_legend_donut({}, o), color: COLORS.donut.hex }
	];
}

/** Sechs Zeilen in fester Reihenfolge. Fehlende Werte haben keinen Ersatz. */
export function legendRows(k: Kennzahlen, locale?: Locale): LegendRow[] {
	const o = locale ? { locale } : undefined;
	const none = m.plk_value_none({}, o);
	const row = (key: ShapeKey, label: string, color: string, value: string | null): LegendRow => ({
		key,
		label,
		color,
		value: value ?? none,
		hasData: value !== null
	});
	return [
		row(
			'circle',
			m.plk_legend_circle({}, o),
			COLORS.kreis.hex,
			k.gruen === null
				? null
				: m.plk_value_circle(
						{ value: formatDecimal(k.gruen * 100, { maximumFractionDigits: 0, locale }) },
						o
					)
		),
		row(
			'square',
			m.plk_legend_square({}, o),
			COLORS.quadrat.hex,
			k.altbauAnteil === null ? null : formatPercent(k.altbauAnteil, { decimals: 0, locale })
		),
		row(
			'triangle',
			m.plk_legend_triangle({}, o),
			COLORS.dreieck.hex,
			k.laermDb === null ? null : formatWithUnit(k.laermDb, 'dB', { locale })
		),
		row(
			'bar',
			m.plk_legend_bar({}, o),
			COLORS.balken.hex,
			k.bewohnerProKm2 === null
				? null
				: formatDecimal(k.bewohnerProKm2, { maximumFractionDigits: 0, locale })
		),
		row(
			'lines',
			m.plk_legend_lines({}, o),
			STORY_INK,
			k.haltestelle400mAnteil === null
				? null
				: m.plk_value_lines(
						{ value: formatPercent(k.haltestelle400mAnteil, { decimals: 1, locale }) },
						o
					)
		),
		row(
			'donut',
			m.plk_legend_donut({}, o),
			COLORS.donut.hex,
			k.clubs === null ? null : formatCount(k.clubs, { locale })
		)
	];
}
