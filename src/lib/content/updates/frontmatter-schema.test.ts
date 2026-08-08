import { describe, expect, it } from 'vitest';
import { parseFrontmatter, UPDATE_CATEGORIES, type UpdateCategory } from './frontmatter-schema.js';

describe('frontmatter-schema', () => {
	const validFrontmatter = {
		title_de: 'Stolpersteine OSM-Sync erweitert',
		summary_de: 'OSM-Snapshot vom 2026-05-10 mit 384 zusätzlichen Marker-Punkten.',
		date: '2026-05-15',
		category: 'daten-update' as UpdateCategory
	};

	it('akzeptiert valide DE-only Pflichtfelder', () => {
		const result = parseFrontmatter(validFrontmatter);
		expect(result.title_de).toBe('Stolpersteine OSM-Sync erweitert');
		expect(result.category).toBe('daten-update');
		expect(result.date).toBe('2026-05-15');
	});

	it('akzeptiert optionale EN-Felder', () => {
		const result = parseFrontmatter({
			...validFrontmatter,
			title_en: 'Stumbling stones OSM sync expanded',
			summary_en: 'OSM snapshot 2026-05-10 with 384 new marker points.'
		});
		expect(result.title_en).toBe('Stumbling stones OSM sync expanded');
	});

	it('wirft bei fehlendem title_de', () => {
		const { title_de: _omit, ...without } = validFrontmatter;
		expect(() => parseFrontmatter(without)).toThrow(/title_de/);
	});

	it('wirft bei fehlendem summary_de', () => {
		const { summary_de: _omit, ...without } = validFrontmatter;
		expect(() => parseFrontmatter(without)).toThrow(/summary_de/);
	});

	it('wirft bei fehlendem date', () => {
		const { date: _omit, ...without } = validFrontmatter;
		expect(() => parseFrontmatter(without)).toThrow(/date/);
	});

	it('wirft bei invalidem date-Format', () => {
		expect(() => parseFrontmatter({ ...validFrontmatter, date: '2026/05/15' })).toThrow(/date/);
	});

	it('wirft bei title_de länger als 80 Zeichen', () => {
		const longTitle = 'a'.repeat(81);
		expect(() => parseFrontmatter({ ...validFrontmatter, title_de: longTitle })).toThrow();
	});

	it('wirft bei summary_de länger als 160 Zeichen', () => {
		const longSummary = 'a'.repeat(161);
		expect(() => parseFrontmatter({ ...validFrontmatter, summary_de: longSummary })).toThrow();
	});

	it('wirft bei unbekannter Category', () => {
		expect(() => parseFrontmatter({ ...validFrontmatter, category: 'unbekannt' })).toThrow(
			/category/
		);
	});

	it('akzeptiert alle 6 Categories', () => {
		for (const cat of UPDATE_CATEGORIES) {
			const result = parseFrontmatter({ ...validFrontmatter, category: cat });
			expect(result.category).toBe(cat);
		}
	});

	it('akzeptiert die Category presse', () => {
		const result = parseFrontmatter({ ...validFrontmatter, category: 'presse' });
		expect(result.category).toBe('presse');
	});

	it('akzeptiert tags-Array max 8 lowercase-kebab', () => {
		const result = parseFrontmatter({
			...validFrontmatter,
			tags: ['stolpersteine', 'osm', 'sync']
		});
		expect(result.tags).toEqual(['stolpersteine', 'osm', 'sync']);
	});

	it('wirft bei mehr als 8 tags', () => {
		expect(() =>
			parseFrontmatter({
				...validFrontmatter,
				tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
			})
		).toThrow();
	});

	it('wirft bei tags mit Großbuchstaben oder Spaces', () => {
		expect(() => parseFrontmatter({ ...validFrontmatter, tags: ['Großbuchstabe'] })).toThrow();
		expect(() => parseFrontmatter({ ...validFrontmatter, tags: ['mit space'] })).toThrow();
	});

	it('default lang = de wenn nicht gesetzt', () => {
		const result = parseFrontmatter(validFrontmatter);
		expect(result.lang).toBe('de');
	});
});
