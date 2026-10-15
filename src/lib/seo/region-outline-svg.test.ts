import { describe, expect, it } from 'vitest';
import {
	buildRegionOutline,
	simplifyLine,
	simplifyRing,
	type OutlineRegion
} from './region-outline-svg.js';

const squareCoords = (x: number, y: number, size: number): number[][][] => [
	[
		[x, y],
		[x + size, y],
		[x + size, y + size],
		[x, y + size],
		[x, y]
	]
];

const square = (x: number, y: number, size: number): OutlineRegion['geometry'] => ({
	type: 'Polygon',
	coordinates: squareCoords(x, y, size)
});

describe('buildRegionOutline', () => {
	it('liefert null ohne Regionen', () => {
		expect(buildRegionOutline([])).toBeNull();
	});

	it('liefert null bei leerer Geometrie', () => {
		const empty: OutlineRegion = { id: 'a', geometry: { type: 'Polygon', coordinates: [] } };
		expect(buildRegionOutline([empty])).toBeNull();
	});

	it('wandelt ein Polygon in einen geschlossenen Pfad', () => {
		const out = buildRegionOutline([{ id: 'a', geometry: square(13, 52, 0.1) }]);
		expect(out).not.toBeNull();
		expect(out!.paths).toHaveLength(1);
		expect(out!.paths[0].id).toBe('a');
		expect(out!.paths[0].d.startsWith('M')).toBe(true);
		expect(out!.paths[0].d.endsWith('Z')).toBe(true);
	});

	it('korrigiert das Seitenverhältnis mit cos(Breite)', () => {
		const out = buildRegionOutline([{ id: 'a', geometry: square(13, 52, 0.1) }])!;
		// 0,1 Grad Länge entsprechen cos(52,05 Grad) ≈ 0,6155 von 0,1 Grad Breite.
		const ratio = out.width / out.height;
		expect(ratio).toBeGreaterThan(0.6);
		expect(ratio).toBeLessThan(0.63);
	});

	it('setzt die viewBox passend zu Breite und Höhe', () => {
		const out = buildRegionOutline([{ id: 'a', geometry: square(13, 52, 0.1) }])!;
		expect(out.viewBox).toBe(`0 0 ${out.width} ${out.height}`);
		expect(Math.max(out.width, out.height)).toBe(1000);
	});

	it('bildet MultiPolygon als ein Pfad mit mehreren Teilpfaden ab', () => {
		const multi: OutlineRegion = {
			id: 'm',
			geometry: {
				type: 'MultiPolygon',
				coordinates: [squareCoords(13, 52, 0.05), squareCoords(13.1, 52.1, 0.05)]
			}
		};
		const out = buildRegionOutline([multi])!;
		expect(out.paths[0].d.match(/M/g)).toHaveLength(2);
	});

	it('teilt die Projektion zwischen Regionen', () => {
		const out = buildRegionOutline([
			{ id: 'a', geometry: square(13, 52, 0.05) },
			{ id: 'b', geometry: square(13.1, 52.1, 0.05) }
		])!;
		expect(out.paths.map((p) => p.id)).toEqual(['a', 'b']);
		expect(out.paths[0].d).not.toBe(out.paths[1].d);
	});

	it('hält alle Koordinaten innerhalb der viewBox', () => {
		const out = buildRegionOutline([{ id: 'a', geometry: square(13, 52, 0.1) }])!;
		const nums = out.paths[0].d.match(/-?\d+(\.\d+)?/g)!.map(Number);
		for (const n of nums) {
			expect(n).toBeGreaterThanOrEqual(0);
			expect(n).toBeLessThanOrEqual(1000);
		}
	});
});

describe('Vereinfachung', () => {
	it('entfernt kollineare Zwischenpunkte', () => {
		const pts: [number, number][] = Array.from({ length: 50 }, (_, i) => [i * 10, 0]);
		expect(simplifyLine(pts, 1.2)).toEqual([
			[0, 0],
			[490, 0]
		]);
	});

	it('behält Ecken über der Toleranz', () => {
		const out = simplifyLine(
			[
				[0, 0],
				[50, 40],
				[100, 0]
			],
			1.2
		);
		expect(out).toHaveLength(3);
	});

	it('verwirft Ringe mit weniger als 3 Punkten nach der Vereinfachung', () => {
		const sliver: [number, number][] = [
			[0, 0],
			[100, 0.2],
			[200, 0],
			[100, -0.2]
		];
		expect(simplifyRing(sliver, 1.2)).toBeNull();
	});

	it('liefert ganzzahlige Koordinaten ohne Schlusspunkt-Dublette', () => {
		const ring: [number, number][] = [
			[0.4, 0.4],
			[100.6, 0.2],
			[100.4, 100.7],
			[0.2, 100.3]
		];
		const out = simplifyRing(ring, 1.2)!;
		expect(out).toHaveLength(4);
		for (const [x, y] of out) {
			expect(Number.isInteger(x)).toBe(true);
			expect(Number.isInteger(y)).toBe(true);
		}
	});

	it('reduziert die Punktzahl eines dichten Kreises deutlich', () => {
		const n = 2000;
		const coords: number[][] = [];
		for (let i = 0; i < n; i++) {
			const a = (i / n) * 2 * Math.PI;
			coords.push([13.4 + 0.1 * Math.cos(a), 52.5 + 0.06 * Math.sin(a)]);
		}
		coords.push(coords[0]);
		const out = buildRegionOutline([
			{ id: 'c', geometry: { type: 'Polygon', coordinates: [coords] } }
		])!;
		const points = out.paths[0].d.match(/\d+ \d+/g)!.length;
		expect(points).toBeLessThan(200);
		expect(points).toBeGreaterThan(20);
	});
});
