import { describe, expect, it } from 'vitest';
import { parseMieteCsv } from './parse-miete-csv.js';

const HEADER =
	'GITTER_ID_100m;x_mp_100m;y_mp_100m;durchschnMieteQM;AnzahlWohnungen;werterlaeuternde_Zeichen';

/** Kodiert als Windows-1252, wie die Destatis-Datei. */
function csv(...rows: string[]): Buffer {
	return Buffer.from([HEADER, ...rows].join('\r\n') + '\r\n', 'latin1');
}

describe('parseMieteCsv', () => {
	it('liest Dezimalkomma und Pflichtspalten', () => {
		const cells = parseMieteCsv(csv('CRS3035RES100mN2691700E4341100;4341150;2691750;6,26;3;'));
		expect(cells).toEqual([
			{ x: 4341150, y: 2691750, mieteQm: 6.26, wohnungen: 3, klammern: false }
		]);
	});

	it('markiert KLAMMERN-Zellen', () => {
		const cells = parseMieteCsv(csv('id;4343950;2694850;4,45;3;KLAMMERN'));
		expect(cells[0].klammern).toBe(true);
		expect(cells[0].mieteQm).toBe(4.45);
	});

	it('dekodiert Windows-1252 ohne Fehler', () => {
		const raw = Buffer.from(`${HEADER}\r\nid;1;2;7,5;10;ä\r\n`, 'latin1');
		expect(parseMieteCsv(raw)).toHaveLength(1);
	});

	it('filtert per bbox auf Zellmittelpunkte', () => {
		const cells = parseMieteCsv(csv('a;100;100;5,0;10;', 'b;900;900;6,0;10;'), {
			minX: 0,
			maxX: 500,
			minY: 0,
			maxY: 500
		});
		expect(cells.map((c) => c.x)).toEqual([100]);
	});

	it('bricht mit Spaltenname ab, wenn AnzahlWohnungen fehlt', () => {
		const raw = Buffer.from(
			'GITTER_ID_100m;x_mp_100m;y_mp_100m;durchschnMieteQM\r\nid;1;2;3,0\r\n',
			'latin1'
		);
		expect(() => parseMieteCsv(raw)).toThrow(/AnzahlWohnungen/);
	});

	it('bricht bei nicht parsebarer Miete laut ab', () => {
		expect(() => parseMieteCsv(csv('id;1;2;abc;10;'))).toThrow(/durchschnMieteQM/);
	});

	it('bricht bei nicht parsebarer Wohnungszahl laut ab', () => {
		expect(() => parseMieteCsv(csv('id;1;2;5,0;x;'))).toThrow(/AnzahlWohnungen/);
	});

	it('bricht bei nicht parsebaren Koordinaten laut ab', () => {
		expect(() => parseMieteCsv(csv('id;x;2;5,0;10;'))).toThrow(/x_mp_100m/);
	});

	it('ignoriert Leerzeilen am Dateiende', () => {
		expect(parseMieteCsv(csv('id;1;2;5,0;10;', '', ''))).toHaveLength(1);
	});
});
