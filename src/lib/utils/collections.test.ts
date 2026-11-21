import { describe, expect, it } from 'vitest';
import { groupBy, indexBy, unique } from './collections.js';

describe('groupBy', () => {
	it('gruppiert in Einfüge-Reihenfolge', () => {
		const result = groupBy(
			[
				{ k: 'a', v: 1 },
				{ k: 'b', v: 2 },
				{ k: 'a', v: 3 }
			],
			(x) => x.k
		);
		expect([...result.keys()]).toEqual(['a', 'b']);
		expect(result.get('a')).toEqual([
			{ k: 'a', v: 1 },
			{ k: 'a', v: 3 }
		]);
	});

	it('liefert leere Map für leere Liste', () => {
		expect(groupBy([], (x: string) => x).size).toBe(0);
	});
});

describe('indexBy', () => {
	it('lässt bei doppelten Schlüsseln den letzten Eintrag gewinnen', () => {
		const result = indexBy(
			[
				{ k: 'a', v: 1 },
				{ k: 'a', v: 2 }
			],
			(x) => x.k
		);
		expect(result.get('a')?.v).toBe(2);
		expect(result.size).toBe(1);
	});
});

describe('unique', () => {
	it('entfernt Dubletten und behält die erste Reihenfolge', () => {
		expect(unique([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
	});

	it('liefert leeres Array für leere Liste', () => {
		expect(unique([])).toEqual([]);
	});
});
