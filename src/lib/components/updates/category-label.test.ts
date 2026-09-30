import { describe, expect, it } from 'vitest';
import { categoryLabel, formatUpdateDate } from './category-label.js';
import { UPDATE_CATEGORIES } from '$lib/content/updates/frontmatter-schema.js';

describe('categoryLabel', () => {
	it('liefert DE-Labels wie vor der Übersetzung', () => {
		expect(UPDATE_CATEGORIES.map((c) => categoryLabel(c, 'de'))).toEqual([
			'Daten-Update',
			'Feature',
			'Methodik',
			'Datenquelle',
			'Lizenz',
			'Presse'
		]);
	});

	it('liefert EN-Labels', () => {
		expect(UPDATE_CATEGORIES.map((c) => categoryLabel(c, 'en'))).toEqual([
			'Data update',
			'Feature',
			'Methodology',
			'Data source',
			'Licence',
			'Press'
		]);
	});

	it('verwendet keine em-dashes (U+2014)', () => {
		for (const locale of ['de', 'en'] as const) {
			for (const cat of UPDATE_CATEGORIES) {
				expect(categoryLabel(cat, locale)).not.toMatch(/—/);
			}
		}
	});
});

describe('formatUpdateDate', () => {
	it('formatiert ISO-Datum zu DE-Lang', () => {
		expect(formatUpdateDate('2026-05-15', 'de')).toBe('15. Mai 2026');
		expect(formatUpdateDate('2026-01-01', 'de')).toBe('1. Januar 2026');
		expect(formatUpdateDate('2026-12-31', 'de')).toBe('31. Dezember 2026');
	});

	it('formatiert ISO-Datum zu EN ohne Punkt, Tag zuerst', () => {
		expect(formatUpdateDate('2026-05-15', 'en')).toBe('15 May 2026');
		expect(formatUpdateDate('2026-01-01', 'en')).toBe('1 January 2026');
	});

	it('Fallback bei invalidem Input', () => {
		expect(formatUpdateDate('invalid', 'de')).toBe('invalid');
		expect(formatUpdateDate('invalid', 'en')).toBe('invalid');
	});
});
