import { describe, expect, it } from 'vitest';
import { parseCategoryFilter, serializeCategoryFilter } from './parse-filter.js';

describe('parseCategoryFilter', () => {
	it('null oder leer liefert leeren Set (Filter inaktiv = alle)', () => {
		expect(parseCategoryFilter(null).size).toBe(0);
		expect(parseCategoryFilter('').size).toBe(0);
	});

	it('single category', () => {
		const set = parseCategoryFilter('feature');
		expect(set.size).toBe(1);
		expect(set.has('feature')).toBe(true);
	});

	it('multi via Komma', () => {
		const set = parseCategoryFilter('feature,methodik');
		expect(set.size).toBe(2);
		expect(set.has('feature')).toBe(true);
		expect(set.has('methodik')).toBe(true);
	});

	it('unbekannte Categories werden silent-ignoriert', () => {
		const set = parseCategoryFilter('feature,unbekannt,methodik');
		expect(set.size).toBe(2);
		expect(set.has('feature')).toBe(true);
		expect(set.has('methodik')).toBe(true);
		expect(set.has('unbekannt' as never)).toBe(false);
	});

	it('Duplikate dedupliziert', () => {
		const set = parseCategoryFilter('feature,feature,methodik');
		expect(set.size).toBe(2);
	});

	it('Whitespace strippen', () => {
		const set = parseCategoryFilter(' feature , methodik ');
		expect(set.size).toBe(2);
		expect(set.has('feature')).toBe(true);
		expect(set.has('methodik')).toBe(true);
	});
});

describe('serializeCategoryFilter', () => {
	it('leerer Set → leerer String', () => {
		expect(serializeCategoryFilter(new Set())).toBe('');
	});

	it('Single → Single-Value', () => {
		expect(serializeCategoryFilter(new Set(['feature']))).toBe('feature');
	});

	it('Multi alphabetisch sortiert', () => {
		expect(serializeCategoryFilter(new Set(['methodik', 'feature']))).toBe('feature,methodik');
	});
});
