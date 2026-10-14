import { describe, expect, it } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import { accumulateByPlr } from './assign-cells.js';
import { addAltbauCell, altbauAnteil, buildAltbauLayer } from './altbau.js';
import { createAccumulator, mergeAccumulators } from './weighted-mean.js';

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
	return { type: 'Feature', properties: { PLR_ID: id }, geometry: ring };
}

describe('Altbau-Anteil', () => {
	it('Zelle A 80 Whg (70 Altbau) und Zelle B 20 Whg (0 Altbau) ergeben 70 %', () => {
		const acc = createAccumulator();
		addAltbauCell(acc, 80, 70);
		addAltbauCell(acc, 20, 0);
		expect(altbauAnteil(acc)).toBe(70);
	});

	it('29 Wohnungen: keine Angabe, Summen bleiben fuer Kiez und Bezirk', () => {
		const acc = createAccumulator();
		addAltbauCell(acc, 29, 29);
		expect(altbauAnteil(acc)).toBeNull();
		const merged = mergeAccumulators([acc, acc]);
		expect(altbauAnteil(merged)).toBe(100);
	});

	it('30 Wohnungen reichen', () => {
		const acc = createAccumulator();
		addAltbauCell(acc, 30, 15);
		expect(altbauAnteil(acc)).toBe(50);
	});

	it('Zellen ohne Wohnungen zaehlen nicht', () => {
		const acc = createAccumulator();
		addAltbauCell(acc, 0, 0);
		expect(acc.wohnungen).toBe(0);
		expect(altbauAnteil(acc)).toBeNull();
	});

	it('accumulateByPlr summiert Altbau-Zellen ueber den add-Callback', () => {
		const cells = [
			{ x: 0.5, y: 0.2, wohnungen: 80, altbau: 70 },
			{ x: 0.6, y: 0.2, wohnungen: 20, altbau: 0 }
		];
		const { byPlr } = accumulateByPlr(
			cells,
			[plr('01100101')],
			(x, y) => [x, y],
			(acc, c) => addAltbauCell(acc, c.wohnungen, c.altbau)
		);
		expect(altbauAnteil(byPlr.get('01100101')!)).toBe(70);
	});

	it('buildAltbauLayer schreibt Anteil, Wohnungen, Summe und Slugs', () => {
		const acc = createAccumulator();
		addAltbauCell(acc, 80, 70);
		addAltbauCell(acc, 20, 0);
		const fc = buildAltbauLayer(
			[plr('01100101')],
			new Map([['01100101', acc]]),
			new Map([['011001', 'tiergarten']]),
			new Map([['01', 'mitte']])
		);
		expect(fc.features[0].properties).toEqual({
			plr_id: '01100101',
			altbau_anteil: 70,
			wohnungen: 100,
			altbau_summe: 7000,
			kiez_slug: 'tiergarten',
			bezirk_slug: 'mitte'
		});
	});

	it('buildAltbauLayer bricht ab, wenn der Kiez-Slug fehlt', () => {
		expect(() => buildAltbauLayer([plr('99999901')], new Map(), new Map(), new Map())).toThrow(
			/99999901/
		);
	});
});
