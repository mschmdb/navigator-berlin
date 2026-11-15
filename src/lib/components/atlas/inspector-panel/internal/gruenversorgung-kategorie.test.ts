import { describe, it, expect } from 'vitest';
import { mapGruenversorgungKategorie } from './gruenversorgung-kategorie.js';

// NAV-108: Senats-Skala gut/mittel/schlecht, ältere neutrale Bezeichnungen werden zurückgemappt.
describe('mapGruenversorgungKategorie()', () => {
	it('Senats-Wörter bleiben', () => {
		expect(mapGruenversorgungKategorie('gut')).toBe('gut');
		expect(mapGruenversorgungKategorie('mittel')).toBe('mittel');
		expect(mapGruenversorgungKategorie('schlecht')).toBe('schlecht');
	});
	it('neutrale Bezeichnungen aus Story 1.22 werden zu Senats-Wörtern', () => {
		expect(mapGruenversorgungKategorie('hoch')).toBe('gut');
		expect(mapGruenversorgungKategorie('gering')).toBe('schlecht');
		expect(mapGruenversorgungKategorie('niedrig')).toBe('schlecht');
		expect(mapGruenversorgungKategorie('sehr hoch')).toBe('gut');
		expect(mapGruenversorgungKategorie('sehr gering')).toBe('schlecht');
		expect(mapGruenversorgungKategorie('sehr gut')).toBe('gut');
	});
	it('case-insensitive + trim', () => {
		expect(mapGruenversorgungKategorie('  Schlecht ')).toBe('schlecht');
	});
	it('unbekannte Werte bleiben unverändert', () => {
		expect(mapGruenversorgungKategorie('unbekannt')).toBe('unbekannt');
	});
});
