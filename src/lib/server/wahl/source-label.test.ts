import { describe, it, expect } from 'vitest';
import { sourceName } from './source-label.js';

describe('sourceName', () => {
	it('erkennt Bundeswahlleiterin-URLs', () => {
		expect(sourceName('https://bundeswahlleiterin.de/dam/jcr/abc/btw25_wbz.zip')).toBe(
			'Bundeswahlleiterin'
		);
	});

	it('fällt für SBB-URLs auf Amt für Statistik Berlin-Brandenburg zurück', () => {
		expect(sourceName('https://download.statistik-berlin-brandenburg.de/xyz.xlsx')).toBe(
			'Amt für Statistik Berlin-Brandenburg'
		);
	});

	it('erkennt wahlen-berlin.de-URLs (Story: Ingest AGH/BVV 2026, wb-csv)', () => {
		expect(
			sourceName(
				'https://www.wahlen-berlin.de/wahlen/BE2026/Afspraes/AGH/Datenexport_AGH2026_Zweitstimme_W_BE.csv'
			)
		).toBe('Landeswahlleiterin Berlin');
	});
});
