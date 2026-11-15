import type { TemplateLocale } from './template-schema.js';

/**
 * NAV-108: Klassen-Verteilungen (Grünversorgung, Lärm) als lesbarer Satz.
 *
 * Die Verteilung zählt Teilgebiete (LOR-Planungsräume) und speichert nur
 * Anteile, keine Anzahl. Einfache Brüche nennt der Satz deshalb in Worten
 * („vier Fünftel“), krumme Anteile in Prozent. Das Urteil steht vorn.
 */

export type ShareRegion = 'kiez' | 'bezirk';
export type ShareDist = Readonly<Record<string, number>>;

const FRACTIONS: readonly [number, number, Record<TemplateLocale, string>][] = [
	[1, 2, { de: 'die Hälfte', en: 'half' }],
	[1, 3, { de: 'ein Drittel', en: 'one third' }],
	[2, 3, { de: 'zwei Drittel', en: 'two thirds' }],
	[1, 4, { de: 'ein Viertel', en: 'one quarter' }],
	[3, 4, { de: 'drei Viertel', en: 'three quarters' }],
	[1, 5, { de: 'ein Fünftel', en: 'one fifth' }],
	[2, 5, { de: 'zwei Fünftel', en: 'two fifths' }],
	[3, 5, { de: 'drei Fünftel', en: 'three fifths' }],
	[4, 5, { de: 'vier Fünftel', en: 'four fifths' }]
];

const EPS = 0.005;

function simpleFraction(share: number): Record<TemplateLocale, string> | null {
	return FRACTIONS.find(([z, n]) => Math.abs(share - z / n) < EPS)?.[2] ?? null;
}

/** Anteil als Wort: einfacher Bruch oder gerundete Prozentzahl. */
export function shareWord(share: number, locale: TemplateLocale): string {
	const fraction = simpleFraction(share);
	if (fraction) return fraction[locale];
	return `${Math.round(share * 100)} ${locale === 'de' ? 'Prozent' : 'percent'}`;
}

/** Umgekehrt für die Prüfung: Wort zu Anteil, `null` bei unbekanntem Wort. */
export function shareFromWord(word: string, locale: TemplateLocale): number | null {
	const w = word.toLowerCase().replace(/^die andere hälfte$/, 'die hälfte');
	const fraction = FRACTIONS.find(([, , names]) => names[locale].toLowerCase() === w);
	if (fraction) return fraction[0] / fraction[1];
	const pct = /^(\d+) (?:prozent|percent)$/.exec(w);
	return pct ? Number(pct[1]) / 100 : null;
}

interface Vocab {
	readonly order: readonly string[];
	readonly alias?: Readonly<Record<string, string>>;
	/** Urteil zur Klasse, die mehr als die Hälfte stellt oder alles. */
	readonly verdict: Record<TemplateLocale, Record<string, string>>;
	/** Satzteil für die erste Klasse und für jede weitere Klasse. */
	readonly first: Record<TemplateLocale, (cls: string) => string>;
	readonly next: Record<TemplateLocale, (cls: string) => string>;
	readonly word: Record<TemplateLocale, Record<string, string>>;
	readonly verb: Record<TemplateLocale, { one: string; many: string }>;
}

const GRUEN: Vocab = {
	order: ['gut', 'mittel', 'schlecht'],
	verdict: {
		de: { gut: 'gut', mittel: 'mittel', schlecht: 'schlecht' },
		en: { gut: 'good', mittel: 'medium', schlecht: 'poor' }
	},
	word: {
		de: { gut: 'gut', mittel: 'mittel', schlecht: 'schlecht' },
		en: { gut: 'well served', mittel: 'moderately served', schlecht: 'poorly served' }
	},
	first: {
		de: (c) => `als ${c} mit Grün versorgt`,
		en: (c) => `as ${c} with green space`
	},
	next: { de: (c) => `als ${c}`, en: (c) => `as ${c}` },
	verb: { de: { one: 'gilt', many: 'gelten' }, en: { one: 'is rated', many: 'are rated' } }
};

const LAERM: Vocab = {
	order: ['gering', 'mittel', 'hoch', 'sehr hoch'],
	alias: { niedrig: 'gering', 'sehr niedrig': 'gering' },
	verdict: {
		de: { gering: 'Eher ruhig', mittel: 'Mäßig laut', hoch: 'Eher laut', 'sehr hoch': 'Laut' },
		en: {
			gering: 'Fairly quiet',
			mittel: 'Moderately loud',
			hoch: 'Fairly loud',
			'sehr hoch': 'Loud'
		}
	},
	word: {
		de: { gering: 'gering', mittel: 'mittel', hoch: 'hoch', 'sehr hoch': 'sehr hoch' },
		en: { gering: 'low', mittel: 'medium', hoch: 'high', 'sehr hoch': 'very high' }
	},
	first: {
		de: (c) => `in der Lärmklasse ${c}`,
		en: (c) => `in the noise class ${c}`
	},
	next: { de: (c) => `in der Klasse ${c}`, en: (c) => `in the class ${c}` },
	verb: { de: { one: 'liegt', many: 'liegen' }, en: { one: 'is', many: 'are' } }
};

const REGION: Record<TemplateLocale, Record<ShareRegion, string>> = {
	de: { kiez: 'Der ganze Kiez', bezirk: 'Der ganze Bezirk' },
	en: { kiez: 'the whole Kiez', bezirk: 'the whole district' }
};

const MIXED: Record<TemplateLocale, string> = { de: 'Gemischt', en: 'Mixed' };

function entries(dist: ShareDist, vocab: Vocab): [string, number][] {
	const merged = new Map<string, number>();
	for (const [raw, share] of Object.entries(dist)) {
		if (!(share > 0)) continue;
		const key = vocab.alias?.[raw.trim().toLowerCase()] ?? raw.trim().toLowerCase();
		merged.set(key, (merged.get(key) ?? 0) + share);
	}
	const rank = (k: string) => {
		const i = vocab.order.indexOf(k);
		return i === -1 ? vocab.order.length : i;
	};
	return [...merged.entries()].sort((a, b) => b[1] - a[1] || rank(a[0]) - rank(b[0]));
}

function joinList(items: readonly string[], and: string): string {
	if (items.length <= 1) return items.join('');
	return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

function capitalize(s: string): string {
	return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

function isSingular(share: number): boolean {
	const fraction = simpleFraction(share);
	return fraction
		? fraction.de.startsWith('ein ') || fraction.de === 'die Hälfte'
		: Math.round(share * 100) === 1;
}

/** DE richtet das Verb am Bruch aus („die Hälfte gilt“), EN am Plural („of the subareas are“). */
function shareVerb(vocab: Vocab, share: number, locale: TemplateLocale): string {
	return locale === 'de' && isSingular(share) ? vocab.verb.de.one : vocab.verb[locale].many;
}

/** Verdikt: Klasse mit Mehrheit, sonst „Gemischt“. Grün nennt den Senat. */
function verdictText(
	vocab: Vocab,
	list: [string, number][],
	locale: TemplateLocale,
	gruen: boolean
): string {
	const [top, share] = list[0];
	const majority = share > 0.5 + EPS || list.length === 1;
	const label = majority ? (vocab.verdict[locale][top] ?? top) : null;
	if (!gruen) return label ?? MIXED[locale];
	if (locale === 'de') {
		if (!label) return 'Laut Senat gemischt';
		return list.length === 1 ? `Laut Senat ${label}` : `Laut Senat überwiegend ${label}`;
	}
	if (!label) return 'Mixed, according to the Senate';
	const lead = list.length === 1 ? capitalize(label) : `Mostly ${label}`;
	return `${lead}, according to the Senate`;
}

function shareSentence(
	vocab: Vocab,
	dist: ShareDist,
	region: ShareRegion,
	locale: TemplateLocale,
	gruen: boolean
): string {
	const list = entries(dist, vocab);
	if (list.length === 0) return '';
	const w = (cls: string) => vocab.word[locale][cls] ?? cls;
	const verdict = verdictText(vocab, list, locale, gruen);
	const and = locale === 'de' ? 'und' : 'and';
	const of = locale === 'de' ? 'der Teilgebiete' : 'of the subareas';
	let body: string;
	if (list.length === 1) {
		const whole = REGION[locale][region];
		body = `${whole} ${vocab.verb[locale].one} ${vocab.first[locale](w(list[0][0]))}`;
	} else if (list.every(([, s]) => Math.abs(s - list[0][1]) < EPS) && simpleFraction(list[0][1])) {
		// Gleiche Anteile: „Je ein Drittel der Teilgebiete gilt als gut, mittel und schlecht …“
		const each =
			locale === 'de'
				? `je ${shareWord(list[0][1], locale)}`
				: `${shareWord(list[0][1], locale)} each`;
		const classes = joinList(
			list.map(([c]) => w(c)),
			and
		);
		const verb = shareVerb(vocab, list[0][1], locale);
		body =
			list.length === 2 && Math.abs(list[0][1] - 0.5) < EPS
				? `${shareWord(0.5, locale)} ${of} ${verb} ${vocab.first[locale](w(list[0][0]))}, ${locale === 'de' ? 'die andere Hälfte' : 'the other half'} ${vocab.next[locale](w(list[1][0]))}`
				: locale === 'de'
					? `${each} ${of} ${verb} ${vocab.first[locale](classes)}`
					: `${shareWord(list[0][1], locale)} ${of} each ${verb} ${vocab.first[locale](classes)}`;
	} else {
		const allSimple = list.every(([, s]) => simpleFraction(s));
		const word = (s: number) =>
			allSimple
				? shareWord(s, locale)
				: `${Math.round(s * 100)} ${locale === 'de' ? 'Prozent' : 'percent'}`;
		const [first, ...rest] = list;
		const verb = shareVerb(vocab, first[1], locale);
		const head = `${word(first[1])} ${of} ${verb} ${vocab.first[locale](w(first[0]))}`;
		const tail = rest.map(([c, s]) => `${word(s)} ${vocab.next[locale](w(c))}`);
		body = tail.length === 1 ? `${head}, ${tail[0]}` : `${head}, ${joinList(tail, and)}`;
	}
	// Urteil als eigener kurzer Satz, dann die Anteile.
	return `${verdict}. ${capitalize(body)}.`;
}

/** „Laut Senat überwiegend schlecht: Vier Fünftel der Teilgebiete gelten als schlecht …“ */
export function gruenSatz(dist: ShareDist, region: ShareRegion, locale: TemplateLocale): string {
	return shareSentence(GRUEN, dist, region, locale, true);
}

/** „Eher ruhig: Vier Fünftel der Teilgebiete liegen in der Lärmklasse gering …“ */
export function laermSatz(dist: ShareDist, region: ShareRegion, locale: TemplateLocale): string {
	return shareSentence(LAERM, dist, region, locale, false);
}

/** Vokabular für die Faktenprüfung (gleiche Quelle wie die Sätze). */
export const SHARE_VOCAB = { gruen: GRUEN, laerm: LAERM } as const;
