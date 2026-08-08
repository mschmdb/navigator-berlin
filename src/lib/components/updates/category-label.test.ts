import { describe, expect, it } from 'vitest';
import { CATEGORY_LABEL_DE, formatDateDe } from './category-label.js';
import { UPDATE_CATEGORIES } from '$lib/content/updates/frontmatter-schema.js';

describe('CATEGORY_LABEL_DE', () => {
	it('hat Label für alle 6 Categories', () => {
		for (const cat of UPDATE_CATEGORIES) {
			expect(CATEGORY_LABEL_DE[cat]).toBeDefined();
			expect(typeof CATEGORY_LABEL_DE[cat]).toBe('string');
		}
	});

	it('hat das Label Presse für die Category presse', () => {
		expect(CATEGORY_LABEL_DE.presse).toBe('Presse');
	});

	it('verwendet keine em-dashes (U+2014)', () => {
		for (const label of Object.values(CATEGORY_LABEL_DE)) {
			expect(label).not.toMatch(/—/);
		}
	});
});

describe('formatDateDe', () => {
	it('formatiert ISO-Datum zu DE-Lang', () => {
		expect(formatDateDe('2026-05-15')).toBe('15. Mai 2026');
		expect(formatDateDe('2026-01-01')).toBe('1. Januar 2026');
		expect(formatDateDe('2026-12-31')).toBe('31. Dezember 2026');
	});

	it('Fallback bei invalidem Input', () => {
		expect(formatDateDe('invalid')).toBe('invalid');
	});
});
