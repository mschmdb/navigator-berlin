import { describe, expect, it } from 'vitest';
import { BEZIRK_SAMEAS } from '$lib/seo/sources/bezirk-sameas.js';
import { HOME_BEZIRKE } from './home-bezirke.js';

describe('HOME_BEZIRKE', () => {
	it('führt 12 Bezirke', () => {
		expect(HOME_BEZIRKE).toHaveLength(12);
	});

	it('Slugs entsprechen den BEZIRK_SAMEAS-Schlüsseln', () => {
		expect(HOME_BEZIRKE.map((b) => b.slug).sort()).toEqual(Object.keys(BEZIRK_SAMEAS).sort());
	});

	it('Namen sind eindeutig und nicht leer', () => {
		const names = HOME_BEZIRKE.map((b) => b.name);
		expect(new Set(names).size).toBe(12);
		expect(names.every((n) => n.length > 0)).toBe(true);
	});
});
