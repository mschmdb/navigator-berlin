import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { getHitzeFaq } from './hitze-faq.js';

const HITZE_FAQ = getHitzeFaq();

const ABSOLUTISMEN = ['einzige', 'vollständig', 'garantiert', 'beste', 'besser als die stadt'];

describe('HITZE_FAQ', () => {
	it('hat mehrere Q&A-Paare mit nicht-leerem Text', () => {
		expect(HITZE_FAQ.length).toBeGreaterThanOrEqual(4);
		for (const item of HITZE_FAQ) {
			expect(item.question.trim().length).toBeGreaterThan(0);
			expect(item.answer.trim().length).toBeGreaterThan(0);
		}
	});

	it('trifft Suchintention (kühle Orte, klimatisiert, Hitze)', () => {
		const blob = HITZE_FAQ.map((i) => `${i.question} ${i.answer}`.toLowerCase()).join(' ');
		expect(blob).toContain('kühle orte');
		expect(blob).toContain('klimatisiert');
		expect(blob).toContain('hitze');
	});

	it('kein em-dash, kein Absolutismus', () => {
		const blob = HITZE_FAQ.map((i) => `${i.question} ${i.answer}`)
			.join(' ')
			.toLowerCase();
		expect(blob).not.toContain('—');
		for (const token of ABSOLUTISMEN) expect(blob).not.toContain(token);
	});
});

describe('HITZE_FAQ · DE-Wortlaut (i18n C4c)', () => {
	it('behält den Baseline-Wortlaut', () => {
		expect(HITZE_FAQ).toEqual([
			{
				question: 'Wo finde ich in Berlin kühle Orte bei Hitze?',
				answer:
					'Der Hitze-Navigator zeigt über 500 kühle Orte in ganz Berlin: Kinos, Bibliotheken, Schwimmhallen, Museen, Malls und Trinkbrunnen. Gib deinen Standort ein, die Karte sortiert die nächsten geöffneten Orte nach Entfernung.'
			},
			{
				question: 'Welche Orte in Berlin sind bei Hitze klimatisiert?',
				answer:
					'Viele Kinos, Museen und Malls sind klimatisiert. Wo die Klimatisierung belegt ist, markiert der Navigator den Ort entsprechend. Ist sie nicht belegbar, sagen wir das offen statt zu raten.'
			},
			{
				question: 'Sind die kühlen Orte kostenlos zugänglich?',
				answer:
					'Bibliotheken, Trinkbrunnen und Malls sind meist frei zugänglich. Schwimmhallen und Museen kosten oft Eintritt. Jeder Ort trägt eine Angabe, ob kostenlos oder mit Ticket.'
			},
			{
				question: 'Was hilft bei Hitze in Berlin?',
				answer:
					'Kühle Innenräume aufsuchen, viel trinken, direkte Sonne meiden. Der Hitze-Navigator zeigt den nächsten kühlen Ort, die Stadt Berlin bündelt Verhaltenstipps im Hitzeschutzportal.'
			},
			{
				question: 'Woher stammen die Daten zu den kühlen Orten?',
				answer:
					'Geometrie und Basis-Angaben kommen aus OpenStreetMap (ODbL), ergänzt um eine redaktionelle Prüfung von navigator.berlin. Die aktuelle Hitzewarnung liefert der Deutsche Wetterdienst.'
			}
		]);
	});
});

describe('HITZE_FAQ · EN (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('liefert dieselben fünf Einträge englisch', () => {
		overwriteGetLocale(() => 'en');
		const faq = getHitzeFaq();
		expect(faq).toHaveLength(5);
		expect(faq[0]?.question).toBe('Where can I find cool places in Berlin in hot weather?');
		expect(faq[4]?.answer).toContain('German Weather Service (DWD)');
		const blob = faq.map((i) => `${i.question} ${i.answer}`).join(' ');
		expect(blob).not.toContain('kühle');
		expect(blob).not.toContain('—');
	});
});
