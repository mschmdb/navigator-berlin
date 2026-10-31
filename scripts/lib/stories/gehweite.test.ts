import { describe, expect, it } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import {
	STOP_RADIUS_M,
	buildStopGrid,
	createPlrLocator,
	hasStopWithin,
	accumulateGehweite
} from './gehweite.js';
import { parseBevoelkerungCsv } from './parse-bevoelkerung-csv.js';

describe('hasStopWithin', () => {
	const grid = buildStopGrid([{ x: 1000, y: 1000 }]);

	it('zaehlt genau 400 m', () => {
		expect(hasStopWithin(grid, 1000 + STOP_RADIUS_M, 1000)).toBe(true);
	});
	it('zaehlt 400,01 m nicht', () => {
		expect(hasStopWithin(grid, 1000 + STOP_RADIUS_M + 0.01, 1000)).toBe(false);
	});
	it('nutzt Luftlinie diagonal', () => {
		expect(hasStopWithin(grid, 1000 + 280, 1000 + 280)).toBe(true);
		expect(hasStopWithin(grid, 1000 + 290, 1000 + 290)).toBe(false);
	});
	it('findet Haltestellen ueber Rasterzellgrenzen hinweg', () => {
		const g = buildStopGrid([{ x: 799, y: 0 }]);
		expect(hasStopWithin(g, 1100, 0)).toBe(true);
	});
	it('liefert false ohne Haltestellen', () => {
		expect(hasStopWithin(buildStopGrid([]), 0, 0)).toBe(false);
	});
	it('funktioniert mit negativen Koordinaten', () => {
		const g = buildStopGrid([{ x: -10, y: -10 }]);
		expect(hasStopWithin(g, 10, 10)).toBe(true);
	});
});

const square: Polygon = {
	type: 'Polygon',
	coordinates: [
		[
			[0, 0],
			[10, 0],
			[10, 10],
			[0, 10],
			[0, 0]
		]
	]
};
const plr: Feature<Polygon> = { type: 'Feature', properties: { PLR_ID: 'P1' }, geometry: square };
const identity = (x: number, y: number): [number, number] => [x, y];

describe('createPlrLocator', () => {
	const locate = createPlrLocator([plr], identity);
	it('findet den Planungsraum', () => {
		expect(locate(5, 5)).toBe('P1');
	});
	it('zaehlt Punkte auf der Grenze zum Planungsraum', () => {
		expect(locate(10, 5)).toBe('P1');
	});
	it('liefert null ausserhalb', () => {
		expect(locate(11, 5)).toBeNull();
	});
	it('wirft ohne PLR_ID', () => {
		expect(() => createPlrLocator([{ ...plr, properties: {} }], identity)).toThrow(/PLR_ID/);
	});
});

describe('accumulateGehweite', () => {
	it('summiert Einwohner und Einwohner mit Haltestelle', () => {
		const grid = buildStopGrid([{ x: 5, y: 5 }]);
		const { byPlr, outside, outsideEinwohner } = accumulateGehweite(
			[
				{ x: 5, y: 5, einwohner: 10 },
				{ x: 9, y: 9, einwohner: 5 },
				{ x: 50, y: 50, einwohner: 7 }
			],
			[plr],
			identity,
			grid
		);
		expect(byPlr.get('P1')).toEqual({ einwohner: 15, mitHaltestelle: 15 });
		expect(outside).toBe(1);
		expect(outsideEinwohner).toBe(7);
	});

	it('trennt Zellen ausserhalb der Reichweite', () => {
		const grid = buildStopGrid([{ x: 5000, y: 5000 }]);
		const { byPlr } = accumulateGehweite([{ x: 5, y: 5, einwohner: 10 }], [plr], identity, grid);
		expect(byPlr.get('P1')).toEqual({ einwohner: 10, mitHaltestelle: 0 });
	});
});

describe('parseBevoelkerungCsv', () => {
	const enc = (s: string) => new TextEncoder().encode(s);
	const header = 'GITTER_ID_100m;x_mp_100m;y_mp_100m;Einwohner\n';

	it('parst Zellen im Zuschnitt', () => {
		const cells = parseBevoelkerungCsv(
			enc(`${header}CRS3035RES100mN3270000E4549800;4549850;3270050;12\n`),
			{ minX: 4529800, maxX: 4577300, minY: 3252000, maxY: 3291800 }
		);
		expect(cells).toEqual([{ x: 4549850, y: 3270050, einwohner: 12 }]);
	});
	it('verwirft Zellen ausserhalb des Zuschnitts', () => {
		const cells = parseBevoelkerungCsv(
			enc(`${header}CRS3035RES100mN2689100E4337000;4337050;2689150;4\n`),
			{ minX: 4529800, maxX: 4577300, minY: 3252000, maxY: 3291800 }
		);
		expect(cells).toEqual([]);
	});
	it('liest Strich als 0 und wirft bei Muell', () => {
		const ok = parseBevoelkerungCsv(enc(`${header}CRS3035RES100mN3270000E4549800;1;2;–\n`));
		expect(ok[0].einwohner).toBe(0);
		expect(() =>
			parseBevoelkerungCsv(enc(`${header}CRS3035RES100mN3270000E4549800;1;2;abc\n`))
		).toThrow(/Einwohner/);
	});
	it('wirft bei fehlender Spalte', () => {
		expect(() => parseBevoelkerungCsv(enc('a;b\n1;2\n'))).toThrow(/Spalte/);
	});
});
