import type { PageType, TemplateLocale } from './template-schema.js';
import type { MetricContext, TemplateAggregate } from './template-renderer.js';
import {
	checkGruenScale,
	checkMss,
	checkOepnvClass,
	checkPetClass,
	checkShares
} from './faq-fact-check-classes.js';

/**
 * NAV-108: Prüft eine gerenderte FAQ-Antwort gegen die Quelldaten.
 *
 * Die Prüfung liest den fertigen Text, nicht die Slots: Sie fängt so auch
 * Behauptungen in festen Template- oder Message-Sätzen (zum Beispiel
 * „Tram- und Bus-Halte“ ohne Tram im Kiez). Die Klassen- und Schwellen-Tabellen
 * stehen hier bewusst ein zweites Mal, unabhängig von den FAQ-Helfern.
 */

export type FaqFindingKind = 'slot' | 'modus' | 'klasse' | 'zahl' | 'score' | 'rang' | 'vergleich';

export interface FaqFinding {
	readonly kind: FaqFindingKind;
	readonly message: string;
}

export interface FaqCheckSubject {
	readonly pageType: PageType;
	readonly slug: string;
	readonly locale: TemplateLocale;
	readonly templateId: string;
	readonly answer: string;
	/** Roh-Antwort aus dem YAML-Template; feste Zahlen darin gelten als erlaubt. */
	readonly templateText: string;
}

export interface FaqCheckFacts {
	readonly name: string;
	readonly aggregate: TemplateAggregate;
	readonly metrics?: ReadonlyMap<string, MetricContext>;
	/** Alle Werte je Score-Dimension im selben Feld (alle Kieze bzw. Bezirke). */
	readonly field?: ReadonlyMap<string, readonly number[]>;
}

const NUMBER_LOCALE: Record<TemplateLocale, string> = { de: 'de-DE', en: 'en-GB' };

/** Quellen-Sätze nennen Datensätze („BVG + S-Bahn“), keine Aussage über den Ort. */
const SOURCE_SENTENCE = /(?:Quelle|Datengrundlage|Source|Data basis):[^]*?(?:Stand|as of) [^.]*\./g;

function claimText(subject: FaqCheckSubject, name: string): string {
	const withoutName = name ? subject.answer.split(name).join('ORT') : subject.answer;
	return withoutName.replace(SOURCE_SENTENCE, ' ');
}

function fmt(value: number, digits: number, locale: TemplateLocale): string {
	return value.toLocaleString(NUMBER_LOCALE[locale], {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
}

// ---------------------------------------------------------------- Verkehrsmittel

interface ModeSpec {
	readonly key: 'uBahnCount' | 'sBahnCount' | 'tramCount' | 'busCount';
	readonly label: string;
	readonly mention: RegExp;
	readonly counted: RegExp;
}

const MODES: readonly ModeSpec[] = [
	{
		key: 'uBahnCount',
		label: 'U-Bahn',
		mention: /\bU-(?=Bahn|\s)/g,
		counted: /(\d[\d.,]*|\bein|\beine|\bone)\s+(?:U-Bahnh(?:of|öfe)|U-Bahn stations?)/g
	},
	{
		key: 'sBahnCount',
		label: 'S-Bahn',
		mention: /\bS-(?=Bahn|\s)/g,
		counted: /(\d[\d.,]*|\bein|\beine|\bone)\s+(?:S-Bahnh(?:of|öfe)|S-Bahn stations?)/g
	},
	{
		key: 'tramCount',
		label: 'Tram',
		mention: /\btram/gi,
		counted: /(\d[\d.,]*|\bein|\beine|\bone)\s+(?:Tramhaltestellen?|tram stops?)/g
	},
	{
		key: 'busCount',
		label: 'Bus',
		mention: /\b[Bb]us(?!ch|iness)/g,
		counted: /(\d[\d.,]*|\bein|\beine|\bone)\s+(?:Bushalte(?:stellen?)?|bus stops?)/g
	}
];

const NEGATION_BEFORE = /\b(?:kein(?:e|en|er)?|no|without|ohne)\s+(?:\S+\s+)?$/i;

function parseCount(raw: string): number {
	if (/^(?:ein|eine|one)$/.test(raw)) return 1;
	return Number(raw.replace(/[.,]/g, ''));
}

function checkModes(text: string, aggregate: TemplateAggregate): FaqFinding[] {
	const out: FaqFinding[] = [];
	for (const mode of MODES) {
		const count = aggregate.oepnv[mode.key]?.value ?? null;
		for (const match of text.matchAll(mode.mention)) {
			const before = text.slice(Math.max(0, (match.index ?? 0) - 30), match.index);
			const negated = NEGATION_BEFORE.test(before);
			if (!negated && !count) {
				out.push({
					kind: 'modus',
					message: `${mode.label} genannt, Halte im Datensatz: ${count ?? 'keine Angabe'}`
				});
			}
			if (negated && count) {
				out.push({
					kind: 'modus',
					message: `${mode.label} verneint, Halte im Datensatz: ${count}`
				});
			}
		}
		for (const match of text.matchAll(mode.counted)) {
			const said = parseCount(match[1]);
			if (said !== count) {
				out.push({
					kind: 'modus',
					message: `${mode.label}: Text nennt ${said}, Datensatz ${count}`
				});
			}
		}
	}
	return out;
}

// ---------------------------------------------------------------- Scores + Ränge

const SCORE_NAMES: readonly [RegExp, string][] = [
	[/Ruhe-und-Luft-Score|Quiet & air score/, 'ruheLuft'],
	[/Grün-und-Hitze-Score|Green & heat score/, 'gruenHitze'],
	[/Mobilitäts-Score|Mobility score/, 'mobilitaet'],
	[/Wohnschutz-Score|Tenant protection score/, 'wohnschutz'],
	[/Versorgungs-Score|Amenities score/, 'versorgung']
];
const SCORE_VALUE: Record<TemplateLocale, RegExp> = {
	de: /kommt (?:der Kiez|der Bezirk) auf (\d+) von 100 Punkten, ([^.]+)\.(?: Das ist ([^.]+)\.)?/g,
	en: /(?:the Kiez|the district) gets (\d+) of 100 points, ([^.]+)\.(?: That is ([^.]+)\.)?/g
};
const RANK_LABEL: Record<TemplateLocale, RegExp> = {
	de: /^(geteilter )?Platz (\d+) von (\d+) (?:Kiezen|Bezirken)$/,
	en: /^(joint )?rank (\d+) of (\d+) (?:Kieze|districts)$/
};
const BOTTOM: Record<TemplateLocale, RegExp> = {
	de: /^im unteren Viertel der (\d+) (?:Kieze|Bezirke)$/,
	en: /^in the bottom quarter of the (\d+) (?:Kieze|districts)$/
};
const COMPARE: Record<TemplateLocale, { same: string; above: string; below: string }> = {
	de: { same: 'etwa so viel wie', above: 'mehr als', below: 'weniger als' },
	en: { same: 'about the same as', above: 'more than', below: 'less than' }
};
const COMPARE_TARGET: Record<TemplateLocale, Record<'bezirk' | 'berlin', string>> = {
	de: { bezirk: 'Schnitt der Kieze im Bezirk', berlin: 'mittleren Berliner Bezirk' },
	en: { bezirk: 'average of the Kieze in its district', berlin: 'median Berlin district' }
};

function scoreKeyBefore(text: string, index: number): string | null {
	let best: { at: number; key: string } | null = null;
	for (const [pattern, key] of SCORE_NAMES) {
		const re = new RegExp(pattern.source, 'g');
		for (const m of text.slice(0, index + 200).matchAll(re)) {
			const at = m.index ?? 0;
			if (
				Math.abs(at - index) <= 160 &&
				(!best || Math.abs(at - index) < Math.abs(best.at - index))
			) {
				best = { at, key };
			}
		}
	}
	return best?.key ?? null;
}

function competitionRank(own: number, field: readonly number[]): number {
	return 1 + field.filter((v) => v > own).length;
}

/** Gleiche Formel wie `scripts/lib/ranking`: Quartil aus Rang-Position. */
function quartileOf(rang: number, total: number): number {
	return Math.min(4, Math.max(1, Math.floor(((rang - 1) / total) * 4) + 1));
}

function checkRankLabel(
	label: string,
	key: string,
	m: MetricContext,
	field: readonly number[] | undefined,
	locale: TemplateLocale
): FaqFinding[] {
	const value = m.value ?? 0;
	const rank = field ? competitionRank(value, field) : (m.rang ?? 0);
	const total = field ? field.length : m.total;
	const tied = field ? field.filter((v) => v === value).length > 1 : (m.geteiltMit ?? 0) > 0;
	const expected = quartileOf(rank, total) === 4 ? 'unteres Viertel' : `Platz ${rank} von ${total}`;
	const bottom = BOTTOM[locale].exec(label);
	if (bottom) {
		return quartileOf(rank, total) === 4 && Number(bottom[1]) === total
			? []
			: [{ kind: 'rang', message: `${key}: „${label}“, erwartet ${expected}` }];
	}
	const placed = RANK_LABEL[locale].exec(label);
	const ok =
		placed !== null &&
		quartileOf(rank, total) !== 4 &&
		Number(placed[2]) === rank &&
		Number(placed[3]) === total &&
		Boolean(placed[1]) === tied;
	return ok
		? []
		: [
				{
					kind: 'rang',
					message: `${key}: „${label}“, erwartet ${expected}${tied ? ' (geteilt)' : ''}`
				}
			];
}

function checkScores(text: string, subject: FaqCheckSubject, facts: FaqCheckFacts): FaqFinding[] {
	const out: FaqFinding[] = [];
	const locale = subject.locale;
	for (const match of text.matchAll(SCORE_VALUE[locale])) {
		const key = scoreKeyBefore(text, match.index ?? 0);
		const m = key ? facts.metrics?.get(key) : undefined;
		if (!key || !m || m.value === null) {
			out.push({
				kind: 'score',
				message: `Score ohne Datenwert (${key ?? 'unbekannte Dimension'})`
			});
			continue;
		}
		if (Number(match[1]) !== Math.round(m.value)) {
			out.push({
				kind: 'score',
				message: `${key}: Text ${match[1]}, Daten ${Math.round(m.value)}`
			});
		}
		out.push(...checkRankLabel(match[2], key, m, facts.field?.get(key), locale));
		const phrase = match[3];
		if (phrase && m.compareValue !== null) {
			const delta = m.value - m.compareValue;
			const c = COMPARE[locale];
			const expected = Math.abs(delta) < 1 ? c.same : delta > 0 ? c.above : c.below;
			if (!phrase.startsWith(expected) || !phrase.includes(COMPARE_TARGET[locale][m.compareKind])) {
				out.push({ kind: 'vergleich', message: `${key}: „${phrase}“, erwartet „${expected} …“` });
			}
		}
	}
	return out;
}

// ---------------------------------------------------------------- Zahlen

interface BoundNumber {
	readonly label: string;
	readonly pattern: Record<TemplateLocale, RegExp>;
	readonly value: (a: TemplateAggregate) => number | null | undefined;
}

/** Zahlen mit Einheit gehören zu genau einer Kennzahl, nicht zu irgendeinem Datenwert. */
const BOUND_NUMBERS: readonly BoundNumber[] = [
	{
		label: 'Haltedichte',
		pattern: {
			de: /kommen ([\d.,]+) Haltestellen/g,
			en: /There are ([\d.,]+) stops per square kilomet/g
		},
		value: (a) => a.oepnv.stopsPerKm2?.value
	},
	{
		label: 'PET',
		pattern: { de: /bei ([\d.,]+) Grad/g, en: /averages ([\d.,]+) degrees/g },
		value: (a) => a.klima.meanPet?.value
	},
	{
		label: 'Grünanlagen',
		pattern: {
			de: /zählt im Bezirk ([\d.]+) öffentliche Grünanlagen/g,
			en: /counts ([\d,]+) public green spaces/g
		},
		value: (a) => a.gruen.gruenanlagenCount?.value
	}
];

function checkBoundNumbers(
	text: string,
	subject: FaqCheckSubject,
	aggregate: TemplateAggregate
): FaqFinding[] {
	const out: FaqFinding[] = [];
	for (const bound of BOUND_NUMBERS) {
		const value = bound.value(aggregate);
		for (const match of text.matchAll(bound.pattern[subject.locale])) {
			const said = match[1];
			const digits = said.includes(subject.locale === 'de' ? ',' : '.') ? 1 : 0;
			const ok = typeof value === 'number' && fmt(value, digits, subject.locale) === said;
			if (!ok) {
				out.push({
					kind: 'zahl',
					message: `${bound.label}: Text ${said}, Daten ${typeof value === 'number' ? fmt(value, 1, subject.locale) : 'fehlt'}`
				});
			}
		}
	}
	return out;
}

function allowedNumbers(subject: FaqCheckSubject, facts: FaqCheckFacts): Set<string> {
	const locale = subject.locale;
	const allowed = new Set<string>(['100']);
	const add = (n: number) => {
		allowed.add(fmt(n, 0, locale));
		allowed.add(fmt(n, 1, locale));
		allowed.add(String(Math.round(n)));
	};
	for (const cluster of Object.values(facts.aggregate) as Record<string, unknown>[]) {
		for (const entry of Object.values(cluster ?? {})) {
			const { value, sourceUpdatedAt } =
				(entry as { value?: unknown; sourceUpdatedAt?: string } | null) ?? {};
			if (typeof value === 'number') add(value);
			// Stand-Angaben („Kartierung Januar 2024“) nennen das Quelljahr.
			if (typeof sourceUpdatedAt === 'string') allowed.add(sourceUpdatedAt.slice(0, 4));
			if (value && typeof value === 'object') {
				for (const share of Object.values(value as Record<string, unknown>)) {
					if (typeof share === 'number') add(share * 100);
				}
			}
		}
	}
	for (const m of facts.metrics?.values() ?? []) {
		if (m.value !== null) add(m.value);
		if (m.rang !== null) add(m.rang);
		add(m.total);
	}
	for (const n of subject.templateText.match(/\d+(?:[.,]\d+)?/g) ?? []) allowed.add(n);
	return allowed;
}

function checkNumbers(text: string, subject: FaqCheckSubject, facts: FaqCheckFacts): FaqFinding[] {
	const allowed = allowedNumbers(subject, facts);
	const decimal =
		subject.locale === 'de'
			? /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g
			: /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;
	const out: FaqFinding[] = [];
	for (const match of text.matchAll(decimal)) {
		if (!allowed.has(match[0])) {
			out.push({ kind: 'zahl', message: `Zahl ${match[0]} passt zu keinem Datenwert` });
		}
	}
	return out;
}

// ---------------------------------------------------------------- Einstieg

export function checkFaqAnswer(subject: FaqCheckSubject, facts: FaqCheckFacts): FaqFinding[] {
	const slots = [...subject.answer.matchAll(/\{[a-zA-Z]+\}/g)].map((m) => ({
		kind: 'slot' as const,
		message: `Slot ${m[0]} nicht ersetzt`
	}));
	if (subject.pageType === 'layer') return slots;
	const text = claimText(subject, facts.name);
	return [
		...slots,
		...checkModes(text, facts.aggregate),
		...checkGruenScale(text, subject.templateId, subject.locale),
		...checkShares(
			text,
			'gruen',
			subject.locale,
			facts.aggregate.gruen.versorgungDistribution?.value
		),
		...checkShares(
			text,
			'laerm',
			subject.locale,
			facts.aggregate.laerm.categoryDistribution?.value
		),
		...checkOepnvClass(text, subject.locale, facts.aggregate),
		...checkPetClass(text, subject.locale, facts.aggregate),
		...checkMss(text, subject.templateId, facts.aggregate),
		...checkScores(text, subject, facts),
		...checkBoundNumbers(text, subject, facts.aggregate),
		...checkNumbers(text, subject, facts)
	];
}
