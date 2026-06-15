import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseBwlWbzCsv, filterByLand, BERLIN_LAND_CODE } from './bwl-csv-parser.js';
import { buildUwbId, isBriefwahlRow, transformBwlRow } from './row-transformer.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, '..', '..', '..', 'tests', 'fixtures', 'wahlen', 'btw25-sample.csv');

async function loadBerlin() {
	const csv = await readFile(fixturePath, 'utf-8');
	const parsed = parseBwlWbzCsv(csv);
	const berlin = filterByLand(parsed.rows, BERLIN_LAND_CODE);
	return { headers: parsed.headers, rows: berlin };
}

describe('row-transformer', () => {
	describe('buildUwbId', () => {
		it('füllt Wahlkreis + Kreis-Code auf', () => {
			expect(buildUwbId('74', '1', '104', '0')).toBe('074-01-104-0');
		});

		it('lässt 3-stellig unverändert', () => {
			expect(buildUwbId('085', '12', '999', '0')).toBe('085-12-999-0');
		});

		it('unterscheidet Brief vs Urne via Bezirksart-Suffix', () => {
			const urne = buildUwbId('077', '04', '119', '0');
			const brief = buildUwbId('077', '04', '119', '1C');
			expect(urne).not.toBe(brief);
		});

		it('Wahlkreis 077 in Charlottenburg vs Spandau (gleiche Bezirksart=0)', () => {
			expect(buildUwbId('077', '04', '119', '0')).toBe('077-04-119-0');
			expect(buildUwbId('077', '05', '119', '0')).toBe('077-05-119-0');
		});
	});

	describe('isBriefwahlRow', () => {
		it('detected Urnenwahl (Bezirksart=0) als false', () => {
			expect(isBriefwahlRow({ Bezirksart: '0' })).toBe(false);
		});

		it('detected Briefwahl-Marker (1C, 1D etc.) als true', () => {
			expect(isBriefwahlRow({ Bezirksart: '1C' })).toBe(true);
			expect(isBriefwahlRow({ Bezirksart: '1D' })).toBe(true);
			expect(isBriefwahlRow({ Bezirksart: 'B' })).toBe(true);
		});

		it('leere Bezirksart als Urne behandelt', () => {
			expect(isBriefwahlRow({ Bezirksart: '' })).toBe(false);
			expect(isBriefwahlRow({})).toBe(false);
		});
	});

	describe('transformBwlRow', () => {
		it('liefert composite uwbId aus Real-Fixture-Row', async () => {
			const { rows, headers } = await loadBerlin();
			const transformed = transformBwlRow(rows[0], headers);
			expect(transformed.wahlkreis).toBe('074');
			expect(transformed.wahlbezirk).toBe('104');
			expect(transformed.uwbId).toBe('074-01-104-0');
		});

		it('extrahiert bezirkCode (Berliner Bezirk Mitte = 01)', async () => {
			const { rows, headers } = await loadBerlin();
			const transformed = transformBwlRow(rows[0], headers);
			expect(transformed.bezirkCode).toBe('01');
		});

		it('parsed Wahlberechtigte + Wählende als Number', async () => {
			const { rows, headers } = await loadBerlin();
			const transformed = transformBwlRow(rows[0], headers);
			expect(transformed.wahlberechtigte).toBeGreaterThan(0);
			expect(transformed.waehlende).toBeGreaterThan(0);
		});

		it('liefert Erststimmen + Zweitstimmen als sortierte Liste', async () => {
			const { rows, headers } = await loadBerlin();
			const transformed = transformBwlRow(rows[0], headers);
			expect(transformed.votes.erststimme.length).toBeGreaterThan(0);
			expect(transformed.votes.zweitstimme.length).toBeGreaterThan(0);
			// sortiert nach stimmen DESC
			for (let i = 1; i < transformed.votes.erststimme.length; i++) {
				expect(transformed.votes.erststimme[i].stimmen).toBeLessThanOrEqual(
					transformed.votes.erststimme[i - 1].stimmen
				);
			}
		});

		it('aggregiert Sonstige-Aliase (Tierschutzpartei, PIRATEN etc.) zu "Sonstige"', async () => {
			const { rows, headers } = await loadBerlin();
			const transformed = transformBwlRow(rows[0], headers);
			const erst = new Map(transformed.votes.erststimme.map((v) => [v.parteiKurzname, v.stimmen]));
			expect(erst.has('SPD')).toBe(true);
			expect(erst.has('CDU')).toBe(true);
			expect(erst.has('GRÜNE')).toBe(true);
			// Tierschutzpartei etc. fallen in Sonstige
			expect(erst.has('Tierschutzpartei')).toBe(false);
		});

		it('markiert Briefwahl-Row aus Bezirksart-Spalte', async () => {
			const { rows, headers } = await loadBerlin();
			// First fixture row had Bezirksart=0 (Urne)
			const t0 = transformBwlRow(rows[0], headers);
			expect(t0.istBriefwahl).toBe(false);
		});

		it('Erst + Zweit Summen sind nahe Gültige-Spalte', async () => {
			const { rows, headers } = await loadBerlin();
			const t = transformBwlRow(rows[0], headers);
			const sumErst = t.votes.erststimme.reduce((s, v) => s + v.stimmen, 0);
			const sumZweit = t.votes.zweitstimme.reduce((s, v) => s + v.stimmen, 0);
			expect(sumErst).toBe(t.gueltig.erststimme);
			expect(sumZweit).toBe(t.gueltig.zweitstimme);
		});
	});
});
