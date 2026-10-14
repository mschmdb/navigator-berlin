import { describe, it, expect } from 'vitest';
import { toCompositeRank } from './composite-rank.js';

describe('toCompositeRank', () => {
	it('reicht rang, quartil und total durch', () => {
		const rank = new Map([['composite', { rang: 140, quartil: 4, total: 143 }]]);
		expect(toCompositeRank(rank)).toEqual({ rang: 140, quartil: 4, total: 143 });
	});

	it('liefert rang null ohne composite-Zeile', () => {
		expect(toCompositeRank(new Map())).toEqual({ rang: null, quartil: null, total: 0 });
	});

	it('liefert rang null ohne Rang-Map', () => {
		expect(toCompositeRank(null)).toEqual({ rang: null, quartil: null, total: 0 });
	});
});
