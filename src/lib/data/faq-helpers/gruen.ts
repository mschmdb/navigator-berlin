/**
 * Story 2.5b: Sub-Slot-Helper für Grün-Cluster.
 *
 * Werte stammen aus `gruenversorgung-2023` (ordinal-kategorisch pro Planungsraum)
 * plus aggregierte Zähler `gruenanlagenCount` / `spielplaetzeCount` aus
 * separaten Punkt-Layern.
 *
 * i18n Block B4a: `opts` mit DE-Default (Boundary: geteilte Helfer ohne
 * `opts.locale` bleiben DE). `describeGruenversorgungDe` rendert auch direkt
 * im Kiez-/Bezirk-Steckbrief (Client, übersetzt); `gruenErklaerungDe` bleibt
 * ausschließlich ein Server-FAQ-Slot (bleibt deutsch, ruft ohne `opts` auf).
 */
import { m } from '$lib/paraglide/messages.js';
import {
	toAtlasMessageOptions,
	type LocaleOptions
} from '../../components/atlas/internal/atlas-label-options.js';

export type GruenCategoryDe = 'gut' | 'mittel' | 'gering' | 'unbekannt';

/**
 * Quell-Layer `gruenversorgung-2023` publiziert die Werte `gut` / `mittel` /
 * `schlecht`. Wir normalisieren + akzeptieren zusätzlich `hoch` / `niedrig` /
 * `gering` damit der Helper robust gegenüber künftigen Layer-Wechseln bleibt.
 */
const NORMALISATION: Record<string, GruenCategoryDe> = {
	gut: 'gut',
	hoch: 'gut',
	'sehr hoch': 'gut',
	mittel: 'mittel',
	schlecht: 'gering',
	niedrig: 'gering',
	gering: 'gering'
};

function normalizeCategory(raw: string | null | undefined): GruenCategoryDe {
	if (!raw) return 'unbekannt';
	return NORMALISATION[raw.trim().toLowerCase()] ?? 'unbekannt';
}

export function describeGruenversorgungDe(
	raw: string | null | undefined,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeCategory(raw)) {
		case 'gut':
			return m.faq_helper_gruen_category_gut(undefined, options);
		case 'mittel':
			return m.faq_helper_gruen_category_mittel(undefined, options);
		case 'gering':
			return m.faq_helper_gruen_category_gering(undefined, options);
		default:
			return m.faq_helper_gruen_category_unbekannt(undefined, options);
	}
}

export function gruenErklaerungDe(raw: string | null | undefined, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeCategory(raw)) {
		case 'gut':
			return m.faq_helper_gruen_erklaerung_gut(undefined, options);
		case 'mittel':
			return m.faq_helper_gruen_erklaerung_mittel(undefined, options);
		case 'gering':
			return m.faq_helper_gruen_erklaerung_gering(undefined, options);
		default:
			return m.faq_helper_gruen_erklaerung_unbekannt(undefined, options);
	}
}
