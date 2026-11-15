import { describe, it, expect } from 'vitest';
import { describeGruenversorgungDe } from './gruen.js';

describe('describeGruenversorgungDe', () => {
	it('normalisiert Roh-Kategorien auf DE-Substantive (Alt-Verhalten)', () => {
		expect(describeGruenversorgungDe('gut')).toBe('hoch');
		expect(describeGruenversorgungDe('mittel')).toBe('mittel');
		expect(describeGruenversorgungDe('schlecht')).toBe('gering');
		expect(describeGruenversorgungDe(null)).toBe('unbekannt');
	});

	// i18n Block B4a
	it('liefert EN mit opts.locale', () => {
		expect(describeGruenversorgungDe('gut', { locale: 'en' })).toBe('high');
	});
});
