import type { PageType, TemplateLocale } from './template-schema.js';
import type { MetricContext, TemplateAggregate } from './template-renderer.js';

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
		counted: /(\d[\d.,]*)\s+(?:U-Bahnh(?:of|öfe)|U-Bahn stations?)/g
	},
	{
		key: 'sBahnCount',
		label: 'S-Bahn',
		mention: /\bS-(?=Bahn|\s)/g,
		counted: /(\d[\d.,]*)\s+(?:S-Bahnh(?:of|öfe)|S-Bahn stations?)/g
	},
	{
		key: 'tramCount',
		label: 'Tram',
		mention: /\btram/gi,
		counted: /(\d[\d.,]*)\s+(?:Tramhaltestellen?|tram stops?)/g
	},
	{
		key: 'busCount',
		label: 'Bus',
		mention: /\b[Bb]us(?!ch|iness)/g,
		counted: /(\d[\d.,]*)\s+(?:Bushalte(?:stellen?)?|bus stops?)/g
	}
];

const NEGATION_BEFORE = /\b(?:kein(?:e|en|er)?|no|without|ohne)\s+(?:\S+\s+)?$/i;

function parseCount(raw: string): number {
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

// ---------------------------------------------------------------- Grünversorgung

/** Senats-Klassen der Grünversorgung (Umweltatlas 2023) und ihre EN-Wörter. */
const GRUEN_EN: Record<string, string> = { good: 'gut', medium: 'mittel', poor: 'schlecht' };
const GRUEN_FOREIGN_SCALE: Record<TemplateLocale, RegExp> = {
	de: /\b(?:gering|hoch)\b/,
	en: /\b(?:low|high)\b/
};

function gruenRaw(word: string, locale: TemplateLocale): string {
	return locale === 'en' ? (GRUEN_EN[word] ?? word) : word;
}

function checkGruen(
	text: string,
	subject: FaqCheckSubject,
	aggregate: TemplateAggregate
): FaqFinding[] {
	if (!subject.templateId.startsWith('gruen-versorgung')) return [];
	const out: FaqFinding[] = [];
	const locale = subject.locale;
	const dist = aggregate.gruen.versorgungDistribution?.value ?? {};
	const dominant = aggregate.gruen.dominantVersorgung?.value ?? null;
	const top = Math.max(0, ...Object.values(dist));
	const topClasses = Object.entries(dist)
		.filter(([, share]) => share === top)
		.map(([key]) => key);
	if (GRUEN_FOREIGN_SCALE[locale].test(text)) {
		out.push({
			kind: 'klasse',
			message: `Grün-Klasse nicht in der Senats-Skala (Daten: ${dominant})`
		});
	}
	const claim = locale === 'de' ? /\bals „([^“]+)“/ : /\bas “([^”]+)”/;
	const claimed = claim.exec(text);
	if (claimed) {
		const raw = gruenRaw(claimed[1], locale);
		const allowed = topClasses.length > 0 ? topClasses : dominant ? [dominant] : [];
		if (!allowed.includes(raw)) {
			out.push({ kind: 'klasse', message: `Grün-Klasse „${raw}“, Daten: ${allowed.join('/')}` });
		}
	}
	const pct = locale === 'de' ? /„([^“]+)“ (\d+) %/g : /“([^”]+)” (\d+)%/g;
	for (const match of text.matchAll(pct)) {
		const raw = gruenRaw(match[1], locale);
		const share = dist[raw];
		const expected = share === undefined ? null : Math.round(share * 100);
		if (expected !== Number(match[2])) {
			out.push({
				kind: 'klasse',
				message: `Anteil „${raw}“ ${match[2]} %, Daten: ${expected ?? 'fehlt'}`
			});
		}
	}
	return out;
}

// ---------------------------------------------------------------- Klassen

const LAERM_EXPECTED: Record<string, Record<TemplateLocale, string>> = {
	niedrig: { de: 'gering', en: 'low' },
	gering: { de: 'gering', en: 'low' },
	mittel: { de: 'mittel', en: 'medium' },
	hoch: { de: 'hoch', en: 'high' },
	'sehr hoch': { de: 'sehr hoch', en: 'very high' }
};
const LAERM_CLAIM: Record<TemplateLocale, RegExp> = {
	de: /\bKlasse (sehr hoch|hoch|mittel|gering|unbekannt)\b/,
	en: /\bclass (very high|high|medium|low|unknown)\b/
};

function checkLaerm(
	text: string,
	subject: FaqCheckSubject,
	aggregate: TemplateAggregate
): FaqFinding[] {
	if (!subject.templateId.startsWith('laerm-')) return [];
	const claimed = LAERM_CLAIM[subject.locale].exec(text);
	if (!claimed) return [];
	const raw = aggregate.laerm.dominantCategory?.value;
	const expected =
		typeof raw === 'string'
			? LAERM_EXPECTED[raw.trim().toLowerCase()]?.[subject.locale]
			: undefined;
	return claimed[1] === expected
		? []
		: [{ kind: 'klasse', message: `Lärm-Klasse ${claimed[1]}, Daten: ${raw ?? 'fehlt'}` }];
}

const OEPNV_CLASSES: Record<TemplateLocale, readonly [number, string][]> = {
	de: [
		[20, 'sehr dicht'],
		[12, 'dicht'],
		[6, 'mittel'],
		[0, 'dünn']
	],
	en: [
		[20, 'very dense'],
		[12, 'dense'],
		[6, 'moderate'],
		[0, 'sparse']
	]
};
const OEPNV_CLAIM: Record<TemplateLocale, RegExp> = {
	de: /gilt damit als (sehr dicht|dicht|mittel|dünn)\b/,
	en: /considered (very dense|dense|moderate|sparse)\b/
};

function checkOepnvClass(
	text: string,
	subject: FaqCheckSubject,
	aggregate: TemplateAggregate
): FaqFinding[] {
	const value = aggregate.oepnv.stopsPerKm2?.value;
	const claimed = OEPNV_CLAIM[subject.locale].exec(text);
	if (!claimed || typeof value !== 'number') return [];
	const expected = OEPNV_CLASSES[subject.locale].find(([min]) => value >= min)?.[1];
	return claimed[1] === expected
		? []
		: [
				{
					kind: 'klasse',
					message: `ÖPNV-Dichte „${claimed[1]}“, Daten ${value.toFixed(1)} = „${expected}“`
				}
			];
}

/** MSS-Status-Index: hoch = wenig Benachteiligung, sehr niedrig = am meisten. */
const MSS_WRONG_DIRECTION: Record<string, RegExp> = {
	hoch: /überdurchschnittliche|höchste|above-average|highest/i,
	'sehr hoch': /überdurchschnittliche|höchste|above-average|highest/i,
	niedrig: /wenig|niedrigste|little|lowest/i,
	'sehr niedrig': /wenig|niedrigste|little|lowest/i
};

function checkMss(
	text: string,
	subject: FaqCheckSubject,
	aggregate: TemplateAggregate
): FaqFinding[] {
	if (!subject.templateId.startsWith('wohnen-mss')) return [];
	const raw = aggregate.wohnen.dominantMss?.value;
	const wrong = typeof raw === 'string' ? MSS_WRONG_DIRECTION[raw.trim().toLowerCase()] : undefined;
	return wrong?.test(text)
		? [{ kind: 'klasse', message: `MSS-Text widerspricht dem Status-Index „${raw}“` }]
		: [];
}

// ---------------------------------------------------------------- Scores + Ränge

const SCORE_NAMES: readonly [RegExp, string][] = [
	[/Ruhe-und-Luft-Score|Quiet & air score/, 'ruheLuft'],
	[/Grün-und-Hitze-Score|Green & heat score/, 'gruenHitze'],
	[/Mobilitäts-Score|Mobility score/, 'mobilitaet'],
	[/Wohnschutz-Score|Tenant protection score/, 'wohnschutz'],
	[/Versorgungs-Score|Amenities score/, 'versorgung']
];
const SCORE_VALUE = /(\d+) (?:von|out of) 100(?: in the [^(]*?)? \(([^)]*)\)(?:,? ([^.]*))?/g;
const RANK_LABEL = /^(?:Platz|[Rr]ank) (\d+) (?:von|of) (\d+)$/;
const BOTTOM: Record<TemplateLocale, string> = { de: 'unteres Viertel', en: 'bottom quartile' };
const COMPARE: Record<TemplateLocale, { same: string; above: string; below: string }> = {
	de: { same: 'etwa im', above: 'über dem', below: 'unter dem' },
	en: { same: 'about the same as', above: 'above', below: 'below' }
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

function checkScores(text: string, subject: FaqCheckSubject, facts: FaqCheckFacts): FaqFinding[] {
	const out: FaqFinding[] = [];
	for (const match of text.matchAll(SCORE_VALUE)) {
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
		const label = match[2];
		const field = facts.field?.get(key);
		if (m.quartil === 4) {
			if (label !== BOTTOM[subject.locale]) {
				out.push({
					kind: 'rang',
					message: `${key}: „${label}“, erwartet „${BOTTOM[subject.locale]}“`
				});
			}
		} else {
			const rank = RANK_LABEL.exec(label);
			const expectedRank = field ? competitionRank(m.value, field) : m.rang;
			const expectedTotal = field ? field.length : m.total;
			if (!rank || Number(rank[1]) !== expectedRank || Number(rank[2]) !== expectedTotal) {
				out.push({
					kind: 'rang',
					message: `${key}: „${label}“, erwartet Platz ${expectedRank} von ${expectedTotal}`
				});
			}
		}
		const phrase = match[3] ?? '';
		if (m.compareValue !== null && phrase) {
			const delta = m.value - m.compareValue;
			const c = COMPARE[subject.locale];
			const expected = Math.abs(delta) < 1 ? c.same : delta > 0 ? c.above : c.below;
			if (!phrase.startsWith(expected)) {
				out.push({ kind: 'vergleich', message: `${key}: „${phrase}“, erwartet „${expected} …“` });
			}
		}
	}
	return out;
}

// ---------------------------------------------------------------- Zahlen

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
		...checkGruen(text, subject, facts.aggregate),
		...checkLaerm(text, subject, facts.aggregate),
		...checkOepnvClass(text, subject, facts.aggregate),
		...checkMss(text, subject, facts.aggregate),
		...checkScores(text, subject, facts),
		...checkNumbers(text, subject, facts)
	];
}
