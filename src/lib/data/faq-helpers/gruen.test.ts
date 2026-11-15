import { describe, it, expect } from 'vitest';
import { describeGruenversorgungDe } from './gruen.js';

describe('describeGruenversorgungDe', () => {
	it('nennt die Senats-Stufen gut/mittel/schlecht (NAV-108)', () => {
		expect(describeGruenversorgungDe('gut')).toBe('gut');
		expect(describeGruenversorgungDe('mittel')).toBe('mittel');
		expect(describeGruenversorgungDe('schlecht')).toBe('schlecht');
		expect(describeGruenversorgungDe(null)).toBe('unbekannt');
	});

	it('mappt ältere neutrale Bezeichnungen auf die Senats-Stufen', () => {
		expect(describeGruenversorgungDe('hoch')).toBe('gut');
		expect(describeGruenversorgungDe('gering')).toBe('schlecht');
	});

	// i18n Block B4a
	it('liefert EN mit opts.locale', () => {
		expect(describeGruenversorgungDe('gut', { locale: 'en' })).toBe('good');
		expect(describeGruenversorgungDe('schlecht', { locale: 'en' })).toBe('poor');
	});
});
