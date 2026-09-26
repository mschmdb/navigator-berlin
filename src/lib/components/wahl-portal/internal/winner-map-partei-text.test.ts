import { describe, expect, it } from 'vitest';
import {
	buildParteiViewTexts,
	parteiKeineDatenHinweis,
	parteiLegendeRampeText,
	parteiLegendeTitel,
	parteiTableCaption,
	parteiTakeawaySentence
} from './winner-map-partei-text.js';

describe('parteiLegendeTitel', () => {
	it('nennt die Partei statt "Stärkste Partei"', () => {
		expect(parteiLegendeTitel('CDU')).toBe('Anteil CDU');
	});

	it('EN: „Share Partei"', () => {
		expect(parteiLegendeTitel('CDU', { locale: 'en' })).toBe('Share CDU');
	});
});

describe('parteiLegendeRampeText', () => {
	it('nennt die reale Spanne in Prozent und die Normierungs-Bezugsgröße', () => {
		const text = parteiLegendeRampeText({ min: 0.1, max: 0.5 });
		expect(text).toContain('10,0 %');
		expect(text).toContain('50,0 %');
		expect(text.toLowerCase()).toContain('reihe');
	});

	it('EN: Spanne mit Punkt-Dezimaltrennzeichen, Bezugsgröße „series"', () => {
		const text = parteiLegendeRampeText({ min: 0.1, max: 0.5 }, { locale: 'en' });
		expect(text).toContain('10.0%');
		expect(text).toContain('50.0%');
		expect(text.toLowerCase()).toContain('series');
	});
});

describe('parteiTableCaption', () => {
	it('nennt Partei und Jahr', () => {
		expect(parteiTableCaption('SPD', 2023)).toBe('Anteil SPD je Gebiet, 2023');
	});

	it('lässt das Jahr weg, wenn keins bekannt ist', () => {
		expect(parteiTableCaption('SPD', null)).toBe('Anteil SPD je Gebiet');
	});

	it('EN: „Share Partei by area[, Jahr]"', () => {
		expect(parteiTableCaption('SPD', 2023, { locale: 'en' })).toBe('Share SPD by area, 2023');
		expect(parteiTableCaption('SPD', null, { locale: 'en' })).toBe('Share SPD by area');
	});
});

describe('parteiTakeawaySentence', () => {
	it('nennt die Spanne über alle Gebiete bei vorhandenen Daten UND die reihen-weite Bezugsgröße explizit (Review-Fund #3)', () => {
		const text = parteiTakeawaySentence('CDU', true, 143, { min: 0.1, max: 0.5 });
		expect(text).toContain('CDU');
		expect(text).toContain('143');
		expect(text).toContain('10,0 %');
		expect(text).toContain('50,0 %');
		expect(text).toContain('über alle Wahlen der Reihe');
		expect(text).not.toMatch(/hochburg/i);
	});

	it('zeigt einen neutralen Hinweis ohne Daten (z.B. BSW vor 2023), kein Crash', () => {
		const text = parteiTakeawaySentence('BSW', false, 143, { min: 0, max: 1 });
		expect(text).toBe(parteiKeineDatenHinweis('BSW'));
	});

	it('EN: Spanne und Bezugsgröße auf Englisch', () => {
		const text = parteiTakeawaySentence('CDU', true, 143, { min: 0.1, max: 0.5 }, { locale: 'en' });
		expect(text).toBe(
			'CDU: share between 10.0% and 50.0% across all elections in the series (143 areas).'
		);
	});

	it('EN: neutraler Hinweis ohne Daten', () => {
		const text = parteiTakeawaySentence('BSW', false, 143, { min: 0, max: 1 }, { locale: 'en' });
		expect(text).toBe(parteiKeineDatenHinweis('BSW', { locale: 'en' }));
		expect(text).toBe('No data is available for BSW in this election series.');
	});
});

describe('buildParteiViewTexts', () => {
	it('bündelt alle vier Text-Bausteine konsistent', () => {
		const texts = buildParteiViewTexts({
			partei: 'GRÜNE',
			jahr: 2021,
			hasData: true,
			totalGebiete: 12,
			spanne: { min: 0.2, max: 0.4 }
		});
		expect(texts.legendeTitel).toBe('Anteil GRÜNE');
		expect(texts.tableCaption).toBe('Anteil GRÜNE je Gebiet, 2021');
		expect(texts.takeaway).toContain('GRÜNE');
		expect(texts.legendeRampeText).toContain('20,0 %');
	});

	it('zeigt ohne Jahres-Daten einen Hinweis-Satz statt einer erfundenen Rampe (Review-Fund #5: nie „0,0 % bis 100,0 %")', () => {
		const texts = buildParteiViewTexts({
			partei: 'BSW',
			jahr: 2016,
			hasData: false,
			totalGebiete: 143,
			spanne: { min: 0, max: 1 }
		});
		expect(texts.legendeRampeText).toBe(parteiKeineDatenHinweis('BSW'));
		expect(texts.legendeRampeText).not.toContain('0,0 %');
		expect(texts.legendeRampeText).not.toContain('100,0 %');
	});

	it('EN: bündelt alle vier Text-Bausteine auf Englisch (locale-Feld im Input)', () => {
		const texts = buildParteiViewTexts({
			partei: 'GRÜNE',
			jahr: 2021,
			hasData: true,
			totalGebiete: 12,
			spanne: { min: 0.2, max: 0.4 },
			locale: 'en'
		});
		expect(texts.legendeTitel).toBe('Share GRÜNE');
		expect(texts.tableCaption).toBe('Share GRÜNE by area, 2021');
		expect(texts.takeaway).toContain('GRÜNE');
		expect(texts.legendeRampeText).toContain('20.0%');
	});
});
