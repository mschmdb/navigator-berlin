import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import LayerLevelCard from './layer-level-card.svelte';
import type { LayerHit } from '$lib/data';
import type { LayerLevelView } from './internal/aggregate-layer-for-level.js';

const hit: LayerHit = {
	layer: 'laerm-2023',
	value: 'mittel',
	source: '',
	updatedAt: '',
	license: 'dl-de/by-2-0'
};

describe('LayerLevelCard', () => {
	it('address-View → Passthrough auf LayerHitRow (kein Aggregat-Card)', async () => {
		const view: LayerLevelView = { kind: 'address', level: 'address', visualType: 'distance-ring' };
		render(LayerLevelCard, { view, hit, layerName: 'Lärm' });
		await expect.element(page.getByTestId('layer-level-card')).not.toBeInTheDocument();
	});

	it('aggregate ordinal → DistributionBar im Card', async () => {
		const view: LayerLevelView = {
			kind: 'aggregate',
			level: 'kiez',
			visualType: 'ordinal-distribution',
			neutral: false,
			aggregate: {
				type: 'ordinal-distribution',
				classes: [{ label: 'mittel', share: 100 }],
				dominant: 'mittel',
				contributingMembers: 3,
				totalMembers: 3,
				coverage: '3/3'
			}
		};
		render(LayerLevelCard, { view, hit, layerName: 'Lärm' });
		await expect.element(page.getByTestId('layer-level-card')).toBeInTheDocument();
		await expect.element(page.getByTestId('distribution-bar')).toBeInTheDocument();
	});

	it('aggregate numeric → ScoreBar im Card', async () => {
		const view: LayerLevelView = {
			kind: 'aggregate',
			level: 'berlin',
			visualType: 'numeric-median',
			aggregate: {
				type: 'numeric-median',
				median: 36.5,
				min: 24,
				max: 45,
				contributingMembers: 100,
				totalMembers: 100,
				coverage: '100/100'
			}
		};
		render(LayerLevelCard, { view, hit, layerName: 'Hitze (PET)' });
		await expect.element(page.getByTestId('score-bar')).toBeInTheDocument();
	});

	it('coverage-share → CoverageBar', async () => {
		const view: LayerLevelView = {
			kind: 'aggregate',
			level: 'bezirk',
			visualType: 'coverage-share',
			aggregate: { type: 'coverage-share', share: 42 }
		};
		render(LayerLevelCard, { view, hit, layerName: 'Denkmal' });
		await expect.element(page.getByTestId('coverage-bar')).toBeInTheDocument();
	});

	it('below-threshold → level-below-threshold Disclaimer', async () => {
		const view: LayerLevelView = { kind: 'below-threshold', level: 'kiez', coverageNote: '1/3' };
		render(LayerLevelCard, { view, hit, layerName: 'MSS' });
		const d = await page.getByTestId('editorial-disclaimer').element();
		expect(d.getAttribute('data-variant')).toBe('level-below-threshold');
	});

	it('not-aggregatable → brw-not-aggregatable Disclaimer', async () => {
		const view: LayerLevelView = {
			kind: 'not-aggregatable',
			level: 'bezirk',
			disclaimer: 'brw-not-aggregatable'
		};
		render(LayerLevelCard, { view, hit, layerName: 'Bodenrichtwert' });
		const d = await page.getByTestId('editorial-disclaimer').element();
		expect(d.getAttribute('data-variant')).toBe('brw-not-aggregatable');
	});

	it('point-density ohne pointResult → Passthrough auf LayerHitRow (8.2c-Fallback)', async () => {
		const view: LayerLevelView = {
			kind: 'point-density',
			level: 'bezirk',
			visualType: 'point-density'
		};
		render(LayerLevelCard, { view, hit, layerName: 'Kitas' });
		await expect.element(page.getByTestId('layer-level-card')).not.toBeInTheDocument();
	});

	it('point-density mit pointResult → Count + Dichte', async () => {
		const view: LayerLevelView = {
			kind: 'point-density',
			level: 'bezirk',
			visualType: 'point-density'
		};
		render(LayerLevelCard, {
			view,
			hit,
			layerName: 'Kitas',
			pointResult: { count: 42, densityPerKm2: 3.5 }
		});
		const el = (await page.getByTestId('point-density-summary').element()) as HTMLElement;
		expect(el.textContent).toContain('42');
		expect(el.textContent).toContain('3.5');
	});
});
