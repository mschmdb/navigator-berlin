import { m } from '$lib/paraglide/messages.js';
import { getLocale } from '$lib/paraglide/runtime';

export interface CategoryLabel {
	readonly text: string;
	/** Gesetzt, wenn der Rohwert unübersetzt auf einer anderssprachigen Seite steht. */
	readonly lang?: 'de';
}

const LABELS: Readonly<Record<string, () => string>> = {
	Museum: () => m.naehe_cat_museum(),
	Bibliothek: () => m.naehe_cat_bibliothek(),
	'Mall/Center': () => m.naehe_cat_mall(),
	Kino: () => m.naehe_cat_kino(),
	Schwimmzentrum: () => m.naehe_cat_schwimmzentrum(),
	Kirche: () => m.naehe_cat_kirche(),
	Kaufhaus: () => m.naehe_cat_kaufhaus(),
	Eishalle: () => m.naehe_cat_eishalle(),
	Bad: () => m.naehe_cat_bad(),
	Wasserpark: () => m.naehe_cat_wasserpark(),
	Stadtteilzentrum: () => m.naehe_cat_stadtteilzentrum()
};

/** Kategorie-Rohwert (deutsch, aus den Daten) als Anzeigetext der Seiten-Locale. */
export function categoryLabel(raw: string): CategoryLabel {
	const label = Object.hasOwn(LABELS, raw) ? LABELS[raw] : undefined;
	if (label) return { text: label() };
	return getLocale() === 'de' ? { text: raw } : { text: raw, lang: 'de' };
}
