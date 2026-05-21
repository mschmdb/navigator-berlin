import { describe, expect, it } from 'vitest';
import type { Feature } from 'geojson';
import { buildLorBboxIndex, findLorForPoint, LaermDbAggregator } from './aggregate-db.js';

function lor(id: string, ring: [number, number][]): Feature {
	return {
		type: 'Feature',
		geometry: { type: 'Polygon', coordinates: [ring] },
		properties: { PLR_ID: id }
	};
}
const square: [number, number][] = [
	[0, 0],
	[0, 10],
	[10, 10],
	[10, 0],
	[0, 0]
];
const far: [number, number][] = [
	[100, 100],
	[100, 110],
	[110, 110],
	[110, 100],
	[100, 100]
];
const idFn = (f: Feature) => String(f.properties?.PLR_ID);

describe('findLorForPoint', () => {
	const index = buildLorBboxIndex([lor('A', square), lor('B', far)], idFn);
	it('Punkt im Polygon → plrId', () => {
		expect(findLorForPoint(5, 5, index)).toBe('A');
		expect(findLorForPoint(105, 105, index)).toBe('B');
	});
	it('Punkt außerhalb aller → null', () => {
		expect(findLorForPoint(50, 50, index)).toBeNull();
	});
	it('bbox-Prefilter schließt ferne Polygone aus (kein Fehlmatch)', () => {
		expect(findLorForPoint(9.9, 9.9, index)).toBe('A');
	});
});

describe('LaermDbAggregator', () => {
	const index = buildLorBboxIndex([lor('A', square)], idFn);
	it('mittelt ges_den pro LOR', () => {
		const agg = new LaermDbAggregator(index);
		agg.add(2, 2, 50);
		agg.add(8, 8, 60);
		agg.add(105, 105, 99); // außerhalb → ignoriert
		agg.add(4, 4, null); // null → ignoriert
		const out = agg.result();
		expect(out.A.dbDenMean).toBe(55);
		expect(out.A.count).toBe(2);
	});
	it('LOR ohne Punkt fehlt im Ergebnis (No-Data)', () => {
		const agg = new LaermDbAggregator(index);
		const out = agg.result();
		expect(out.A).toBeUndefined();
	});
});
