import { describe, expect, it } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import { accumulateByPlr } from './assign-cells.js';
import { weightedMean } from './weighted-mean.js';

function square(plrId: string, x0: number, y0: number, size = 1): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: { PLR_ID: plrId },
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[x0, y0],
					[x0 + size, y0],
					[x0 + size, y0 + size],
					[x0, y0 + size],
					[x0, y0]
				]
			]
		}
	};
}

const identity = (x: number, y: number): [number, number] => [x, y];

describe('accumulateByPlr', () => {
	const plr = [square('01000001', 0, 0), square('01000002', 2, 0)];

	it('ordnet Zellen dem Planungsraum zu und gewichtet', () => {
		const cells = [
			{ x: 0.5, y: 0.5, mieteQm: 10, wohnungen: 90, klammern: false },
			{ x: 0.6, y: 0.6, mieteQm: 20, wohnungen: 10, klammern: true },
			{ x: 2.5, y: 0.5, mieteQm: 6, wohnungen: 40, klammern: false }
		];
		const { byPlr } = accumulateByPlr(cells, plr, identity);
		expect(weightedMean(byPlr.get('01000001')!)).toBe(11);
		expect(weightedMean(byPlr.get('01000002')!)).toBe(6);
	});

	it('ignoriert Zellen ausserhalb aller Planungsraeume', () => {
		const cells = [{ x: 9, y: 9, mieteQm: 10, wohnungen: 50, klammern: false }];
		const { byPlr, outside } = accumulateByPlr(cells, plr, identity);
		expect(byPlr.get('01000001')!.wohnungen).toBe(0);
		expect(outside).toBe(1);
	});

	it('legt fuer jeden Planungsraum einen Eintrag an, auch ohne Zellen', () => {
		const { byPlr } = accumulateByPlr([], plr, identity);
		expect([...byPlr.keys()]).toEqual(['01000001', '01000002']);
	});
});
