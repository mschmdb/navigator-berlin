/**
 * Story 2.5b: Sub-Slot-Helper für Grün-Cluster.
 *
 * Werte stammen aus `gruenversorgung-2023` (ordinal-kategorisch pro Planungsraum)
 * plus aggregierte Zähler `gruenanlagenCount` / `spielplaetzeCount` aus
 * separaten Punkt-Layern.
 *
 * i18n Block B4a: `opts` mit DE-Default (Boundary: geteilte Helfer ohne
 * `opts.locale` bleiben DE). `describeGruenversorgungDe` rendert auch direkt
 * im Kiez-/Bezirk-Steckbrief (Client, übersetzt).
 * Die FAQ-Sätze stehen seit NAV-108 in `src/lib/server/faq/fact-phrases.ts`.
 */
import { m } from '#lib/paraglide/messages.js';
import {
	toAtlasMessageOptions,
	type LocaleOptions
} from '../../components/atlas/internal/atlas-label-options.js';

export type GruenCategoryDe = 'gut' | 'mittel' | 'schlecht' | 'unbekannt';

/**
 * Quell-Layer `gruenversorgung-2023` publiziert die Werte `gut` / `mittel` /
 * `schlecht`. Der Helper nennt diese Senats-Stufen (NAV-108) und mappt ältere
 * Bezeichnungen (`hoch` / `niedrig` / `gering`) darauf.
 */
const NORMALISATION: Record<string, GruenCategoryDe> = {
	gut: 'gut',
	hoch: 'gut',
	'sehr hoch': 'gut',
	mittel: 'mittel',
	schlecht: 'schlecht',
	niedrig: 'schlecht',
	gering: 'schlecht'
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
		case 'schlecht':
			// Message-Key heißt historisch `_gering`, der Text ist seit NAV-108 „schlecht“.
			return m.faq_helper_gruen_category_gering(undefined, options);
		default:
			return m.faq_helper_gruen_category_unbekannt(undefined, options);
	}
}
