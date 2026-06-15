import { describe, expect, it } from 'vitest';
import {
	applyHiddenSlugs,
	exceedsPolygonLimit,
	POLYGON_LAYER_LIMIT,
	polygonSlugCount
} from './layer-visibility.js';

describe('layer-visibility.polygonSlugCount', () => {
	it('zaehlt nur Polygon-Profile-Slugs', () => {
		expect(polygonSlugCount([])).toBe(0);
		expect(polygonSlugCount(['bezirke', 'ubahn-netz', 'kitas-2024'])).toBe(0);
		expect(polygonSlugCount(['laerm-2023'])).toBe(1);
		expect(
			polygonSlugCount(['laerm-2023', 'wohnlagen-2024', 'klima-pet-2022', 'bodenrichtwerte'])
		).toBe(4);
		expect(polygonSlugCount(['bezirke', 'laerm-2023', 'kitas-2024', 'wohnlagen-2024'])).toBe(2);
	});
});

describe('layer-visibility.exceedsPolygonLimit', () => {
	it('Schwelle 3: false fuer ≤3 Polygon-Layer', () => {
		expect(exceedsPolygonLimit([])).toBe(false);
		expect(exceedsPolygonLimit(['laerm-2023'])).toBe(false);
		expect(exceedsPolygonLimit(['laerm-2023', 'wohnlagen-2024'])).toBe(false);
		expect(exceedsPolygonLimit(['laerm-2023', 'wohnlagen-2024', 'klima-pet-2022'])).toBe(false);
	});

	it('Schwelle 3: true ab 4. Polygon-Layer', () => {
		expect(
			exceedsPolygonLimit(['laerm-2023', 'wohnlagen-2024', 'klima-pet-2022', 'bodenrichtwerte'])
		).toBe(true);
	});

	it('non-polygon-Slugs werden nicht gezaehlt', () => {
		expect(
			exceedsPolygonLimit([
				'bezirke',
				'ortsteile',
				'ubahn-netz',
				'sbahn-netz',
				'kitas-2024',
				'stolpersteine'
			])
		).toBe(false);
	});

	it('POLYGON_LAYER_LIMIT konstant 3', () => {
		expect(POLYGON_LAYER_LIMIT).toBe(3);
	});
});

describe('layer-visibility.applyHiddenSlugs', () => {
	it('leere hidden-Liste = unveraendert', () => {
		const slugs = ['bezirke', 'laerm-2023', 'kitas-2024'];
		expect(applyHiddenSlugs(slugs, [])).toEqual(slugs);
	});

	it('ein hidden-Slug wird gefiltert', () => {
		expect(applyHiddenSlugs(['bezirke', 'laerm-2023', 'kitas-2024'], ['laerm-2023'])).toEqual([
			'bezirke',
			'kitas-2024'
		]);
	});

	it('mehrere hidden-Slugs werden gefiltert', () => {
		expect(
			applyHiddenSlugs(
				['bezirke', 'laerm-2023', 'kitas-2024', 'wohnlagen-2024'],
				['laerm-2023', 'wohnlagen-2024']
			)
		).toEqual(['bezirke', 'kitas-2024']);
	});

	it('hidden-Slug nicht in active = no-op', () => {
		expect(applyHiddenSlugs(['bezirke'], ['laerm-2023'])).toEqual(['bezirke']);
	});

	it('alle hidden = leere Liste', () => {
		expect(applyHiddenSlugs(['bezirke', 'laerm-2023'], ['bezirke', 'laerm-2023'])).toEqual([]);
	});

	it('haelt Reihenfolge der active-Slugs', () => {
		expect(applyHiddenSlugs(['c-slug', 'b-slug', 'a-slug', 'd-slug'], ['b-slug'])).toEqual([
			'c-slug',
			'a-slug',
			'd-slug'
		]);
	});
});
