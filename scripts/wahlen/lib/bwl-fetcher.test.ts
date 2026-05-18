import { describe, expect, it } from 'vitest';
import AdmZip from 'adm-zip';
import {
	extractBwlWbzCsv,
	findBwlWbzCsvEntry,
	BWL_BTW25_WBZ_CSV_NAME
} from './bwl-fetcher.js';

function buildFixtureZip(entries: Array<{ name: string; content: string }>): Buffer {
	const zip = new AdmZip();
	for (const e of entries) {
		zip.addFile(e.name, Buffer.from(e.content, 'utf-8'));
	}
	return zip.toBuffer();
}

describe('bwl-fetcher', () => {
	describe('BWL_BTW25_WBZ_CSV_NAME', () => {
		it('matched echtes BTW25 ZIP-Entry-Pattern', () => {
			expect(BWL_BTW25_WBZ_CSV_NAME).toBe('btw25_wbz_ergebnisse.csv');
		});
	});

	describe('findBwlWbzCsvEntry', () => {
		it('findet ergebnisse.csv-Entry im ZIP', () => {
			const buf = buildFixtureZip([
				{ name: 'btw25_wbz_impressum.pdf', content: 'pdf-bytes' },
				{ name: 'btw25_wbz_ergebnisse.csv', content: 'Wahlkreis;Land\n001;01' },
				{ name: 'btw25_wbz_leitband.csv', content: 'leitband' }
			]);
			const name = findBwlWbzCsvEntry(buf);
			expect(name).toBe('btw25_wbz_ergebnisse.csv');
		});

		it('wirft wenn ergebnisse.csv fehlt', () => {
			const buf = buildFixtureZip([{ name: 'btw25_wbz_impressum.pdf', content: 'pdf' }]);
			expect(() => findBwlWbzCsvEntry(buf)).toThrow(/ergebnisse\.csv/);
		});

		it('ignoriert PDFs + leitband.csv', () => {
			const buf = buildFixtureZip([
				{ name: 'btw25_wbz_leitband.csv', content: 'leitband' },
				{ name: 'btw25_wbz_ergebnisse.csv', content: 'real' }
			]);
			expect(findBwlWbzCsvEntry(buf)).toBe('btw25_wbz_ergebnisse.csv');
		});
	});

	describe('extractBwlWbzCsv', () => {
		it('extrahiert Inhalt der ergebnisse.csv als UTF-8 String', () => {
			const buf = buildFixtureZip([
				{ name: 'btw25_wbz_ergebnisse.csv', content: 'Wahlkreis;Land\n001;01' }
			]);
			expect(extractBwlWbzCsv(buf)).toBe('Wahlkreis;Land\n001;01');
		});

		it('erhält UTF-8 BOM falls vorhanden', () => {
			const buf = buildFixtureZip([
				{ name: 'btw25_wbz_ergebnisse.csv', content: '﻿Wahlkreis;Land\n001;01' }
			]);
			const out = extractBwlWbzCsv(buf);
			expect(out.startsWith('﻿')).toBe(true);
		});
	});
});
