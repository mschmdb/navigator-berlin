import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { computeGeoJsonBbox } from './berlin-bbox.js';
import { BEZIRKE_BBOX } from './berlin-bbox.generated.js';
import type { Manifest } from './types.js';

describe('computeGeoJsonBbox', () => {
	it('berechnet die Bounding Box ueber Polygone und MultiPolygone', () => {
		const bbox = computeGeoJsonBbox({
			features: [
				{
					geometry: {
						coordinates: [
							[
								[13.1, 52.4],
								[13.3, 52.4],
								[13.3, 52.6],
								[13.1, 52.4]
							]
						]
					}
				},
				{
					geometry: {
						coordinates: [
							[
								[
									[13.0, 52.3],
									[13.7, 52.7],
									[13.5, 52.5],
									[13.0, 52.3]
								]
							]
						]
					}
				}
			]
		});
		expect(bbox).toEqual([13.0, 52.3, 13.7, 52.7]);
	});

	it('liefert null ohne Koordinaten', () => {
		expect(computeGeoJsonBbox({ features: [] })).toBeNull();
		expect(computeGeoJsonBbox({ features: [{ geometry: null }] })).toBeNull();
	});

	it('behandelt einen Punkt', () => {
		const bbox = computeGeoJsonBbox({ features: [{ geometry: { coordinates: [13.4, 52.5] } }] });
		expect(bbox).toEqual([13.4, 52.5, 13.4, 52.5]);
	});
});

describe('BEZIRKE_BBOX (Drift)', () => {
	it('entspricht der Bounding Box des aktuellen bezirke-Layers', () => {
		const layersDir = resolve(process.cwd(), 'static/layers');
		const manifest = JSON.parse(
			readFileSync(resolve(layersDir, 'MANIFEST.json'), 'utf-8')
		) as Manifest;
		const bezirke = manifest.layers.find((l) => l.slug === 'bezirke');
		expect(bezirke).toBeDefined();
		const fc = JSON.parse(readFileSync(resolve(layersDir, bezirke!.filename), 'utf-8'));
		expect([...BEZIRKE_BBOX], 'Konstante veraltet: `pnpm data:berlin-bbox` ausführen').toEqual(
			computeGeoJsonBbox(fc)
		);
	});
});
