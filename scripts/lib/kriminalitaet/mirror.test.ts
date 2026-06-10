import { describe, expect, it } from 'vitest';
import { mirrorBrToPlr } from './mirror.js';
import type { BrIndexRecord } from './aggregate.js';

const BR: BrIndexRecord[] = [
	{
		bzrId: '011001',
		name: 'Tiergarten Süd',
		index: 50,
		delikteHz: { kieztaten: 6000, fahrraddiebstahl: 400 }
	},
	{
		bzrId: '011002',
		name: 'Regierungsviertel',
		index: null,
		delikteHz: { kieztaten: null }
	}
];

describe('mirrorBrToPlr', () => {
	it('jeder PLR erbt den Index seiner Bezirksregion (PLR_ID[:6])', () => {
		const records = mirrorBrToPlr(BR, ['01100101', '01100102', '01100201']);
		const byPlr = new Map(records.map((r) => [r.plrId, r]));
		expect(byPlr.get('01100101')?.index).toBe(50);
		expect(byPlr.get('01100102')?.index).toBe(50);
		expect(byPlr.get('01100101')?.bzrId).toBe('011001');
		expect(byPlr.get('01100101')?.delikteHz.kieztaten).toBe(6000);
	});

	it('der Index ist über die PLR einer BR konstant', () => {
		const records = mirrorBrToPlr(BR, ['01100101', '01100102', '01100103']);
		const indices = new Set(records.map((r) => r.index));
		expect(indices.size).toBe(1);
		expect([...indices][0]).toBe(50);
	});

	it('spiegelt auch null-Index der BR (Daten-Lücke)', () => {
		const records = mirrorBrToPlr(BR, ['01100201']);
		expect(records[0].index).toBeNull();
		expect(records[0].bzrId).toBe('011002');
	});

	it('PLR ohne zuordenbare BR -> index null, kein Crash', () => {
		const records = mirrorBrToPlr(BR, ['99999901']);
		expect(records[0].plrId).toBe('99999901');
		expect(records[0].bzrId).toBe('999999');
		expect(records[0].index).toBeNull();
		expect(records[0].delikteHz).toEqual({});
	});

	it('liefert einen Record pro PLR, sortiert nach plrId', () => {
		const records = mirrorBrToPlr(BR, ['01100102', '01100101']);
		expect(records.map((r) => r.plrId)).toEqual(['01100101', '01100102']);
	});

	it('verkraftet leere Eingaben', () => {
		expect(mirrorBrToPlr([], [])).toEqual([]);
		expect(mirrorBrToPlr(BR, [])).toEqual([]);
	});
});
