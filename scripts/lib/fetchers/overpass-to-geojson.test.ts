import { describe, expect, it } from 'vitest';
import { overpassToGeoJSON, isOverpassResponse } from './overpass-to-geojson.js';

describe('isOverpassResponse', () => {
	it('true für Overpass-Shape', () => {
		expect(isOverpassResponse({ generator: 'Overpass API', elements: [] })).toBe(true);
		expect(isOverpassResponse({ osm3s: {}, elements: [{ type: 'node' }] })).toBe(true);
	});

	it('false für GeoJSON', () => {
		expect(isOverpassResponse({ type: 'FeatureCollection', features: [] })).toBe(false);
	});

	it('false für null/primitives', () => {
		expect(isOverpassResponse(null)).toBe(false);
		expect(isOverpassResponse('foo')).toBe(false);
	});
});

describe('overpassToGeoJSON', () => {
	it('node → Point-Feature mit Tags als Properties', () => {
		const out = overpassToGeoJSON({
			elements: [{ type: 'node', id: 1, lat: 52.5, lon: 13.4, tags: { name: 'X', amenity: 'drinking_water' } }]
		});
		expect(out.type).toBe('FeatureCollection');
		expect(out.features).toHaveLength(1);
		const feat = out.features[0];
		expect(feat.geometry).toEqual({ type: 'Point', coordinates: [13.4, 52.5] });
		expect(feat.properties).toEqual({
			osmId: 1,
			osmType: 'node',
			name: 'X',
			amenity: 'drinking_water'
		});
		expect(feat.id).toBe(1);
	});

	it('node ohne tags → leere Tag-Properties', () => {
		const out = overpassToGeoJSON({ elements: [{ type: 'node', id: 9, lat: 1, lon: 2 }] });
		expect(out.features[0].properties).toEqual({ osmId: 9, osmType: 'node' });
	});

	it('way mit geometry → LineString', () => {
		const out = overpassToGeoJSON({
			elements: [
				{
					type: 'way',
					id: 7,
					geometry: [
						{ lat: 52.5, lon: 13.4 },
						{ lat: 52.6, lon: 13.5 }
					],
					tags: { highway: 'residential' }
				}
			]
		});
		const feat = out.features[0];
		expect(feat.geometry).toEqual({
			type: 'LineString',
			coordinates: [
				[13.4, 52.5],
				[13.5, 52.6]
			]
		});
	});

	it('way mit geschlossener geometry → Polygon', () => {
		const out = overpassToGeoJSON({
			elements: [
				{
					type: 'way',
					id: 8,
					geometry: [
						{ lat: 0, lon: 0 },
						{ lat: 0, lon: 1 },
						{ lat: 1, lon: 1 },
						{ lat: 0, lon: 0 }
					],
					tags: { building: 'yes' }
				}
			]
		});
		const feat = out.features[0];
		expect(feat.geometry.type).toBe('Polygon');
	});

	it('way mit area=yes wird Polygon auch ohne building-tag', () => {
		const out = overpassToGeoJSON({
			elements: [
				{
					type: 'way',
					id: 81,
					geometry: [
						{ lat: 0, lon: 0 },
						{ lat: 0, lon: 1 },
						{ lat: 1, lon: 1 },
						{ lat: 0, lon: 0 }
					],
					tags: { area: 'yes' }
				}
			]
		});
		expect(out.features[0].geometry.type).toBe('Polygon');
	});

	it('geschlossene way ohne polygon-implying-tag bleibt LineString (z.B. Schienen-Ring)', () => {
		const out = overpassToGeoJSON({
			elements: [
				{
					type: 'way',
					id: 82,
					geometry: [
						{ lat: 0, lon: 0 },
						{ lat: 0, lon: 1 },
						{ lat: 1, lon: 1 },
						{ lat: 0, lon: 0 }
					],
					tags: { railway: 'rail', usage: 'main' }
				}
			]
		});
		expect(out.features[0].geometry.type).toBe('LineString');
	});

	it('way ohne geometry → übersprungen', () => {
		const out = overpassToGeoJSON({ elements: [{ type: 'way', id: 10 }] });
		expect(out.features).toHaveLength(0);
	});

	it('way ohne geometry aber mit center → Point (out center für Flächen-POIs)', () => {
		const out = overpassToGeoJSON({
			elements: [
				{ type: 'way', id: 12, center: { lat: 52.5, lon: 13.4 }, tags: { shop: 'supermarket' } }
			]
		});
		expect(out.features).toHaveLength(1);
		const feat = out.features[0];
		expect(feat.geometry).toEqual({ type: 'Point', coordinates: [13.4, 52.5] });
		expect(feat.properties).toEqual({ osmId: 12, osmType: 'way', shop: 'supermarket' });
	});

	it('Relation mit center → Point', () => {
		const out = overpassToGeoJSON({
			elements: [
				{ type: 'relation', id: 13, center: { lat: 52.6, lon: 13.5 }, tags: { amenity: 'pharmacy' } }
			]
		});
		expect(out.features).toHaveLength(1);
		expect(out.features[0].geometry).toEqual({ type: 'Point', coordinates: [13.5, 52.6] });
		expect(out.features[0].properties).toEqual({ osmId: 13, osmType: 'relation', amenity: 'pharmacy' });
	});

	it('Relation ohne center wird ignoriert', () => {
		const out = overpassToGeoJSON({
			elements: [{ type: 'relation', id: 11, members: [] }]
		});
		expect(out.features).toHaveLength(0);
	});

	it('leere elements → leere FC', () => {
		const out = overpassToGeoJSON({ elements: [] });
		expect(out).toEqual({ type: 'FeatureCollection', features: [] });
	});

	it('invalides Input → leere FC', () => {
		expect(overpassToGeoJSON(null).features).toHaveLength(0);
		expect(overpassToGeoJSON({}).features).toHaveLength(0);
	});
});
