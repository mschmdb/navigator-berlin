import { describe, expect, it } from 'vitest';
import { utm33ToWgs84, wgs84ToUtm33, reprojectGeoJSON } from './reproject.js';
import { BERLIN_SPOTCHECK, SPOTCHECK_TOLERANCE_DEG } from './spotcheck.js';
import type { FeatureCollection } from 'geojson';

describe('reproject EPSG:25833 <-> EPSG:4326', () => {
	it.each(BERLIN_SPOTCHECK)('$name: UTM33 -> WGS84 within tolerance', ({ name, wgs84, utm33 }) => {
		const [lon, lat] = utm33ToWgs84(utm33[0], utm33[1]);
		expect(Math.abs(lon - wgs84[0])).toBeLessThan(0.005);
		expect(Math.abs(lat - wgs84[1])).toBeLessThan(0.005);
		void name;
	});

	it('round-trip WGS84 -> UTM33 -> WGS84 (Brandenburger Tor)', () => {
		const [x, y] = wgs84ToUtm33(13.37771, 52.51629);
		const [lon, lat] = utm33ToWgs84(x, y);
		expect(Math.abs(lon - 13.37771)).toBeLessThan(SPOTCHECK_TOLERANCE_DEG);
		expect(Math.abs(lat - 52.51629)).toBeLessThan(SPOTCHECK_TOLERANCE_DEG);
	});

	it('reprojectGeoJSON konvertiert Point-Geometrie (Brandenburger Tor)', () => {
		const fc: FeatureCollection = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [389918, 5819701] },
					properties: {}
				}
			]
		};
		const out = reprojectGeoJSON(fc, 'EPSG:25833', 'EPSG:4326');
		const coords = (out.features[0].geometry as { coordinates: [number, number] }).coordinates;
		expect(Math.abs(coords[0] - 13.37771)).toBeLessThan(0.001);
		expect(Math.abs(coords[1] - 52.51629)).toBeLessThan(0.001);
	});

	it('reprojectGeoJSON ist no-op wenn from==to', () => {
		const fc: FeatureCollection = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [13.37771, 52.51629] },
					properties: {}
				}
			]
		};
		const out = reprojectGeoJSON(fc, 'EPSG:4326', 'EPSG:4326');
		expect(out).toEqual(fc);
	});

	it('reprojectGeoJSON unterstuetzt MultiPolygon', () => {
		const fc: FeatureCollection = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'MultiPolygon',
						coordinates: [
							[
								[
									[389918, 5819701],
									[390018, 5819701],
									[390018, 5819801],
									[389918, 5819701]
								]
							]
						]
					},
					properties: {}
				}
			]
		};
		const out = reprojectGeoJSON(fc, 'EPSG:25833', 'EPSG:4326');
		const ring = (out.features[0].geometry as { coordinates: number[][][][] }).coordinates[0][0];
		expect(ring[0][0]).toBeGreaterThan(13);
		expect(ring[0][0]).toBeLessThan(14);
		expect(ring[0][1]).toBeGreaterThan(52);
		expect(ring[0][1]).toBeLessThan(53);
	});
});
