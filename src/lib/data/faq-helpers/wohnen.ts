/**
 * Story 2.5b: Sub-Slot-Helper für Wohnen-Cluster.
 *
 * Quellen:
 * - Mietspiegel-Wohnlage 2024 (ordinal-kategorisch: einfach / mittel / gut),
 * - Monitoring Soziale Stadtentwicklung (MSS, ordinal: niedrig / mittel / hoch),
 * - Bodenrichtwerte (BRW, numerisch in €/m² Grundstückspreis).
 *
 * Sprachliche Disziplin (Memory `project_compare_editorial_profiles`,
 * `feedback_no_lebenswert`): KEINE evaluativen Adjektive wie „gut/schlecht"
 * über ganze Kieze; ausschließlich kategoriale Beschreibungen aus der Quelle.
 *
 * i18n Block B4a: `opts` mit DE-Default (Boundary: geteilte Helfer ohne
 * `opts.locale` bleiben DE). `describeWohnlageDe`/`mssBeschreibungDe`
 * rendern auch direkt im Kiez-/Bezirk-Steckbrief (Client, übersetzt);
 * `describeMssDe` bleibt ausschließlich ein Server-FAQ-Zwischenschritt.
 */
import { m } from '$lib/paraglide/messages.js';
import {
	toAtlasMessageOptions,
	type LocaleOptions
} from '../../components/atlas/internal/atlas-label-options.js';

export type WohnlageDe = 'einfache Wohnlage' | 'mittlere Wohnlage' | 'gute Wohnlage' | 'unbekannt';

const WOHNLAGE_MAP: Record<string, WohnlageDe> = {
	einfach: 'einfache Wohnlage',
	'einfache wohnlage': 'einfache Wohnlage',
	mittel: 'mittlere Wohnlage',
	'mittlere wohnlage': 'mittlere Wohnlage',
	gut: 'gute Wohnlage',
	'gute wohnlage': 'gute Wohnlage'
};

function normalizeWohnlage(raw: string | null | undefined): WohnlageDe {
	if (!raw) return 'unbekannt';
	return WOHNLAGE_MAP[raw.trim().toLowerCase()] ?? 'unbekannt';
}

export function describeWohnlageDe(raw: string | null | undefined, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeWohnlage(raw)) {
		case 'einfache Wohnlage':
			return m.faq_helper_wohnen_wohnlage_einfach(undefined, options);
		case 'mittlere Wohnlage':
			return m.faq_helper_wohnen_wohnlage_mittel(undefined, options);
		case 'gute Wohnlage':
			return m.faq_helper_wohnen_wohnlage_gut(undefined, options);
		default:
			return m.faq_helper_wohnen_wohnlage_unbekannt(undefined, options);
	}
}

export type MssDe = 'sehr niedrig' | 'niedrig' | 'mittel' | 'hoch' | 'sehr hoch' | 'unbekannt';

const MSS_MAP: Record<string, MssDe> = {
	'sehr niedrig': 'sehr niedrig',
	niedrig: 'niedrig',
	mittel: 'mittel',
	hoch: 'hoch',
	'sehr hoch': 'sehr hoch'
};

function normalizeMss(raw: string | null | undefined): MssDe {
	if (!raw) return 'unbekannt';
	return MSS_MAP[raw.trim().toLowerCase()] ?? 'unbekannt';
}

export function describeMssDe(raw: string | null | undefined, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeMss(raw)) {
		case 'sehr niedrig':
			return m.faq_helper_wohnen_mss_sehr_niedrig(undefined, options);
		case 'niedrig':
			return m.faq_helper_wohnen_mss_niedrig(undefined, options);
		case 'mittel':
			return m.faq_helper_wohnen_mss_mittel(undefined, options);
		case 'hoch':
			return m.faq_helper_wohnen_mss_hoch(undefined, options);
		case 'sehr hoch':
			return m.faq_helper_wohnen_mss_sehr_hoch(undefined, options);
		default:
			return m.faq_helper_wohnen_mss_unbekannt(undefined, options);
	}
}

/**
 * Stigma-disziplinierte Beschreibung der MSS-Kategorie für FAQ-Antworten.
 * Bezieht sich immer auf den Aggregat-Raum (Bezirk/Kiez), niemals auf einzelne
 * Adressen. Vermeidet wertende Begriffe wie „schlechte Lage" oder „sozial schwach".
 */
export function mssBeschreibungDe(raw: string | null | undefined, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeMss(raw)) {
		case 'sehr niedrig':
			return m.faq_helper_wohnen_mss_erklaerung_sehr_niedrig(undefined, options);
		case 'niedrig':
			return m.faq_helper_wohnen_mss_erklaerung_niedrig(undefined, options);
		case 'mittel':
			return m.faq_helper_wohnen_mss_erklaerung_mittel(undefined, options);
		case 'hoch':
			return m.faq_helper_wohnen_mss_erklaerung_hoch(undefined, options);
		case 'sehr hoch':
			return m.faq_helper_wohnen_mss_erklaerung_sehr_hoch(undefined, options);
		default:
			return m.faq_helper_wohnen_mss_erklaerung_unbekannt(undefined, options);
	}
}
