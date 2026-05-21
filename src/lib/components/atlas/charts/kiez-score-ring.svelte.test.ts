import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import KiezScoreRing from './kiez-score-ring.svelte';
import KiezScoreHero from './kiez-score-hero.svelte';
import type { KiezScore } from '$lib/data';

function makeScore(overall = 50): KiezScore {
	return {
		persona: 'allgemein',
		overall,
		missingDimensions: [],
		dimensions: [
			{ dimension: 'ruhe-luft', value: 80, sources: [], missingData: [], dataStand: null },
			{ dimension: 'gruen', value: 50, sources: [], missingData: [], dataStand: null },
			{ dimension: 'mobilitaet', value: 70, sources: [], missingData: [], dataStand: null },
			{ dimension: 'soziale-lage', value: 30, sources: [], missingData: [], dataStand: null },
			{ dimension: 'versorgung', value: 60, sources: [], missingData: [], dataStand: null }
		]
	};
}

describe('KiezScoreRing', () => {
	it('rendert 5 Dimension-Segmente + Gesamt + sr-only-Tabelle', async () => {
		render(KiezScoreRing, { score: makeScore(50) });
		await expect.element(page.getByTestId('ring-segment-ruhe-luft')).toBeInTheDocument();
		await expect.element(page.getByTestId('ring-segment-soziale-lage')).toBeInTheDocument();
		await expect.element(page.getByTestId('ring-segment-versorgung')).toBeInTheDocument();
		const table = (await page.getByTestId('kiez-score-ring-table').element()) as HTMLElement;
		expect(table.textContent).toContain('Gesamt');
		expect(table.textContent).toContain('50 / 100');
		expect(table.textContent).toContain('Soziale Lage');
	});

	it('Dimension mit value null zeigt keine Daten in Tabelle', async () => {
		const score = makeScore(50);
		score.dimensions[1].value = null;
		render(KiezScoreRing, { score });
		const table = (await page.getByTestId('kiez-score-ring-table').element()) as HTMLElement;
		expect(table.textContent).toContain('keine Daten');
	});
});

describe('KiezScoreHero', () => {
	it('score null → rendert nichts', async () => {
		render(KiezScoreHero, { score: null });
		await expect.element(page.getByTestId('kiez-score-hero')).not.toBeInTheDocument();
	});

	it('single mode: Ring + Dim-Liste + Methodik-Link', async () => {
		render(KiezScoreHero, { score: makeScore(50) });
		await expect.element(page.getByTestId('kiez-score-ring')).toBeInTheDocument();
		await expect.element(page.getByTestId('kiez-score-hero-dims')).toBeInTheDocument();
		const link = (await page
			.getByTestId('kiez-score-hero-methodik-link')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/methodik/kiez-score');
	});

	it('compare mode: 5-Dim-Bar-Stack A/B statt Ring', async () => {
		render(KiezScoreHero, { score: makeScore(50), comparisonScore: makeScore(70) });
		const hero = (await page.getByTestId('kiez-score-hero').element()) as HTMLElement;
		expect(hero.getAttribute('data-compare')).toBe('true');
		await expect.element(page.getByTestId('kiez-score-hero-compare')).toBeInTheDocument();
		await expect.element(page.getByTestId('hero-compare-dim-ruhe-luft')).toBeInTheDocument();
		await expect.element(page.getByTestId('kiez-score-ring')).not.toBeInTheDocument();
	});
});
