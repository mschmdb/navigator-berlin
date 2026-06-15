import { describe, expect, it } from 'vitest';
import { regionComposite, type RegionComposites } from './get-region-composites.js';

const DATA: RegionComposites = {
	schemaVersion: 1,
	generatedAt: '2026-06-10T00:00:00.000Z',
	kiez: {
		'tempelhofer-vorstadt': 53.3,
		'heerstrasse-spandau': 41,
		'heerstrasse-charlottenburg-wilmersdorf': 47,
		'leer-kiez': null
	},
	bezirk: { 'friedrichshain-kreuzberg': 52.6, mitte: 46 }
};

describe('regionComposite', () => {
	it('liefert den BR-Composite über den direkten Slug', () => {
		expect(regionComposite(DATA, 'kiez', 'tempelhofer-vorstadt', 'friedrichshain-kreuzberg')).toBe(
			53.3
		);
	});

	it('löst disambiguierte BR-Slugs via name-bezirk-Fallback', () => {
		// level.kiezSlug ist der Basis-Slug „heerstrasse" → Fallback heerstrasse-{bezirk}
		expect(regionComposite(DATA, 'kiez', 'heerstrasse', 'spandau')).toBe(41);
		expect(regionComposite(DATA, 'kiez', 'heerstrasse', 'charlottenburg-wilmersdorf')).toBe(47);
	});

	it('liefert den Bezirks-Composite', () => {
		expect(
			regionComposite(DATA, 'bezirk', 'tempelhofer-vorstadt', 'friedrichshain-kreuzberg')
		).toBe(52.6);
	});

	it('liefert null bei fehlendem Slug / null-Daten / null-Wert', () => {
		expect(regionComposite(null, 'kiez', 'x', 'y')).toBeNull();
		expect(regionComposite(DATA, 'kiez', 'unbekannt', 'mitte')).toBeNull();
		expect(regionComposite(DATA, 'bezirk', null, null)).toBeNull();
		expect(regionComposite(DATA, 'kiez', 'leer-kiez', 'mitte')).toBeNull();
	});
});
