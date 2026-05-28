import { describe, expect, it } from 'vitest';
import { readKiezSlugsFromGeoJson } from './kiez-slugs.js';

/**
 * Integration gegen die echten static/layers-Daten. Verifiziert die
 * Slug-Disambiguierung des einzigen Duplikat-Namens "Heerstraße"
 * (BEZ 04 Charlottenburg-Wilmersdorf + BEZ 05 Spandau).
 */
describe('readKiezSlugsFromGeoJson', () => {
	it('liefert einen Slug pro LOR-Bezirksregion (143)', async () => {
		const slugs = await readKiezSlugsFromGeoJson();
		expect(slugs).toHaveLength(143);
	});

	it('disambiguiert den Duplikat-Namen Heerstraße mit Bezirk-Suffix', async () => {
		const slugs = await readKiezSlugsFromGeoJson();
		expect(slugs).toContain('heerstrasse-spandau');
		expect(slugs).toContain('heerstrasse-charlottenburg-wilmersdorf');
	});

	it('emittiert keinen bare Slug für den Duplikat-Namen', async () => {
		const slugs = await readKiezSlugsFromGeoJson();
		expect(slugs).not.toContain('heerstrasse');
	});

	it('liefert eindeutige (deduplizierte) Slugs', async () => {
		const slugs = await readKiezSlugsFromGeoJson();
		expect(new Set(slugs).size).toBe(slugs.length);
	});
});
