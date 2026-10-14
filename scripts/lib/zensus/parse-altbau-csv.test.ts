import { describe, expect, it } from 'vitest';
import { parseAltbauCsv } from './parse-altbau-csv.js';

const HEADER =
	'GITTER_ID_100m;Insgesamt_Wohnungen;vor_1919;a1919_bis_1948;a1949_bis_1978;a1979_bis_1990;a1991_bis_2000;a2001_bis_2013;a2014_bis_2019;a2020_und_spaeter';

function csv(...rows: string[]): Buffer {
	return Buffer.from([HEADER, ...rows].join('\r\n') + '\r\n', 'utf-8');
}

describe('parseAltbauCsv', () => {
	it('liest Mittelpunkt, Wohnungen und Altbau (vor 1949)', () => {
		const cells = parseAltbauCsv(csv('CRS3035RES100mN3270000E4549800;80;60;10;10;–;–;–;–;–'));
		expect(cells).toEqual([{ x: 4549850, y: 3270050, wohnungen: 80, altbau: 70 }]);
	});

	it('behandelt Strich als 0', () => {
		const cells = parseAltbauCsv(csv('CRS3035RES100mN3270000E4549800;20;–;–;20;–;–;–;–;–'));
		expect(cells[0]).toMatchObject({ wohnungen: 20, altbau: 0 });
	});

	it('verwirft Zellen ausserhalb der BBox', () => {
		const bbox = { minX: 0, maxX: 10, minY: 0, maxY: 10 };
		expect(
			parseAltbauCsv(csv('CRS3035RES100mN3270000E4549800;80;60;10;10;–;–;–;–;–'), bbox)
		).toEqual([]);
	});

	it('kappt Altbau auf die Zellsumme und zaehlt die Zelle', () => {
		const stats = { clamped: 0, dropped: 0 };
		const cells = parseAltbauCsv(
			csv('CRS3035RES100mN3270000E4549800;10;8;5;–;–;–;–;–;–'),
			undefined,
			stats
		);
		expect(cells[0]).toMatchObject({ wohnungen: 10, altbau: 10 });
		expect(stats).toEqual({ clamped: 1, dropped: 0 });
	});

	it('verwirft Zellen mit 0 Wohnungen, aber Altbau, und zaehlt sie', () => {
		const stats = { clamped: 0, dropped: 0 };
		const cells = parseAltbauCsv(
			csv('CRS3035RES100mN3270000E4549800;–;3;–;–;–;–;–;–;–'),
			undefined,
			stats
		);
		expect(cells).toEqual([]);
		expect(stats).toEqual({ clamped: 0, dropped: 1 });
	});

	it('bricht ab, wenn eine Pflichtspalte fehlt, und nennt sie', () => {
		const raw = Buffer.from(
			'GITTER_ID_100m;Insgesamt_Wohnungen;vor_1919\r\nCRS3035RES100mN3270000E4549800;1;1\r\n'
		);
		expect(() => parseAltbauCsv(raw)).toThrow(/a1919_bis_1948/);
	});

	it('bricht bei nicht lesbarer Zahl ab', () => {
		expect(() => parseAltbauCsv(csv('CRS3035RES100mN3270000E4549800;x;1;1;–;–;–;–;–;–'))).toThrow(
			/Insgesamt_Wohnungen/
		);
	});

	it('bricht bei ungueltiger Gitter-ID ab', () => {
		expect(() => parseAltbauCsv(csv('kaputt;1;1;0;–;–;–;–;–;–'))).toThrow(/kaputt/);
	});
});
