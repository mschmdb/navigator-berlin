/**
 * Story 2.5b: Sub-Slot-Helper für Mobilität-Cluster (ÖPNV-Dichte).
 *
 * Werte stammen aus `oepnv-composite` (Stops pro km²), aggregiert aus
 * BVG/VBB-Stops + S-Bahn-Stationen pro Bezirksregion.
 *
 * i18n Block B4a: `opts` mit DE-Default (Boundary: geteilte Helfer ohne
 * `opts.locale` bleiben DE). `describeOepnvDichte`/`formatStopsPerKm2`
 * rendern auch direkt im Kiez-/Bezirk-Steckbrief (Client, übersetzt);
 * `oepnvErklaerungDe` bleibt ausschließlich ein Server-FAQ-Slot (bleibt
 * deutsch).
 */
import { m } from '$lib/paraglide/messages.js';
import { formatDecimal, type LocaleFormatOptions } from '$lib/i18n/format.js';
import {
	toAtlasMessageOptions,
	type LocaleOptions
} from '../../components/atlas/internal/atlas-label-options.js';

export type OepnvDichte = 'sehr dicht' | 'dicht' | 'mittel' | 'dünn' | 'unbekannt';

function normalizeDichte(stopsPerKm2: number | null | undefined): OepnvDichte {
	if (stopsPerKm2 === null || stopsPerKm2 === undefined) return 'unbekannt';
	if (stopsPerKm2 >= 20) return 'sehr dicht';
	if (stopsPerKm2 >= 12) return 'dicht';
	if (stopsPerKm2 >= 6) return 'mittel';
	return 'dünn';
}

export function describeOepnvDichte(
	stopsPerKm2: number | null | undefined,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeDichte(stopsPerKm2)) {
		case 'sehr dicht':
			return m.faq_helper_oepnv_dichte_sehr_dicht(undefined, options);
		case 'dicht':
			return m.faq_helper_oepnv_dichte_dicht(undefined, options);
		case 'mittel':
			return m.faq_helper_oepnv_dichte_mittel(undefined, options);
		case 'dünn':
			return m.faq_helper_oepnv_dichte_duenn(undefined, options);
		default:
			return m.faq_helper_oepnv_dichte_unbekannt(undefined, options);
	}
}

export function oepnvErklaerungDe(
	stopsPerKm2: number | null | undefined,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeDichte(stopsPerKm2)) {
		case 'sehr dicht':
			return m.faq_helper_oepnv_erklaerung_sehr_dicht(undefined, options);
		case 'dicht':
			return m.faq_helper_oepnv_erklaerung_dicht(undefined, options);
		case 'mittel':
			return m.faq_helper_oepnv_erklaerung_mittel(undefined, options);
		case 'dünn':
			return m.faq_helper_oepnv_erklaerung_duenn(undefined, options);
		default:
			return m.faq_helper_oepnv_erklaerung_unbekannt(undefined, options);
	}
}

/** i18n Block B4a: Zahl über `format.ts::formatDecimal` (ersetzt `toLocaleString('de-DE', ...)`). */
export function formatStopsPerKm2(value: number, opts?: LocaleFormatOptions): string {
	return formatDecimal(value, {
		locale: opts?.locale ?? 'de',
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
}
