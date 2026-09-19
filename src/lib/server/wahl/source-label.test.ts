import { describe, it, expect } from 'vitest';
import { sourceName } from './source-label.js';

describe('sourceName', () => {
	it('erkennt Bundeswahlleiterin-URLs', () => {
		expect(sourceName('https://bundeswahlleiterin.de/dam/jcr/abc/btw25_wbz.zip')).toBe(
			'Bundeswahlleiterin'
		);
	});

	it('fällt für alle anderen URLs auf Amt für Statistik Berlin-Brandenburg zurück', () => {
		expect(sourceName('https://download.statistik-berlin-brandenburg.de/xyz.xlsx')).toBe(
			'Amt für Statistik Berlin-Brandenburg'
		);
	});
});
