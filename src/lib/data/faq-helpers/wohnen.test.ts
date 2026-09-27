import { describe, it, expect } from 'vitest';
import { describeWohnlageDe, describeMssDe, mssBeschreibungDe } from './wohnen.js';

describe('describeWohnlageDe', () => {
	it('normalisiert Roh-Kategorien (Alt-Verhalten)', () => {
		expect(describeWohnlageDe('einfach')).toBe('einfache Wohnlage');
		expect(describeWohnlageDe('mittel')).toBe('mittlere Wohnlage');
		expect(describeWohnlageDe('gut')).toBe('gute Wohnlage');
		expect(describeWohnlageDe(null)).toBe('unbekannt');
	});

	// i18n Block B4a
	it('liefert EN mit opts.locale ("simple", nicht "basic")', () => {
		expect(describeWohnlageDe('einfach', { locale: 'en' })).toBe('simple residential area');
		expect(describeWohnlageDe('mittel', { locale: 'en' })).toBe('medium residential area');
		expect(describeWohnlageDe('gut', { locale: 'en' })).toBe('good residential area');
	});
});

describe('describeMssDe', () => {
	it('normalisiert Roh-Kategorien (Alt-Verhalten)', () => {
		expect(describeMssDe('hoch')).toBe('hoch');
		expect(describeMssDe(null)).toBe('unbekannt');
	});
	it('liefert EN mit opts.locale', () => {
		expect(describeMssDe('hoch', { locale: 'en' })).toBe('high');
	});
});

describe('mssBeschreibungDe', () => {
	it('bleibt DE ohne opts (Steckbrief + Server-FAQ)', () => {
		expect(mssBeschreibungDe('mittel')).toMatch(/mittleren Bereich/);
	});
	it('liefert EN mit opts.locale', () => {
		expect(mssBeschreibungDe('mittel', { locale: 'en' })).toBe(
			'The index is in the medium range of the Berlin distribution.'
		);
	});
});
