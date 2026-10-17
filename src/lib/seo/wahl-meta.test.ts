import { describe, expect, it } from 'vitest';
import { buildWahlMeta, type WahlMetaInput } from './wahl-meta.js';

const agh2023: WahlMetaInput = {
	typ: 'agh',
	jahr: 2023,
	stimmtyp: 'erststimme',
	isRepeatElection: true,
	hasStimmbezirke: true,
	vorlaeufig: false,
	topParty: { kurzname: 'CDU', anteil: 0.2832 },
	locale: 'de'
};

describe('buildWahlMeta Titel', () => {
	it('DE: Reihe, Jahr, Stimmart und Wiederholungswahl ohne Marke bei Überlänge', () => {
		const { title } = buildWahlMeta(agh2023);
		expect(title).toBe('Abgeordnetenhaus 2023 · Erststimme · Wiederholungswahl');
	});

	it('DE: Marke hängt an, wenn der Titel in 60 Zeichen passt', () => {
		const { title } = buildWahlMeta({
			...agh2023,
			jahr: 2021,
			isRepeatElection: false
		});
		expect(title).toBe('Abgeordnetenhaus 2021 · Erststimme | navigator.berlin');
	});

	it('BVV hat keine Stimmart im Titel', () => {
		const { title } = buildWahlMeta({
			...agh2023,
			typ: 'bvv',
			stimmtyp: 'einstimme',
			isRepeatElection: false
		});
		expect(title).toBe('BVV 2023 | navigator.berlin');
	});

	it('EN: bleibt auch für die lange Wiederholungswahl bei höchstens 60 Zeichen', () => {
		const { title } = buildWahlMeta({ ...agh2023, locale: 'en' });
		expect(title.length).toBeLessThanOrEqual(60);
		expect(title).toContain('House of Representatives 2023');
		expect(title).toContain('constituency vote');
	});

	it('EN: lässt die Marke weg, wenn sie die Grenze sprengt', () => {
		const { title } = buildWahlMeta({
			...agh2023,
			isRepeatElection: false,
			stimmtyp: 'zweitstimme',
			locale: 'en'
		});
		expect(title).toBe('House of Representatives 2023 · party vote');
	});

	it('EN: behält die Marke bei kurzem Titel', () => {
		const { title } = buildWahlMeta({
			...agh2023,
			typ: 'btw',
			jahr: 2025,
			isRepeatElection: false,
			stimmtyp: 'zweitstimme',
			locale: 'en'
		});
		expect(title).toBe('Bundestag 2025 · party vote | navigator.berlin');
	});
});

describe('buildWahlMeta Beschreibung', () => {
	it('DE: nennt Stimmart, Ebenen und stärkste Partei', () => {
		const { description } = buildWahlMeta(agh2023);
		expect(description).toBe(
			'Abgeordnetenhaus 2023, Erststimme, Wiederholungswahl: Ergebnis je Bezirk und Stimmbezirk. Stärkste Partei in Berlin: CDU mit 28,3 %.'
		);
	});

	it('EN: nennt Stimmart, Ebenen und stärkste Partei', () => {
		const { description } = buildWahlMeta({ ...agh2023, locale: 'en' });
		expect(description).toContain(
			'House of Representatives 2023, constituency vote, repeat election'
		);
		expect(description).toContain('Strongest party in Berlin: CDU with 28.3');
	});

	it('Erst- und Zweitstimme unterscheiden sich', () => {
		const erst = buildWahlMeta(agh2023).description;
		const zweit = buildWahlMeta({ ...agh2023, stimmtyp: 'zweitstimme' }).description;
		expect(erst).not.toBe(zweit);
	});

	it('ohne Stimmbezirke entfällt die Stimmbezirk-Ebene', () => {
		const { description } = buildWahlMeta({ ...agh2023, hasStimmbezirke: false });
		expect(description).toContain('Ergebnis je Bezirk.');
		expect(description).not.toContain('Stimmbezirk');
	});

	it('ohne Partei entfällt der zweite Satz', () => {
		const { description } = buildWahlMeta({ ...agh2023, topParty: null });
		expect(description).toBe(
			'Abgeordnetenhaus 2023, Erststimme, Wiederholungswahl: Ergebnis je Bezirk und Stimmbezirk. Top 3 Parteien je Bezirk, mit Quelle und Lizenz.'
		);
	});

	it('BVV nennt keine Stimmart', () => {
		const { description } = buildWahlMeta({
			...agh2023,
			typ: 'bvv',
			stimmtyp: 'einstimme',
			topParty: null
		});
		expect(description.startsWith('BVV 2023, Wiederholungswahl: Ergebnis')).toBe(true);
	});

	it('Sonstige zählt nicht als stärkste Partei', () => {
		const { description } = buildWahlMeta({
			...agh2023,
			topParty: { kurzname: 'Sonstige', anteil: 0.3 }
		});
		expect(description).not.toContain('Stärkste Partei');
	});

	it('vorläufige Ergebnisse tragen den Zusatz im Partei-Satz', () => {
		const de = buildWahlMeta({ ...agh2023, isRepeatElection: false, vorlaeufig: true });
		expect(de.description).toContain('Stärkste Partei in Berlin (vorläufig): CDU');
		const en = buildWahlMeta({
			...agh2023,
			isRepeatElection: false,
			vorlaeufig: true,
			locale: 'en'
		});
		expect(en.description).toContain('Strongest party in Berlin (preliminary): CDU');
	});

	it('Teil-Wiederholung der Bundestagswahl nennt keine stärkste Partei in Berlin', () => {
		const { description } = buildWahlMeta({ ...agh2023, typ: 'btw', jahr: 2024 });
		expect(description).not.toContain('Stärkste Partei');
		expect(description).toContain('Wiederholungswahl');
	});

	it('vollständige Wiederholung (AGH, BVV) nennt die stärkste Partei', () => {
		expect(buildWahlMeta({ ...agh2023 }).description).toContain('Stärkste Partei in Berlin');
		const bvv = buildWahlMeta({ ...agh2023, typ: 'bvv', stimmtyp: 'einstimme' });
		expect(bvv.description).toContain('Stärkste Partei in Berlin');
	});

	it('bleibt in allen Kombinationen zwischen 70 und 160 Zeichen', () => {
		const tops = [null, { kurzname: 'Die Linke', anteil: 0.1992 }] as const;
		for (const locale of ['de', 'en'] as const) {
			for (const typ of ['btw', 'agh', 'bvv'] as const) {
				for (const topParty of tops) {
					for (const hasStimmbezirke of [true, false]) {
						for (const isRepeatElection of [true, false]) {
							for (const vorlaeufig of [true, false]) {
								const stimmtyp = typ === 'bvv' ? 'einstimme' : 'zweitstimme';
								const { description } = buildWahlMeta({
									...agh2023,
									typ,
									stimmtyp,
									topParty,
									hasStimmbezirke,
									isRepeatElection,
									vorlaeufig,
									locale
								});
								const label = JSON.stringify({
									locale,
									typ,
									topParty,
									hasStimmbezirke,
									isRepeatElection,
									vorlaeufig,
									description
								});
								expect(description.length, label).toBeGreaterThanOrEqual(70);
								expect(description.length, label).toBeLessThanOrEqual(160);
							}
						}
					}
				}
			}
		}
	});
});
