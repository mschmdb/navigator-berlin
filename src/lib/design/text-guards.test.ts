import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * GH-92: Text-Guards nach Leitlinie 30 (kein AI-Slop). Prüft die Messages
 * auf Muster, die das Design-Review gezählt hat: gehäufte Abgrenzungen
 * („X, kein Y“), englische Fachwörter im DE-Text, Versalien-Betonung und
 * Überschriften, die mit „Was“ beginnen.
 */

type Messages = Record<string, string>;
const ROOT = join(import.meta.dirname, '..', '..', '..');
const load = (lang: string): Messages =>
	JSON.parse(readFileSync(join(ROOT, 'messages', `${lang}.json`), 'utf8')) as Messages;

const entries = (messages: Messages) =>
	Object.entries(messages).filter(([key]) => key !== '$schema');

/** Seiten-Präfixe, deren Texte gemeinsam auf einer Seite stehen. */
const PAGE_PREFIXES = ['home_', 'uis_', 'architektur_', 'kuehle_orte_page_', 'hitze_'];
const MAX_NEGATIONS_PER_PAGE = 2;

const NEGATION: Record<string, RegExp> = {
	de: /, (kein|keine|keinen|keiner|nicht) /g,
	en: /, (not|no) /g
};

function negationCount(messages: Messages, prefix: string, re: RegExp): number {
	return entries(messages)
		.filter(([key]) => key.startsWith(prefix) && !key.endsWith('_meta_description'))
		.reduce((sum, [, value]) => sum + (value.match(re)?.length ?? 0), 0);
}

describe.each(['de', 'en'])('Text-Guards %s (GH-92)', (lang) => {
	const messages = load(lang);

	it.each(PAGE_PREFIXES)('häuft auf %s höchstens zwei Abgrenzungen „X, kein Y“', (prefix) => {
		expect(negationCount(messages, prefix, NEGATION[lang])).toBeLessThanOrEqual(
			MAX_NEGATIONS_PER_PAGE
		);
	});

	it('betont keine Wörter in Versalien', () => {
		const shouting = entries(messages)
			.filter(([, value]) => /\b(NICHT|NOT|KEIN|NO)\b/.test(value))
			.map(([key]) => key);
		expect(shouting).toEqual([]);
	});

	it('beginnt keine Überschrift mit „Was“ oder „What“', () => {
		const offenders = entries(messages)
			.filter(([key]) => /_(heading|title)$/.test(key))
			.filter(([, value]) => /^(Was|What) /.test(value))
			.map(([key]) => key);
		expect(offenders).toEqual([]);
	});

	it('nennt keine Bundle-Buchstaben vor den Kategorien', () => {
		const lettered = entries(messages)
			.filter(([key]) => key.startsWith('atlas_bundle_label_'))
			.filter(([, value]) => /^[A-J]: /.test(value))
			.map(([key]) => key);
		expect(lettered).toEqual([]);
	});
});

describe('Text-Guards de (GH-92)', () => {
	const messages = load('de');

	it('nutzt keine englischen Fachwörter Features und Coverage', () => {
		// methodik_clt_*: interne Template-Vorschau, nur im Dev-Build erreichbar (#97).
		const offenders = entries(messages)
			.filter(([key]) => !key.startsWith('methodik_clt_'))
			.filter(([, value]) => /\b(Features?|Coverage)\b/.test(value))
			.map(([key]) => key);
		expect(offenders).toEqual([]);
	});

	it('enthält keinen Entwicklertext im Wahlportal', () => {
		expect(messages.wahl_portal_chapter_trends_subtext).not.toMatch(/Datenabruf|Toggle/);
	});
});
