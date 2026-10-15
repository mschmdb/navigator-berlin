import { describe, expect, it } from 'vitest';
import { hasRenderableOutline } from './has-renderable-outline.js';
import type { RegionOutline } from '$lib/seo/region-outline-svg.js';

const outline: RegionOutline = {
	viewBox: '0 0 10 10',
	width: 10,
	height: 10,
	paths: [
		{ id: 'a', d: 'M0 0Z' },
		{ id: 'b', d: 'M1 1Z' }
	]
};

describe('hasRenderableOutline', () => {
	it('ist false ohne Umriss', () => {
		expect(hasRenderableOutline(null, ['a'])).toBe(false);
	});

	it('ist false ohne passenden Slug', () => {
		expect(hasRenderableOutline(outline, ['x'])).toBe(false);
		expect(hasRenderableOutline(outline, [])).toBe(false);
	});

	it('ist true bei mindestens einem passenden Slug', () => {
		expect(hasRenderableOutline(outline, ['x', 'b'])).toBe(true);
	});

	it('ist false bei Umriss ohne Pfade', () => {
		expect(hasRenderableOutline({ ...outline, paths: [] }, ['a'])).toBe(false);
	});
});
