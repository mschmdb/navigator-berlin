import { describe, expect, it } from 'vitest';
import { kiezSlugAt } from './point-kiez-slug.js';

const features = [
	{ properties: { BZR_NAME: 'Heerstraße', BEZ: '04' } },
	{ properties: { BZR_NAME: 'Reuterstraße', BEZ: '08' } },
	{ properties: { BZR_NAME: 'Heerstraße', BEZ: '05' } }
];

describe('kiezSlugAt', () => {
	it('trennt doppelte Kiez-Namen per Bezirk, wie die Wahl-Pipeline', () => {
		expect(kiezSlugAt(features, 0)).toBe('heerstrasse-charlottenburg-wilmersdorf');
		expect(kiezSlugAt(features, 2)).toBe('heerstrasse-spandau');
	});

	it('lässt eindeutige Namen beim einfachen Slug', () => {
		expect(kiezSlugAt(features, 1)).toBe('reuterstrasse');
	});

	it('liefert null ohne Namen', () => {
		expect(kiezSlugAt([{ properties: {} }], 0)).toBeNull();
	});
});
