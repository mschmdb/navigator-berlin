import { describe, expect, it } from 'vitest';
import {
	applyHiddenSlugs,
	capPolygonSlugs,
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
	it('Schwelle 2: false fuer ≤2 Polygon-Layer', () => {
		expect(exceedsPolygonLimit([])).toBe(false);
		expect(exceedsPolygonLimit(['laerm-2023'])).toBe(false);
		expect(exceedsPolygonLimit(['laerm-2023', 'wohnlagen-2024'])).toBe(false);
	});

	it('Schwelle 2: true ab 3. Polygon-Layer', () => {
		expect(exceedsPolygonLimit(['laerm-2023', 'wohnlagen-2024', 'klima-pet-2022'])).toBe(true);
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

	it('POLYGON_LAYER_LIMIT konstant 2', () => {
		expect(POLYGON_LAYER_LIMIT).toBe(2);
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

describe('layer-visibility.capPolygonSlugs (Multi-Layer-Limit 2)', () => {
	it('POLYGON_LAYER_LIMIT ist 2: mehr als Fläche + eine Kontur liest niemand', () => {
		expect(POLYGON_LAYER_LIMIT).toBe(2);
	});

	it('lässt Listen innerhalb des Limits unangetastet', () => {
		expect(capPolygonSlugs([])).toEqual([]);
		expect(capPolygonSlugs(['kiez-score-gesamt'])).toEqual(['kiez-score-gesamt']);
		expect(capPolygonSlugs(['kiez-score-gesamt', 'kiez-score-ruhe-luft'])).toEqual([
			'kiez-score-gesamt',
			'kiez-score-ruhe-luft'
		]);
	});

	it('wirft beim dritten Polygon-Layer den ältesten raus, der neueste bleibt', () => {
		expect(
			capPolygonSlugs(['kiez-score-gesamt', 'kiez-score-ruhe-luft', 'kiez-score-mobilitaet'])
		).toEqual(['kiez-score-ruhe-luft', 'kiez-score-mobilitaet']);
	});

	it('zählt Punkt- und Linien-Layer nicht mit und lässt sie stehen', () => {
		expect(
			capPolygonSlugs([
				'laerm-2023',
				'ubahn-stationen',
				'wohnlagen-2024',
				'kitas-2024',
				'kiez-score-versorgung'
			])
		).toEqual(['ubahn-stationen', 'wohnlagen-2024', 'kitas-2024', 'kiez-score-versorgung']);
	});

	it('kappt auch mehrfach überzählige Polygon-Layer (URL-Einstieg)', () => {
		expect(
			capPolygonSlugs(['laerm-2023', 'luft-2023', 'bioklima-2023', 'kiez-score-gesamt'])
		).toEqual(['bioklima-2023', 'kiez-score-gesamt']);
	});
});
