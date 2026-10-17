import { describe, it, expect } from 'vitest';
import { describeLaermCategoryDe, laermErklaerungDe } from './laerm.js';

describe('describeLaermCategoryDe', () => {
	it('normalisiert Roh-Kategorien auf DE-Substantive (Alt-Verhalten)', () => {
		expect(describeLaermCategoryDe('niedrig')).toBe('gering');
		expect(describeLaermCategoryDe('mittel')).toBe('mittel');
		expect(describeLaermCategoryDe('hoch')).toBe('hoch');
		expect(describeLaermCategoryDe('sehr hoch')).toBe('sehr hoch');
		expect(describeLaermCategoryDe(null)).toBe('unbekannt');
	});

	// i18n Block B4a
	it('liefert EN mit opts.locale', () => {
		expect(describeLaermCategoryDe('hoch', { locale: 'en' })).toBe('high');
		expect(describeLaermCategoryDe(null, { locale: 'en' })).toBe('unknown');
	});
});

describe('laermErklaerungDe', () => {
	it('bleibt DE ohne opts (Server-FAQ-Boundary)', () => {
		expect(laermErklaerungDe('hoch')).toMatch(/hohe Pegel-Klasse/);
	});
	it('liefert EN mit opts.locale', () => {
		expect(laermErklaerungDe('hoch', { locale: 'en' })).toBe(
			'That is a high noise class, typical along main roads or railway lines.'
		);
	});
});
