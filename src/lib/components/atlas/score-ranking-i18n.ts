import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime.js';

export type NumericSortKey =
	| 'composite'
	| 'ruheLuft'
	| 'gruenHitze'
	| 'mobilitaet'
	| 'versorgung'
	| 'wohnschutz'
	| 'kultur';
export type StringSortKey = 'name' | 'bezirk';
export type SortKey = NumericSortKey | StringSortKey;

/** Spaltenkopf je Sortier-Schlüssel. Ruft `m.*` beim Aufruf, damit die Locale greift. */
export function columnLabel(key: SortKey): string {
	switch (key) {
		case 'name':
			return 'Name';
		case 'bezirk':
			return 'Bezirk';
		case 'composite':
			return 'Score';
		case 'ruheLuft':
			return m.uis_ranking_col_ruhe_luft();
		case 'gruenHitze':
			return m.uis_ranking_col_gruen_hitze();
		case 'mobilitaet':
			return m.uis_ranking_col_mobilitaet();
		case 'versorgung':
			return m.uis_ranking_col_versorgung();
		case 'wohnschutz':
			return m.uis_ranking_col_wohnschutz();
		case 'kultur':
			return m.uis_ranking_col_kultur();
	}
}

const COLLATOR_LOCALE: Record<Locale, string> = { de: 'de-DE', en: 'en-GB' };

export function collatorLocale(locale: Locale): string {
	return COLLATOR_LOCALE[locale];
}
