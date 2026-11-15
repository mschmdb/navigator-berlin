import type { TemplateLocale } from './template-schema.js';

/**
 * NAV-108: Satzbausteine, die Fakten aus dem Aggregat in die FAQ bringen.
 *
 * ÖPNV: Verkehrsmittel stehen nur noch dort, wo der Datensatz Halte zählt.
 * Grün: Die FAQ nennt die Klassen des Senats (gut, mittel, schlecht) wörtlich
 * und mit Anteil, statt sie auf eine andere Skala umzubenennen.
 */

const NUMBER_LOCALE: Record<TemplateLocale, string> = { de: 'de-DE', en: 'en-GB' };

export interface OepnvCounts {
	readonly uBahnCount: number | null;
	readonly sBahnCount: number | null;
	readonly tramCount: number | null;
	readonly busCount: number | null;
}

interface ModeWords {
	readonly one: string;
	readonly many: string;
	readonly none: string;
}

const MODE_WORDS: Record<TemplateLocale, Record<keyof OepnvCounts, ModeWords>> = {
	de: {
		uBahnCount: { one: 'U-Bahnhof', many: 'U-Bahnhöfe', none: 'keinen U-Bahnhof' },
		sBahnCount: { one: 'S-Bahnhof', many: 'S-Bahnhöfe', none: 'keinen S-Bahnhof' },
		tramCount: { one: 'Tramhaltestelle', many: 'Tramhaltestellen', none: 'keine Tramhaltestelle' },
		busCount: { one: 'Bushaltestelle', many: 'Bushaltestellen', none: 'keine Bushaltestelle' }
	},
	en: {
		uBahnCount: { one: 'U-Bahn station', many: 'U-Bahn stations', none: 'no U-Bahn station' },
		sBahnCount: { one: 'S-Bahn station', many: 'S-Bahn stations', none: 'no S-Bahn station' },
		tramCount: { one: 'tram stop', many: 'tram stops', none: 'no tram stop' },
		busCount: { one: 'bus stop', many: 'bus stops', none: 'no bus stop' }
	}
};

const MODE_ORDER: readonly (keyof OepnvCounts)[] = [
	'uBahnCount',
	'sBahnCount',
	'tramCount',
	'busCount'
];

const SENTENCES: Record<
	TemplateLocale,
	{
		counts: (list: string) => string;
		missing: (list: string) => string;
		empty: string;
		and: string;
	}
> = {
	de: {
		counts: (list) => `Der Datensatz zählt hier ${list}.`,
		missing: (list) => `Es gibt ${list}.`,
		empty: 'Der Datensatz zählt hier keine Halte.',
		and: 'und'
	},
	en: {
		counts: (list) => `The dataset counts ${list} here.`,
		missing: (list) => `There is ${list}.`,
		empty: 'The dataset counts no stops here.',
		and: 'and'
	}
};

function joinList(items: readonly string[], and: string): string {
	if (items.length <= 1) return items.join('');
	return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

/** Zählt vorhandene Verkehrsmittel und verneint fehlende. Ohne Zähldaten: leerer Text. */
export function oepnvModiSatz(counts: OepnvCounts, locale: TemplateLocale): string {
	const known = MODE_ORDER.filter((key) => counts[key] !== null);
	if (known.length === 0) return '';
	const words = MODE_WORDS[locale];
	const s = SENTENCES[locale];
	const present = known
		.filter((key) => (counts[key] ?? 0) > 0)
		.map((key) => {
			const n = counts[key] ?? 0;
			return `${n.toLocaleString(NUMBER_LOCALE[locale])} ${n === 1 ? words[key].one : words[key].many}`;
		});
	const missing = known.filter((key) => counts[key] === 0).map((key) => words[key].none);
	if (present.length === 0) {
		// Pauschal „keine Halte“ nur, wenn alle vier Zählungen bekannt sind.
		return known.length === MODE_ORDER.length ? s.empty : s.missing(joinList(missing, s.and));
	}
	const parts = [s.counts(joinList(present, s.and))];
	if (missing.length > 0) parts.push(s.missing(joinList(missing, s.and)));
	return parts.join(' ');
}

/** Senats-Klassen der Grünversorgung (Umweltatlas 2023); EN übersetzt, Rohwert sonst. */
const GRUEN_WORD: Record<TemplateLocale, Record<string, string>> = {
	de: { gut: 'gut', mittel: 'mittel', schlecht: 'schlecht' },
	en: { gut: 'good', mittel: 'medium', schlecht: 'poor' }
};

function quote(raw: string, locale: TemplateLocale): string {
	const word = GRUEN_WORD[locale][raw] ?? raw;
	return locale === 'de' ? `„${word}“` : `“${word}”`;
}

function sortedShares(dist: Readonly<Record<string, number>>): [string, number][] {
	return Object.entries(dist)
		.filter(([, share]) => share > 0)
		.sort((a, b) => b[1] - a[1]);
}

const EINSTUFUNG: Record<
	TemplateLocale,
	{ all: string; most: string; half: string; plurality: string; and: string }
> = {
	de: {
		all: 'durchgehend als',
		most: 'überwiegend als',
		half: 'je zur Hälfte als',
		plurality: 'am häufigsten als',
		and: 'und'
	},
	en: {
		all: 'throughout as',
		most: 'mostly as',
		half: 'half each as',
		plurality: 'most often as',
		and: 'and'
	}
};

/** „überwiegend als „schlecht““: häufigste Senats-Klasse mit passender Mengenangabe. */
export function gruenEinstufung(
	dist: Readonly<Record<string, number>>,
	locale: TemplateLocale
): string {
	const shares = sortedShares(dist);
	if (shares.length === 0) return '';
	const top = shares[0][1];
	const tied = shares.filter(([, share]) => share === top).map(([raw]) => quote(raw, locale));
	const e = EINSTUFUNG[locale];
	const classes = joinList(tied, e.and);
	if (tied.length === 1 && top >= 0.995) return `${e.all} ${classes}`;
	if (tied.length === 1 && top > 0.5) return `${e.most} ${classes}`;
	if (tied.length === 2 && Math.abs(top - 0.5) < 0.005) return `${e.half} ${classes}`;
	return `${e.plurality} ${classes}`;
}

/** „„schlecht“ 80 %, „mittel“ 20 %“: Anteile der Planungsräume, absteigend. */
export function gruenVerteilung(
	dist: Readonly<Record<string, number>>,
	locale: TemplateLocale
): string {
	const sep = locale === 'de' ? ' %' : '%';
	return sortedShares(dist)
		.map(([raw, share]) => `${quote(raw, locale)} ${Math.round(share * 100)}${sep}`)
		.join(', ');
}
