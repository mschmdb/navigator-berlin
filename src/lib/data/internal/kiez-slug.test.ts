import { describe, expect, it } from 'vitest';
import { buildKiezSlugs, resolveKiezSlugIndex, type KiezNameRef } from './kiez-slug.js';

describe('buildKiezSlugs', () => {
	it('liefert bare Slug für eindeutige Namen', () => {
		const refs: KiezNameRef[] = [
			{ name: 'Tiergarten Süd', bezirk: 'Mitte' },
			{ name: 'Hansaviertel', bezirk: 'Mitte' }
		];
		expect(buildKiezSlugs(refs)).toEqual(['tiergarten-sued', 'hansaviertel']);
	});

	it('hängt Bezirk-Suffix an Duplikat-Namen an', () => {
		const refs: KiezNameRef[] = [
			{ name: 'Heerstraße', bezirk: 'Spandau' },
			{ name: 'Heerstraße', bezirk: 'Charlottenburg-Wilmersdorf' }
		];
		expect(buildKiezSlugs(refs)).toEqual([
			'heerstrasse-spandau',
			'heerstrasse-charlottenburg-wilmersdorf'
		]);
	});

	it('lässt eindeutige Namen unverändert auch wenn andere Duplikate existieren', () => {
		const refs: KiezNameRef[] = [
			{ name: 'Heerstraße', bezirk: 'Spandau' },
			{ name: 'Heerstraße', bezirk: 'Charlottenburg-Wilmersdorf' },
			{ name: 'Hansaviertel', bezirk: 'Mitte' }
		];
		expect(buildKiezSlugs(refs)).toEqual([
			'heerstrasse-spandau',
			'heerstrasse-charlottenburg-wilmersdorf',
			'hansaviertel'
		]);
	});

	it('normalisiert Umlaute in Name und Bezirk-Suffix', () => {
		const refs: KiezNameRef[] = [
			{ name: 'Köllnische Heide', bezirk: 'Neukölln' },
			{ name: 'Köllnische Heide', bezirk: 'Treptow-Köpenick' }
		];
		expect(buildKiezSlugs(refs)).toEqual([
			'koellnische-heide-neukoelln',
			'koellnische-heide-treptow-koepenick'
		]);
	});

	it('disambiguiert Dreifach-Duplikate vollständig', () => {
		const refs: KiezNameRef[] = [
			{ name: 'Zentrum', bezirk: 'Mitte' },
			{ name: 'Zentrum', bezirk: 'Pankow' },
			{ name: 'Zentrum', bezirk: 'Spandau' }
		];
		expect(buildKiezSlugs(refs)).toEqual([
			'zentrum-mitte',
			'zentrum-pankow',
			'zentrum-spandau'
		]);
	});

	it('erhält Eingabe-Reihenfolge (Index-Alignment)', () => {
		const refs: KiezNameRef[] = [
			{ name: 'B-Kiez', bezirk: 'Mitte' },
			{ name: 'A-Kiez', bezirk: 'Mitte' }
		];
		expect(buildKiezSlugs(refs)).toEqual(['b-kiez', 'a-kiez']);
	});

	it('liefert leere Liste für leere Eingabe', () => {
		expect(buildKiezSlugs([])).toEqual([]);
	});
});

describe('resolveKiezSlugIndex', () => {
	const refs: KiezNameRef[] = [
		{ name: 'Heerstraße', bezirk: 'Spandau' },
		{ name: 'Heerstraße', bezirk: 'Charlottenburg-Wilmersdorf' },
		{ name: 'Hansaviertel', bezirk: 'Mitte' }
	];

	it('löst eindeutigen bare Slug auf', () => {
		expect(resolveKiezSlugIndex(refs, 'hansaviertel')).toBe(2);
	});

	it('löst suffixed Duplikat-Slug auf den richtigen Bezirk auf', () => {
		expect(resolveKiezSlugIndex(refs, 'heerstrasse-spandau')).toBe(0);
		expect(resolveKiezSlugIndex(refs, 'heerstrasse-charlottenburg-wilmersdorf')).toBe(1);
	});

	it('liefert -1 für unbekannten Slug', () => {
		expect(resolveKiezSlugIndex(refs, 'gibt-es-nicht')).toBe(-1);
	});

	it('liefert -1 für bare Slug eines Duplikat-Namens (kein bare Slug existiert)', () => {
		expect(resolveKiezSlugIndex(refs, 'heerstrasse')).toBe(-1);
	});

	it('normalisiert die angefragte Eingabe vor dem Abgleich', () => {
		expect(resolveKiezSlugIndex(refs, 'Hansaviertel')).toBe(2);
	});
});
