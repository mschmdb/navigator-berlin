/**
 * Themen statt Score: Die Seite ordnet sich nach den Fragen der Leute („Wie laut ist es da?“).
 * Jedes Kapitel zeigt gemessene Werte in echten Einheiten. Score-Punkte erscheinen nur in
 * Karte, Einstiegszeile und Überblick am Ende.
 */

import { msgOpts, numberFormat, type LocaleOpts } from './locale';
import { m } from '$lib/paraglide/messages.js';
import { LABEL_TEXT, METRIC_TEXT, CHAPTER_TEXT, VALUE_TEXT } from './topics-text';

export const METRICS = [
	'laermDb',
	'luftHoch',
	'gruenanlagen',
	'gruenSchlecht',
	'pet',
	'bestandsmiete',
	'altbau',
	'milieuschutz',
	'haltestellenKm2',
	'haltestelle400m',
	'bahnhoefe',
	'lebensmittel10k',
	'apotheken',
	'kitas',
	'schulen',
	'kulturorte',
	'dichte',
	'kriminalitaet'
] as const;
export type MetricId = (typeof METRICS)[number];
export type MetricValues = Readonly<Record<MetricId, number | null>>;

/** Kategorien als Text (überwiegende Klasse), etwa Lärmklasse oder soziale Lage. */
export const LABELS = ['laermKlasse', 'mss', 'gruenversorgung'] as const;
export type LabelId = (typeof LABELS)[number];
export type LabelValues = Readonly<Record<LabelId, string | null>>;

/** Messwert ohne Text: Texte stehen in `topics-text.ts` und kommen über `metricText`. */
export interface MetricSpec {
	readonly digits: number;
	/** `percent` und `count` steuern Formatierung und Auswahl, nicht die Sprache der Einheit. */
	readonly unitKind: 'percent' | 'count' | 'other';
	/** Auf Bezirksebene nicht vorhanden. */
	readonly kiezOnly?: boolean;
	/**
	 * Lesehilfe nur, wo die Richtung für fast alle gilt (leiser, grüner, kühler, näher).
	 * Ohne Wertung bleiben Miete, Altbau, Milieuschutz, Dichte, soziale Lage, Kriminalität und Zählwerte.
	 */
	readonly better?: 'higher' | 'lower';
	/** Viele Nullen ohne Aussage (Milieuschutz): Nullblock und typischer Wert ohne die Nullen. Echte Nullen (kein Bahnhof) zählen normal. */
	readonly zeroPile?: true;
}

export interface MetricText {
	readonly label: string;
	readonly unit: string;
	/** Ein Satz, was gemessen wird, für Erstbesucher. */
	readonly what: string;
	readonly source: string;
	/** Vergleichswörter: „lauter“ / „leiser“. Bei Kriminalität bewusst ohne Wertung. */
	readonly higher: string;
	readonly lower: string;
	/** Großer Nullstapel bekommt einen eigenen Block, siehe StripChart. */
	readonly zeroName?: string;
	readonly zeroMedianLabel?: string;
}

export const METRIC_SPECS: Readonly<Record<MetricId, MetricSpec>> = {
	laermDb: { digits: 1, unitKind: 'other', better: 'lower' },
	luftHoch: { digits: 0, unitKind: 'percent', better: 'lower', zeroPile: true },
	gruenanlagen: { digits: 1, unitKind: 'percent', better: 'higher' },
	gruenSchlecht: { digits: 0, unitKind: 'percent', better: 'lower', zeroPile: true },
	pet: { digits: 1, unitKind: 'other', better: 'lower' },
	bestandsmiete: { digits: 2, unitKind: 'other' },
	altbau: { digits: 0, unitKind: 'percent' },
	milieuschutz: { digits: 0, unitKind: 'percent', zeroPile: true },
	haltestellenKm2: { digits: 1, unitKind: 'other', better: 'higher' },
	haltestelle400m: { digits: 0, unitKind: 'percent', better: 'higher' },
	bahnhoefe: { digits: 0, unitKind: 'count' },
	lebensmittel10k: { digits: 1, unitKind: 'other', better: 'higher' },
	apotheken: { digits: 1, unitKind: 'other' },
	kitas: { digits: 1, unitKind: 'other' },
	schulen: { digits: 1, unitKind: 'other' },
	kulturorte: { digits: 1, unitKind: 'other' },
	dichte: { digits: 0, unitKind: 'other' },
	kriminalitaet: { digits: 0, unitKind: 'other' }
};

export function metricText(id: MetricId, opts?: LocaleOpts): MetricText {
	const o = msgOpts(opts);
	const t = METRIC_TEXT[id];
	return {
		label: t.label({}, o),
		unit: t.unit({}, o),
		what: t.what({}, o),
		source: t.source({}, o),
		higher: t.higher({}, o),
		lower: t.lower({}, o),
		zeroName: t.zeroName?.({}, o),
		zeroMedianLabel: t.zeroMedianLabel?.({}, o)
	};
}

export type ChapterId =
	| 'laerm'
	| 'gruen'
	| 'wohnen'
	| 'unterwegs'
	| 'versorgung'
	| 'menschen'
	| 'wahlen'
	| 'nachbarn';

export interface ChapterSpec {
	readonly id: ChapterId;
	/** Hauptgrafik: eine oder zwei Verteilungen. */
	readonly main: readonly MetricId[];
	/** Nebenwerte als kurze Tabelle. */
	readonly side: readonly MetricId[];
	readonly labels?: readonly LabelId[];
	/** Layer für „Auf der Karte“. */
	readonly mapLayers?: string;
	/** FAQ-Cluster, die zu diesem Kapitel gehören. */
	readonly faq?: readonly string[];
	/** Ohne Rang und Wertung (Kriminalität). */
	readonly neutral?: boolean;
}

export const CHAPTERS: readonly ChapterSpec[] = [
	{
		id: 'laerm',
		main: ['laermDb'],
		side: ['luftHoch'],
		labels: ['laermKlasse'],
		mapLayers: 'laerm-2023',
		faq: ['laerm']
	},
	{
		id: 'gruen',
		main: ['gruenanlagen', 'pet'],
		side: ['gruenSchlecht'],
		labels: ['gruenversorgung'],
		mapLayers: 'gruenanlagen,klima-pet-2022',
		faq: ['gruen', 'klima']
	},
	{
		id: 'wohnen',
		main: ['bestandsmiete'],
		side: ['altbau', 'milieuschutz'],
		mapLayers: 'zensus-bestandsmiete-2022',
		faq: ['wohnen']
	},
	{
		id: 'unterwegs',
		main: ['haltestellenKm2'],
		side: ['haltestelle400m', 'bahnhoefe'],
		mapLayers: 'ubahn-stationen,sbahn-stationen,tram-haltestellen,bus-haltestellen',
		faq: ['oepnv']
	},
	{
		id: 'versorgung',
		main: ['lebensmittel10k'],
		side: ['apotheken', 'kitas', 'schulen', 'kulturorte'],
		mapLayers: 'nahversorgung-lebensmittel,nahversorgung-apotheke'
	},
	{
		id: 'menschen',
		main: ['dichte'],
		side: ['kriminalitaet'],
		labels: ['mss'],
		mapLayers: 'einwohner-dichte-2024',
		neutral: true
	}
];

export interface LabelText {
	readonly label: string;
	readonly what: string;
}

export function labelText(id: LabelId, opts?: LocaleOpts): LabelText {
	const o = msgOpts(opts);
	return { label: LABEL_TEXT[id].label({}, o), what: LABEL_TEXT[id].what({}, o) };
}

/** Titel und Kurzname eines Kapitels (Sprungleiste), in der gewählten Sprache. */
export function chapterText(id: ChapterId, opts?: LocaleOpts): { short: string; title: string } {
	const t = CHAPTER_TEXT[id];
	const o = msgOpts(opts);
	return t ? { short: t.short({}, o), title: t.title({}, o) } : { short: id, title: id };
}

/** Kategorie aus den Layer-Daten in Worten; Unbekanntes bleibt wie geliefert. */
export function labelValueText(value: string, opts?: LocaleOpts): string {
	const fn = Object.hasOwn(VALUE_TEXT, value) ? VALUE_TEXT[value] : undefined;
	return fn ? fn({}, msgOpts(opts)) : value;
}

function unitSeparator(id: MetricId, opts?: LocaleOpts): string {
	return METRIC_SPECS[id].unitKind === 'percent' && msgOpts(opts).locale === 'en' ? '' : '\u00a0';
}

export function formatMetric(id: MetricId, value: number | null, opts?: LocaleOpts): string {
	if (value === null) return m.place_no_data({}, msgOpts(opts));
	const spec = METRIC_SPECS[id];
	const unit = METRIC_TEXT[id].unit({}, msgOpts(opts));
	return `${numberFormat(spec.digits, opts).format(value)}${unitSeparator(id, opts)}${unit}`;
}

/** Nur die Zahl, für Achsen. */
export function formatMetricNumber(id: MetricId, value: number, opts?: LocaleOpts): string {
	return numberFormat(Math.min(METRIC_SPECS[id].digits, 1), opts).format(value);
}

/**
 * Zwei Sätze je Kapitel: Wert und Lage unter allen Orten, dann der Vergleich.
 * „Verkehrslärm in Reuterstraße: 46,2 dB. Das ist leiser als in 80 % der Berliner Kieze.“
 */
/** „als 11 von 12 Bezirken“: Dativ Plural im Deutschen, im Englischen unverändert. */
function dativePlural(units: string, opts?: LocaleOpts): string {
	return msgOpts(opts).locale === 'en' || units.endsWith('n') ? units : `${units}n`;
}

/** Unter dieser Zahl von Orten sagt eine Anzahl mehr als ein Prozentwert. */
const SMALL_SET = 20;

export function metricLead(
	id: MetricId,
	name: string,
	own: number | null,
	others: readonly (number | null)[],
	unitPlural: string,
	/** Gewählter Vergleich (nicht Berlin): „1,0 dB leiser als Neukölln gesamt“. */
	ref: { readonly name: string; readonly value: number | null } | null = null,
	opts?: LocaleOpts
): string {
	const o = msgOpts(opts);
	if (own === null) return m.place_lead_none({ name }, o);
	const spec = METRIC_SPECS[id];
	const text = metricText(id, opts);
	const xs = others.filter((v): v is number => v !== null);
	const head = m.place_lead_head(
		{ label: text.label, name, value: formatMetric(id, own, opts) },
		o
	);
	const below = xs.filter((v) => v < own).length;
	const above = xs.filter((v) => v > own).length;
	const pct = (n: number) => String(Math.round((n / xs.length) * 100));
	// Bei wenigen Orten (12 Bezirke) Anzahl statt Prozent: „leiser als 11 von 12 Bezirken“.
	const fieldOf = (word: string, n: number) =>
		xs.length < SMALL_SET
			? m.place_lead_field_count(
					{ word, n: String(n), total: String(xs.length), units: dativePlural(unitPlural, opts) },
					o
				)
			: m.place_lead_field({ word, pct: pct(n), units: unitPlural }, o);
	const field =
		xs.length === 0 || (below === 0 && above === 0)
			? null
			: below >= above
				? fieldOf(text.higher, below)
				: fieldOf(text.lower, above);
	if (ref && ref.value !== null) {
		const diff = own - ref.value;
		const step = 10 ** -spec.digits;
		const cmp =
			Math.abs(diff) < step / 2
				? m.place_lead_same_as({ name: ref.name }, o)
				: m.place_lead_cmp(
						{
							diff: diffText(id, Math.abs(diff), opts),
							word: diff > 0 ? text.higher : text.lower,
							name: ref.name
						},
						o
					);
		return field
			? m.place_lead_cmp_field({ head, cmp, field }, o)
			: m.place_lead_cmp_only({ head, cmp }, o);
	}
	return field ? m.place_lead_field_only({ head, field }, o) : head;
}

/** Abstand mit Einheit; bei Prozentwerten in Prozentpunkten. */
function diffText(id: MetricId, abs: number, opts?: LocaleOpts): string {
	const spec = METRIC_SPECS[id];
	const n = numberFormat(spec.digits, opts).format(abs);
	if (spec.unitKind === 'percent') return m.place_diff_pp({ n }, msgOpts(opts));
	return `${n}\u00a0${METRIC_TEXT[id].unit({}, msgOpts(opts))}`;
}

/**
 * Was einen Ort prägt: die Messwerte, in denen er am weitesten vom Berliner Feld abweicht.
 * „Einwohnerdichte: dichter besiedelt als 95 % der Berliner Kieze“
 */
/** Nur die Zahl mit den Nachkommastellen der Kennzahl, für Tabellenzellen. */
export function formatMetricValue(id: MetricId, value: number | null, opts?: LocaleOpts): string {
	return value === null ? '–' : numberFormat(METRIC_SPECS[id].digits, opts).format(value);
}

export type HintTone = 'good' | 'bad' | 'neutral';
export interface Hint {
	/** Richtung des Werts selbst, unabhängig von der Wertung. */
	readonly dir: 'higher' | 'lower' | 'same';
	readonly tone: HintTone;
	/** Klartext, etwa „leiser als Berlin-Median“. */
	readonly text: string;
	/** Kurzform für Tabellen, wo die Vergleichsspalte daneben steht: „leiser“. */
	readonly short: string;
}

/** Lesehilfe am Wert: Richtung in Worten, Ton nur bei Kennzahlen mit klarer Richtung. */
export function hintFor(
	id: MetricId,
	own: number | null,
	ref: number | null,
	refLabel: string,
	opts?: LocaleOpts
): Hint | null {
	if (own === null || ref === null) return null;
	const o = msgOpts(opts);
	const spec = METRIC_SPECS[id];
	const step = 10 ** -spec.digits;
	if (Math.abs(own - ref) < step / 2) {
		return {
			dir: 'same',
			tone: 'neutral',
			text: m.place_hint_same_text({ ref: refLabel }, o),
			short: m.place_hint_same_short({}, o)
		};
	}
	const dir = own > ref ? 'higher' : 'lower';
	const tone: HintTone = !spec.better ? 'neutral' : spec.better === dir ? 'good' : 'bad';
	const word = metricText(id, opts)[dir];
	return { dir, tone, text: m.place_hint_text({ word, ref: refLabel }, o), short: word };
}
