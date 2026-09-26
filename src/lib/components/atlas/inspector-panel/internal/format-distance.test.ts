import { describe, expect, it } from 'vitest';
import { formatDistance, formatDistanceDe } from './format-distance.js';

describe('formatDistance', () => {
	it('unter 1000 m in Metern', () => {
		expect(formatDistance(0)).toBe('0 m');
		expect(formatDistance(950)).toBe('950 m');
		expect(formatDistance(999)).toBe('999 m');
	});

	it('ab 1000 m in Kilometern mit deutschem Dezimalkomma (Default DE, Boundary)', () => {
		expect(formatDistance(1000)).toBe('1,0 km');
		expect(formatDistance(1500)).toBe('1,5 km');
		expect(formatDistance(12340)).toBe('12,3 km');
	});

	it('EN mit Punkt-Dezimaltrennzeichen', () => {
		expect(formatDistance(1500, { locale: 'en' })).toBe('1.5 km');
	});

	// Review-Fund: Name war irreführend (suggerierte "immer DE"), Funktion
	// ist seit i18n Block B3a locale-fähig -- `formatDistanceDe` bleibt als
	// deprecated Alias für bestehende Aufrufer.
	it('formatDistanceDe ist ein deprecated Alias auf formatDistance', () => {
		expect(formatDistanceDe).toBe(formatDistance);
	});
});
