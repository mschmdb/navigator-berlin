import { describe, expect, it } from 'vitest';
import { neighborBezirke } from './bezirk-neighbors';

describe('neighborBezirke', () => {
	const lists: Record<string, { bezirkName: string }[]> = {
		reuterstrasse: [{ bezirkName: 'Neukölln' }, { bezirkName: 'Friedrichshain-Kreuzberg' }],
		rudow: [{ bezirkName: 'Treptow-Köpenick' }, { bezirkName: 'Neukölln' }],
		britz: [{ bezirkName: 'Tempelhof-Schöneberg' }, { bezirkName: 'Friedrichshain-Kreuzberg' }]
	};

	it('collects other Bezirke bordering any own Kiez, without duplicates, sorted', () => {
		expect(
			neighborBezirke(['reuterstrasse', 'rudow', 'britz'], 'Neukölln', (s) => lists[s] ?? [])
		).toEqual(['Friedrichshain-Kreuzberg', 'Tempelhof-Schöneberg', 'Treptow-Köpenick']);
	});

	it('returns an empty list without neighbors', () => {
		expect(neighborBezirke(['x'], 'Neukölln', () => [])).toEqual([]);
	});
});
