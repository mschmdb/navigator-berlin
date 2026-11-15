/**
 * Story 2.5b T3.3: Sub-Slot-Helper für Lärm-Cluster.
 *
 * Mapped die ordinal-kategorialen Lärm-Werte (`hoch` / `mittel` / `niedrig`)
 * aus dem Berliner Lärmkartierungs-Datensatz (laerm-2023) auf
 * lesbare Substantive für FAQ-Antworten.
 *
 * Memory `project_compare_editorial_profiles`: laerm-2023 ist ordinal-kategorisch
 * (Pegel-Klassen pro Planungsraum), NICHT numerische Mittelwerte in dB.
 * Templates dürfen daher KEINE konkreten dB-Zahlen wie „58 dB L_DEN"
 * behaupten, sondern nur Kategorie-Begriffe.
 *
 * i18n Block B4a: `opts` mit DE-Default (Boundary: geteilte Helfer ohne
 * `opts.locale` bleiben DE). `describeLaermCategoryDe` rendert auch direkt
 * im Kiez-/Bezirk-Steckbrief (Client, übersetzt).
 * Die FAQ-Sätze stehen seit NAV-108 in `src/lib/server/faq/fact-phrases.ts`.
 */
import { m } from '$lib/paraglide/messages.js';
import {
	toAtlasMessageOptions,
	type LocaleOptions
} from '../../components/atlas/internal/atlas-label-options.js';

export type LaermCategoryDe = 'leise' | 'mittel' | 'laut' | 'sehr laut' | 'unbekannt';

const NORMALISATION: Record<string, LaermCategoryDe> = {
	niedrig: 'leise',
	gering: 'leise',
	mittel: 'mittel',
	hoch: 'laut',
	'sehr hoch': 'sehr laut'
};

function normalizeCategory(raw: string | null | undefined): LaermCategoryDe {
	if (!raw) return 'unbekannt';
	const key = raw.trim().toLowerCase();
	return NORMALISATION[key] ?? 'unbekannt';
}

export function describeLaermCategoryDe(
	raw: string | null | undefined,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeCategory(raw)) {
		case 'leise':
			return m.faq_helper_laerm_category_leise(undefined, options);
		case 'mittel':
			return m.faq_helper_laerm_category_mittel(undefined, options);
		case 'laut':
			return m.faq_helper_laerm_category_laut(undefined, options);
		case 'sehr laut':
			return m.faq_helper_laerm_category_sehr_laut(undefined, options);
		default:
			return m.faq_helper_laerm_category_unbekannt(undefined, options);
	}
}
