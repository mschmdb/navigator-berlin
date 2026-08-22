import { describe, expect, it } from 'vitest';
import {
	applyHiddenSlugs,
	capPolygonSlugs,
	exceedsPolygonLimit,
	hasPinnedChoropleth,
	orderChoropleths,
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

describe('Choroplethen-Limit zählt Overlays nicht mit', () => {
	it('Milieuschutz und Kaltluft verbrauchen keine Choroplethen-Slots', () => {
		expect(polygonSlugCount(['milieuschutz-erhaltungsmiete', 'milieuschutz-staedtebau'])).toBe(0);
		expect(
			exceedsPolygonLimit([
				'milieuschutz-erhaltungsmiete',
				'milieuschutz-staedtebau',
				'kiez-score-wohnschutz',
				'laerm-2023'
			])
		).toBe(false);
	});

	it('capPolygonSlugs lässt Overlays stehen und kappt nur Choroplethen', () => {
		expect(
			capPolygonSlugs([
				'laerm-2023',
				'milieuschutz-erhaltungsmiete',
				'kiez-score-wohnschutz',
				'kiez-score-gesamt'
			])
		).toEqual(['milieuschutz-erhaltungsmiete', 'kiez-score-wohnschutz', 'kiez-score-gesamt']);
	});
});

describe('orderChoropleths (Legenden-Tausch Fläche ↔ Symbole)', () => {
	it('zieht den Lead-Choroplethen auf den Fläche-Slot, Rest bleibt stabil', () => {
		expect(
			orderChoropleths(
				['laerm-2023', 'ubahn-stationen', 'kiez-score-ruhe-luft'],
				'kiez-score-ruhe-luft'
			)
		).toEqual(['kiez-score-ruhe-luft', 'ubahn-stationen', 'laerm-2023']);
	});

	it('ohne Lead bleibt die Reihenfolge unverändert', () => {
		const slugs = ['laerm-2023', 'kiez-score-ruhe-luft'];
		expect(orderChoropleths(slugs, null)).toEqual(slugs);
		expect(orderChoropleths(slugs, 'nicht-aktiv')).toEqual(slugs);
		expect(orderChoropleths(slugs, 'ubahn-stationen')).toEqual(slugs);
	});

	it('PMTiles-Choropleth (PET) gewinnt die Fläche immer, auch gegen den Lead', () => {
		expect(
			orderChoropleths(['klima-pet-2022', 'kiez-score-gruen-hitze'], 'kiez-score-gruen-hitze')
		).toEqual(['klima-pet-2022', 'kiez-score-gruen-hitze']);
		// PET nachträglich aktiviert: rückt trotzdem auf den Fläche-Slot
		expect(orderChoropleths(['kiez-score-gruen-hitze', 'klima-pet-2022'], null)).toEqual([
			'klima-pet-2022',
			'kiez-score-gruen-hitze'
		]);
	});

	it('Overlays und Punkt-Layer behalten ihre Positionen', () => {
		expect(
			orderChoropleths(
				['milieuschutz-erhaltungsmiete', 'laerm-2023', 'trinkbrunnen', 'kiez-score-wohnschutz'],
				'kiez-score-wohnschutz'
			)
		).toEqual([
			'milieuschutz-erhaltungsmiete',
			'kiez-score-wohnschutz',
			'trinkbrunnen',
			'laerm-2023'
		]);
	});
});

describe('hasPinnedChoropleth', () => {
	it('erkennt PET als fest gepinnte Fläche', () => {
		expect(hasPinnedChoropleth(['klima-pet-2022', 'laerm-2023'])).toBe(true);
		expect(hasPinnedChoropleth(['laerm-2023', 'kiez-score-gesamt'])).toBe(false);
	});
});
