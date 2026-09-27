import { describe, it, expect } from 'vitest';
import { describePetKategorie, petErklaerungDe, formatPet, formatShareProzent } from './klima.js';

describe('describePetKategorie', () => {
	it('kategorisiert nach DWD-Schwellen (Alt-Verhalten)', () => {
		expect(describePetKategorie(30)).toBe('thermisch entspannt');
		expect(describePetKategorie(38)).toBe('gemäßigt');
		expect(describePetKategorie(43)).toBe('thermisch belastet');
		expect(describePetKategorie(50)).toBe('stark belastet');
		expect(describePetKategorie(null)).toBe('unbekannt');
	});

	// i18n Block B4a
	it('liefert EN mit opts.locale (folgt der PET-Skala: no/moderate/heavy stress)', () => {
		expect(describePetKategorie(30, { locale: 'en' })).toBe('no heat stress');
		expect(describePetKategorie(38, { locale: 'en' })).toBe('moderate heat stress');
		expect(describePetKategorie(43, { locale: 'en' })).toBe('heat stress');
		expect(describePetKategorie(50, { locale: 'en' })).toBe('strong heat stress');
	});
});

describe('petErklaerungDe', () => {
	it('bleibt DE ohne opts (Server-FAQ-Boundary)', () => {
		expect(petErklaerungDe(30)).toMatch(/gefühlte Temperatur/);
	});
	it('liefert EN mit opts.locale', () => {
		expect(petErklaerungDe(30, { locale: 'en' })).toBe(
			'On typical summer days, the perceived temperature stays below the stress threshold.'
		);
	});
});

describe('formatPet', () => {
	it('formatiert de mit Komma (Alt-Verhalten)', () => {
		expect(formatPet(24.567)).toBe('24,6');
	});
	it('formatiert en mit Punkt', () => {
		expect(formatPet(24.567, { locale: 'en' })).toBe('24.6');
	});
});

describe('formatShareProzent', () => {
	it('bleibt DE ohne opts', () => {
		expect(formatShareProzent(0.5)).toBe('50 Prozent');
	});
	it('liefert EN mit opts.locale', () => {
		expect(formatShareProzent(0.5, { locale: 'en' })).toBe('50 percent');
	});
});
