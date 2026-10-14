import { describe, expect, it } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import { buildMieteLayer } from './build-layer.js';
import { addCell, createAccumulator } from './weighted-mean.js';

const ring: Polygon = {
	type: 'Polygon',
	coordinates: [
		[
			[0, 0],
			[1, 0],
			[1, 1],
			[0, 0]
		]
	]
};

function plr(id: string): Feature<Polygon> {
	return { type: 'Feature', properties: { PLR_ID: id, PLR_NAME: 'x' }, geometry: ring };
}

describe('buildMieteLayer', () => {
	const kiezSlugs = new Map([['011001', 'tiergarten']]);
	const bezirkSlugs = new Map([['01', 'mitte']]);

	it('schreibt Wert, Wohnungszahl, Summe und Slugs', () => {
		const big = createAccumulator();
		addCell(big, 10, 90);
		addCell(big, 20, 10);
		const fc = buildMieteLayer(
			[plr('01100101')],
			new Map([['01100101', big]]),
			kiezSlugs,
			bezirkSlugs
		);
		expect(fc.features[0].properties).toEqual({
			plr_id: '01100101',
			miete: 11,
			wohnungen: 100,
			miete_summe: 1100,
			kiez_slug: 'tiergarten',
			bezirk_slug: 'mitte'
		});
	});

	it('setzt miete null unter 30 Wohnungen, behaelt aber Summe und Wohnungen', () => {
		const small = createAccumulator();
		addCell(small, 12, 29);
		const fc = buildMieteLayer(
			[plr('01100101')],
			new Map([['01100101', small]]),
			kiezSlugs,
			bezirkSlugs
		);
		expect(fc.features[0].properties).toMatchObject({
			miete: null,
			wohnungen: 29,
			miete_summe: 348
		});
	});

	it('Planungsraum ohne Zellen: miete null, 0 Wohnungen', () => {
		const fc = buildMieteLayer([plr('01100101')], new Map(), kiezSlugs, bezirkSlugs);
		expect(fc.features[0].properties).toMatchObject({ miete: null, wohnungen: 0, miete_summe: 0 });
	});

	it('bricht ab, wenn der Kiez-Slug fehlt', () => {
		expect(() => buildMieteLayer([plr('99999901')], new Map(), kiezSlugs, bezirkSlugs)).toThrow(
			/99999901/
		);
	});
});
