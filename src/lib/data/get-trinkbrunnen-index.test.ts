import { describe, expect, it, beforeEach } from 'vitest';
import {
	featureToTrinkbrunnen,
	findNearestTrinkbrunnen,
	getTrinkbrunnenIndex,
	_resetTrinkbrunnenIndexCache,
	type Trinkbrunnen
} from './get-trinkbrunnen-index.js';
import type { Feature, Point } from 'geojson';

beforeEach(() => _resetTrinkbrunnenIndexCache());

function feat(props: Record<string, unknown>, coords: [number, number], id?: number): Feature<Point, Record<string, unknown>> {
	return { type: 'Feature', id, geometry: { type: 'Point', coordinates: coords }, properties: props };
}

describe('featureToTrinkbrunnen', () => {
	it('mappt Koordinaten (lng,lat → lat,lng) und Navi-Links', () => {
		const b = featureToTrinkbrunnen(feat({ osmId: 1 }, [13.405, 52.52]));
		expect(b.lat).toBe(52.52);
		expect(b.lng).toBe(13.405);
		expect(b.googleMapsUrl).toContain('destination=52.52,13.405');
		expect(b.appleMapsUrl).toContain('daddr=52.52,13.405');
	});

	it('liest fee/bottle/wheelchair und fällt auf Trinkbrunnen zurück', () => {
		const b = featureToTrinkbrunnen(feat({ fee: 'no', bottle: 'yes', wheelchair: 'limited' }, [13.4, 52.5]));
		expect(b.name).toBe('Trinkbrunnen');
		expect(b.kostenlos).toBe(true);
		expect(b.bottle).toBe(true);
		expect(b.wheelchair).toBe('limited');
	});

	it('nutzt name wenn vorhanden', () => {
		expect(featureToTrinkbrunnen(feat({ name: 'Wiener Trinkbrunnen' }, [13.4, 52.5])).name).toBe(
			'Wiener Trinkbrunnen'
		);
	});
});

describe('findNearestTrinkbrunnen', () => {
	const list: Trinkbrunnen[] = [
		featureToTrinkbrunnen(feat({ name: 'Fern' }, [13.5, 52.6])),
		featureToTrinkbrunnen(feat({ name: 'Nah' }, [13.406, 52.521]))
	];

	it('liefert den nächsten mit Distanz', () => {
		const nearest = findNearestTrinkbrunnen({ lat: 52.52, lng: 13.405 }, list);
		expect(nearest?.name).toBe('Nah');
		expect(nearest?.distanceM).toBeGreaterThan(0);
	});

	it('leere Liste → null', () => {
		expect(findNearestTrinkbrunnen({ lat: 52.52, lng: 13.405 }, [])).toBeNull();
	});
});

describe('getTrinkbrunnenIndex', () => {
	it('löst das Manifest auf und lädt die gehashte geojson', async () => {
		const fetchFn = (async (url: string) => {
			if (url === '/layers/MANIFEST.json') {
				return {
					ok: true,
					json: async () => ({ layers: [{ slug: 'trinkbrunnen', filename: 'trinkbrunnen.abc.geojson' }] })
				};
			}
			if (url === '/layers/trinkbrunnen.abc.geojson') {
				return {
					ok: true,
					json: async () => ({
						type: 'FeatureCollection',
						features: [feat({ name: 'BWB Brunnen' }, [13.4, 52.5], 42)]
					})
				};
			}
			return { ok: false, status: 404 };
		}) as unknown as typeof fetch;
		const idx = await getTrinkbrunnenIndex(fetchFn);
		expect(idx).toHaveLength(1);
		expect(idx[0].name).toBe('BWB Brunnen');
	});
});
