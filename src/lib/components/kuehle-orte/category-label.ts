import { m } from '$lib/paraglide/messages.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime';

export interface CategoryLabel {
	readonly text: string;
	/** Gesetzt, wenn der Rohwert unübersetzt auf einer anderssprachigen Seite steht. */
	readonly lang?: 'de';
}

const LABELS: Readonly<Record<string, (locale: Locale) => string>> = {
	Museum: (locale) => m.naehe_cat_museum(undefined, { locale }),
	Bibliothek: (locale) => m.naehe_cat_bibliothek(undefined, { locale }),
	'Mall/Center': (locale) => m.naehe_cat_mall(undefined, { locale }),
	Mall: (locale) => m.naehe_cat_mall_plain(undefined, { locale }),
	Gotteshaus: (locale) => m.naehe_cat_gotteshaus(undefined, { locale }),
	Kino: (locale) => m.naehe_cat_kino(undefined, { locale }),
	Schwimmzentrum: (locale) => m.naehe_cat_schwimmzentrum(undefined, { locale }),
	Kirche: (locale) => m.naehe_cat_kirche(undefined, { locale }),
	Kaufhaus: (locale) => m.naehe_cat_kaufhaus(undefined, { locale }),
	Eishalle: (locale) => m.naehe_cat_eishalle(undefined, { locale }),
	Bad: (locale) => m.naehe_cat_bad(undefined, { locale }),
	Wasserpark: (locale) => m.naehe_cat_wasserpark(undefined, { locale }),
	Stadtteilzentrum: (locale) => m.naehe_cat_stadtteilzentrum(undefined, { locale })
};

/** Kategorie-Rohwert (deutsch, aus den Daten) als Anzeigetext der Seiten-Locale. */
export function categoryLabel(raw: string, locale: Locale = getLocale()): CategoryLabel {
	const label = Object.hasOwn(LABELS, raw) ? LABELS[raw] : undefined;
	if (label) return { text: label(locale) };
	return locale === 'de' ? { text: raw } : { text: raw, lang: 'de' };
}
