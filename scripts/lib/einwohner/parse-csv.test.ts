import { describe, expect, it } from 'vitest';
import { parseEinwohnerCsv } from './parse-csv.js';

const HEADER =
	'ZEIT;RAUMID;BEZ;E_E;E_E06_07;E_E07_08;E_E08_10;E_E10_12;E_EU1;E_E1U6;E_E65U80;E_E80U110';

describe('parseEinwohnerCsv', () => {
	it('parst Semikolon-CSV mit BOM + CRLF in EinwohnerRow', () => {
		const raw = `﻿${HEADER}\r\n202412;01100101;01;3580;18;22;55;52;37;128;455;262\r\n`;
		const rows = parseEinwohnerCsv(raw);
		expect(rows).toHaveLength(1);
		expect(rows[0].lorId).toBe('01100101');
		expect(rows[0].gesamt).toBe(3580);
		expect(rows[0].ages.E_EU1).toBe(37);
		expect(rows[0].ages.E_E65U80).toBe(455);
	});

	it('ist case-insensitiv gegenüber Header-Namen', () => {
		const raw = `zeit;raumid;e_e;e_eu1\r\n202412;01100101;3580;37\r\n`;
		const rows = parseEinwohnerCsv(raw);
		expect(rows[0].lorId).toBe('01100101');
		expect(rows[0].gesamt).toBe(3580);
		expect(rows[0].ages.E_EU1).toBe(37);
	});

	it('überspringt Zeilen ohne gültige 8-stellige RAUMID', () => {
		const raw = `${HEADER}\r\n202412;;01;100;0;0;0;0;0;0;0;0\r\n202412;01100101;01;3580;18;22;55;52;37;128;455;262\r\n`;
		const rows = parseEinwohnerCsv(raw);
		expect(rows).toHaveLength(1);
		expect(rows[0].lorId).toBe('01100101');
	});

	it('leere Alters-Zelle wird 0, kein NaN', () => {
		const raw = `${HEADER}\r\n202412;01100101;01;3580;;;;;37;128;455;262\r\n`;
		const rows = parseEinwohnerCsv(raw);
		expect(rows[0].ages.E_E06_07).toBe(0);
		expect(rows[0].gesamt).toBe(3580);
	});

	it('ignoriert Leerzeilen am Ende', () => {
		const raw = `${HEADER}\r\n202412;01100101;01;3580;18;22;55;52;37;128;455;262\r\n\r\n`;
		expect(parseEinwohnerCsv(raw)).toHaveLength(1);
	});
});
