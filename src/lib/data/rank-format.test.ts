import { describe, it, expect } from 'vitest';
import { formatRank } from './rank-format.js';

describe('formatRank (Story 11.4 Anti-Stigma)', () => {
	it('zeigt exakten Rang für starke/mittlere Werte', () => {
		expect(formatRank(12, 1, 143)).toBe('Platz 12 von 143');
		expect(formatRank(80, 3, 143)).toBe('Platz 80 von 143');
	});
	it('zeigt „unteres Viertel" statt exaktem letztem Rang (Quartil 4)', () => {
		expect(formatRank(143, 4, 143)).toBe('unteres Viertel');
	});
	it('Gedankenstrich bei fehlendem Rang oder leerem Feld', () => {
		expect(formatRank(null, null, 143)).toBe('–');
		expect(formatRank(1, 1, 0)).toBe('–');
	});
});
