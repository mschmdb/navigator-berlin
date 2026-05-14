// Story 1.22: Skala-Harmonisierung Grünversorgung.
import { describe, expect, it } from 'vitest';
import { mapGruenversorgungKategorie } from './gruenversorgung-kategorie.js';

describe('mapGruenversorgungKategorie()', () => {
	it('schlecht → gering', () => {
		expect(mapGruenversorgungKategorie('schlecht')).toBe('gering');
	});
	it('mittel → mittel', () => {
		expect(mapGruenversorgungKategorie('mittel')).toBe('mittel');
	});
	it('gut → hoch', () => {
		expect(mapGruenversorgungKategorie('gut')).toBe('hoch');
	});
	it('sehr schlecht → sehr gering', () => {
		expect(mapGruenversorgungKategorie('sehr schlecht')).toBe('sehr gering');
	});
	it('sehr gut → sehr hoch', () => {
		expect(mapGruenversorgungKategorie('sehr gut')).toBe('sehr hoch');
	});
	it('already-harmonized gering/hoch passes through', () => {
		expect(mapGruenversorgungKategorie('gering')).toBe('gering');
		expect(mapGruenversorgungKategorie('hoch')).toBe('hoch');
		expect(mapGruenversorgungKategorie('sehr hoch')).toBe('sehr hoch');
	});
	it('niedrig → gering (Alias)', () => {
		expect(mapGruenversorgungKategorie('niedrig')).toBe('gering');
		expect(mapGruenversorgungKategorie('sehr niedrig')).toBe('sehr gering');
	});
	it('case-insensitive + trim', () => {
		expect(mapGruenversorgungKategorie(' GUT ')).toBe('hoch');
		expect(mapGruenversorgungKategorie('Schlecht')).toBe('gering');
	});
	it('unknown bleibt unverändert', () => {
		expect(mapGruenversorgungKategorie('unbekannt')).toBe('unbekannt');
	});
});
