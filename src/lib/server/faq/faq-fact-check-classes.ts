import type { TemplateLocale } from './template-schema.js';
import type { TemplateAggregate } from './template-renderer.js';
import type { FaqFinding } from './faq-fact-check.js';
import { SHARE_VOCAB, shareFromWord } from './share-phrases.js';
import { KLIMA_KENNWORT, OEPNV_URTEIL } from './fact-phrases.js';

/**
 * NAV-108: Klassen-Prüfungen der FAQ (Grün, Lärm, ÖPNV-Dichte, PET, MSS).
 * Wörter liest die Prüfung aus denselben Tabellen wie die Sätze; Schwellen
 * und Anteile rechnet sie selbst aus den Rohdaten nach.
 */

const EPS = 0.005;

type ShareCluster = keyof typeof SHARE_VOCAB;

const SHARE_TOKEN: Record<TemplateLocale, string> = {
	de: '[Dd]ie andere Hälfte|[Dd]ie Hälfte|(?:[Jj]e )?(?:ein|zwei|drei|vier) (?:Drittel|Viertel|Fünftel)|\\d+ Prozent|Der ganze (?:Kiez|Bezirk)',
	en: 'the other half|half|(?:one|two|three|four) (?:thirds?|quarters?|fifths?)|\\d+ percent|the whole (?:Kiez|district)'
};

const CLASS_PREFIX: Record<ShareCluster, Record<TemplateLocale, string>> = {
	gruen: { de: 'als', en: 'as' },
	laerm: { de: 'in der (?:Lärm)?[Kk]lasse', en: 'in the (?:noise )?class' }
};

function escape(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wort im Text zu Rohklasse (DE-Schlüssel der Vokabel). */
function rawClass(cluster: ShareCluster, locale: TemplateLocale, word: string): string | null {
	const entry = Object.entries(SHARE_VOCAB[cluster].word[locale]).find(
		([, w]) => w === word.toLowerCase()
	);
	return entry?.[0] ?? null;
}

function normalizedDist(
	cluster: ShareCluster,
	dist: Readonly<Record<string, number>>
): Map<string, number> {
	const alias = SHARE_VOCAB[cluster].alias ?? {};
	const out = new Map<string, number>();
	for (const [raw, share] of Object.entries(dist)) {
		if (!(share > 0)) continue;
		const key = alias[raw.trim().toLowerCase()] ?? raw.trim().toLowerCase();
		out.set(key, (out.get(key) ?? 0) + share);
	}
	return out;
}

function shareMatches(word: string, actual: number, locale: TemplateLocale): boolean {
	const lower = word.toLowerCase();
	if (/^(?:der ganze|the whole)/.test(lower)) return Math.abs(actual - 1) < EPS;
	if (/andere hälfte|other half/.test(lower)) return Math.abs(actual - 0.5) < EPS;
	const pct = /^(\d+) (?:prozent|percent)$/.exec(lower);
	if (pct) return Math.round(actual * 100) === Number(pct[1]);
	const value = shareFromWord(lower.replace(/^je /, ''), locale);
	return value !== null && Math.abs(actual - value) < EPS;
}

/** Prüft Anteils-Sätze („Vier Fünftel der Teilgebiete gelten als schlecht …“) und das Urteil davor. */
export function checkShares(
	text: string,
	cluster: ShareCluster,
	locale: TemplateLocale,
	dist: Readonly<Record<string, number>> | undefined
): FaqFinding[] {
	const vocab = SHARE_VOCAB[cluster];
	const actual = normalizedDist(cluster, dist ?? {});
	const out: FaqFinding[] = [];
	const classAlt = Object.values(vocab.word[locale])
		.sort((a, b) => b.length - a.length)
		.map(escape)
		.join('|');
	const pattern = new RegExp(
		`(${SHARE_TOKEN[locale]})(?: (?:der Teilgebiete|of the subareas)(?: each)?)?(?: \\S+(?: rated)?)? ${CLASS_PREFIX[cluster][locale]} (${classAlt})((?:, (?:${classAlt}))*(?: (?:und|and) (?:${classAlt}))?)?`,
		'gi'
	);
	const mentioned = new Set<string>();
	for (const m of text.matchAll(pattern)) {
		const words = [m[2], ...(m[3] ?? '').split(/, | und | and /).filter(Boolean)];
		const each = /^je /i.test(m[1]) || /\beach\b/.test(m[0]);
		for (const w of each ? words : [words[0]]) {
			const cls = rawClass(cluster, locale, w.trim());
			if (!cls) continue;
			mentioned.add(cls);
			const share = actual.get(cls) ?? 0;
			if (!shareMatches(m[1], share, locale)) {
				out.push({
					kind: 'klasse',
					message: `${cluster}: „${m[1]} ${w}“, Daten ${Math.round(share * 100)} %`
				});
			}
		}
	}
	if (mentioned.size > 0) {
		for (const cls of actual.keys()) {
			if (!mentioned.has(cls))
				out.push({ kind: 'klasse', message: `${cluster}: Klasse „${cls}“ fehlt im Text` });
		}
	}
	out.push(...checkVerdict(text, cluster, locale, actual));
	return out;
}

const VERDICT_DE_GRUEN = /Laut Senat (überwiegend )?(gut|mittel|schlecht|gemischt)[.:]/;
const VERDICT_EN_GRUEN =
	/(Mostly )?(good|medium|poor|mixed|Good|Medium|Poor|Mixed), according to the Senate[.:]/;

function checkVerdict(
	text: string,
	cluster: ShareCluster,
	locale: TemplateLocale,
	actual: Map<string, number>
): FaqFinding[] {
	const sorted = [...actual.entries()].sort((a, b) => b[1] - a[1]);
	if (sorted.length === 0) return [];
	const [top, share] = sorted[0];
	const majority = share > 0.5 + EPS || sorted.length === 1;
	let claimed: { cls: string | null; mostly: boolean } | null = null;
	if (cluster === 'gruen') {
		const m = (locale === 'de' ? VERDICT_DE_GRUEN : VERDICT_EN_GRUEN).exec(text);
		if (m) {
			const word = m[2].toLowerCase();
			const cls = Object.entries(SHARE_VOCAB.gruen.verdict[locale]).find(
				([, v]) => v === word
			)?.[0];
			claimed = { cls: cls ?? null, mostly: Boolean(m[1]) };
		}
	} else {
		const verdicts = Object.entries(SHARE_VOCAB.laerm.verdict[locale]);
		const mixed = locale === 'de' ? 'Gemischt' : 'Mixed';
		const head = /^([^.:]+)[.:]/.exec(text.trim())?.[1];
		if (head === mixed) claimed = { cls: null, mostly: false };
		const hit = verdicts.find(([, v]) => v === head);
		if (hit) claimed = { cls: hit[0], mostly: sorted.length > 1 };
	}
	if (!claimed) return [];
	const ok =
		claimed.cls === null
			? !majority
			: majority && claimed.cls === top && claimed.mostly === sorted.length > 1;
	return ok
		? []
		: [
				{
					kind: 'klasse',
					message: `${cluster}: Urteil passt nicht zur Verteilung (oben: ${top} ${Math.round(share * 100)} %)`
				}
			];
}

// ---------------------------------------------------------------- ÖPNV, PET, MSS

const OEPNV_SCHWELLEN: readonly [number, keyof (typeof OEPNV_URTEIL)['de']][] = [
	[20, 'sehr dicht'],
	[12, 'dicht'],
	[6, 'mittel'],
	[0, 'dünn']
];

export function checkOepnvClass(
	text: string,
	locale: TemplateLocale,
	aggregate: TemplateAggregate
): FaqFinding[] {
	const value = aggregate.oepnv.stopsPerKm2?.value;
	const said = Object.entries(OEPNV_URTEIL[locale]).filter(([, t]) => text.includes(t));
	if (said.length === 0) return [];
	const expected =
		typeof value === 'number' ? OEPNV_SCHWELLEN.find(([min]) => value >= min)?.[1] : undefined;
	return said.every(([cls]) => cls === expected)
		? []
		: [
				{
					kind: 'klasse',
					message: `ÖPNV-Urteil „${said[0][0]}“, Daten ${value ?? 'fehlt'} = „${expected}“`
				}
			];
}

const PET_SCHWELLEN: readonly [number, keyof (typeof KLIMA_KENNWORT)['de']][] = [
	[46, 'stark'],
	[41, 'belastet'],
	[35, 'gemaessigt'],
	[-Infinity, 'entspannt']
];

export function checkPetClass(
	text: string,
	locale: TemplateLocale,
	aggregate: TemplateAggregate
): FaqFinding[] {
	const value = aggregate.klima.meanPet?.value;
	// „sehr heiß“ enthält „heiß“: das längste Kennwort gewinnt.
	const said = Object.entries(KLIMA_KENNWORT[locale])
		.filter(([, w]) => text.includes(w))
		.sort((a, b) => b[1].length - a[1].length)[0];
	if (!said) return [];
	const expected =
		typeof value === 'number' ? PET_SCHWELLEN.find(([min]) => value >= min)?.[1] : undefined;
	return said[0] === expected
		? []
		: [
				{
					kind: 'klasse',
					message: `PET-Urteil „${said[0]}“, Daten ${value ?? 'fehlt'} = „${expected}“`
				}
			];
}

/** MSS-Status-Index: hoch heißt wenig Benachteiligung, sehr niedrig am meisten. */
const MSS_WRONG_DIRECTION: Record<string, RegExp> = {
	hoch: /überdurchschnittliche|höchste|above-average|most socio/i,
	'sehr hoch': /überdurchschnittliche|höchste|above-average|most socio/i,
	niedrig: /wenig|geringsten|little|least/i,
	'sehr niedrig': /wenig|geringsten|little|least/i
};

export function checkMss(
	text: string,
	templateId: string,
	aggregate: TemplateAggregate
): FaqFinding[] {
	if (!templateId.startsWith('wohnen-mss')) return [];
	const raw = aggregate.wohnen.dominantMss?.value;
	const wrong = typeof raw === 'string' ? MSS_WRONG_DIRECTION[raw.trim().toLowerCase()] : undefined;
	return wrong?.test(text)
		? [{ kind: 'klasse', message: `MSS-Text widerspricht dem Status-Index „${raw}“` }]
		: [];
}

/** Grün-Antworten nutzen nur die Senats-Skala, nie die neutrale (gering/hoch). */
export function checkGruenScale(
	text: string,
	templateId: string,
	locale: TemplateLocale
): FaqFinding[] {
	if (!templateId.startsWith('gruen-versorgung')) return [];
	const foreign = locale === 'de' ? /\b(?:gering|hoch)\b/ : /\b(?:low|high)\b/;
	return foreign.test(text)
		? [{ kind: 'klasse', message: 'Grün-Klasse nicht in der Senats-Skala' }]
		: [];
}
