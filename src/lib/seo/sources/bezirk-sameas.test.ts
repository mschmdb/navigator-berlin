import { describe, it, expect } from 'vitest';
import { BEZIRK_SAMEAS, bezirkSameAs } from './bezirk-sameas.js';

const BEZIRK_SLUGS = [
	'charlottenburg-wilmersdorf',
	'friedrichshain-kreuzberg',
	'lichtenberg',
	'marzahn-hellersdorf',
	'mitte',
	'neukoelln',
	'pankow',
	'reinickendorf',
	'spandau',
	'steglitz-zehlendorf',
	'tempelhof-schoeneberg',
	'treptow-koepenick'
];

describe('bezirk-sameas (Story 11.1)', () => {
	it('deckt genau die 12 aktuellen Bezirke ab', () => {
		expect(Object.keys(BEZIRK_SAMEAS).sort()).toEqual([...BEZIRK_SLUGS].sort());
	});

	it('jeder Eintrag hat valide Wikidata- + Wikipedia-URLs', () => {
		for (const [slug, entry] of Object.entries(BEZIRK_SAMEAS)) {
			expect(entry.wikidata, slug).toMatch(/^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/);
			expect(entry.wikipedia, slug).toMatch(/^https:\/\/de\.wikipedia\.org\/wiki\/Bezirk_/);
		}
	});

	it('bezirkSameAs liefert [wikidata, wikipedia] für bekannten Slug', () => {
		expect(bezirkSameAs('mitte')).toEqual([
			'https://www.wikidata.org/wiki/Q163966',
			'https://de.wikipedia.org/wiki/Bezirk_Mitte'
		]);
	});

	it('bezirkSameAs liefert [] für unbekannten Slug (kein erfundener Link)', () => {
		expect(bezirkSameAs('gibt-es-nicht')).toEqual([]);
	});
});
