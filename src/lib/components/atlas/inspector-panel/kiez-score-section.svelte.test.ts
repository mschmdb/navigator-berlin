import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import KiezScoreSection from './kiez-score-section.svelte';
import type { KiezScore } from '$lib/data';

function makeScore(overrides: Partial<KiezScore> = {}): KiezScore {
	return {
		persona: 'allgemein',
		dimensions: [
			{
				dimension: 'ruhe-luft',
				value: 80,
				sources: [
					{ layer: 'laerm-2023', rawValue: { kategorie: 'gering' }, normalizedValue: 100, weight: 0.4 }
				],
				missingData: [],
				dataStand: '2024-01-01T00:00:00.000Z'
			},
			{
				dimension: 'gruen-hitze',
				value: 50,
				sources: [
					{
						layer: 'gruenversorgung-2023',
						rawValue: { kategorie: 'mittel' },
						normalizedValue: 33,
						weight: 0.3
					}
				],
				missingData: [],
				dataStand: '2024-01-01T00:00:00.000Z'
			},
			{
				dimension: 'mobilitaet',
				value: 70,
				sources: [
					{ layer: 'oepnv-ubahn', rawValue: { distanceM: 200 }, normalizedValue: 80, weight: 0.35 }
				],
				missingData: [],
				dataStand: null
			},
			{
				dimension: 'wohnschutz',
				value: 100,
				sources: [
					{
						layer: 'wohnschutz-presence',
						rawValue: true,
						normalizedValue: 100,
						weight: 1.0
					}
				],
				missingData: [],
				dataStand: '2024-12-01T00:00:00.000Z'
			},
			{
				dimension: 'versorgung',
				value: 60,
				sources: [
					{ layer: 'kitas-2024', rawValue: { distanceM: 200 }, normalizedValue: 60, weight: 0.25 }
				],
				missingData: [],
				dataStand: null
			}
		],
		missingDimensions: [],
		...overrides
	};
}

describe('KiezScoreSection', () => {
	it('rendert nichts wenn Score null ist', async () => {
		render(KiezScoreSection, { score: null });
		await expect.element(page.getByTestId('kiez-score-section')).not.toBeInTheDocument();
	});

	it('rendert Section-Header + 5 Dimension-Rows', async () => {
		render(KiezScoreSection, { score: makeScore() });
		await expect.element(page.getByTestId('kiez-score-section')).toBeInTheDocument();
		await expect.element(page.getByTestId('kiez-score-dim-ruhe-luft')).toBeInTheDocument();
		await expect.element(page.getByTestId('kiez-score-dim-gruen-hitze')).toBeInTheDocument();
		await expect.element(page.getByTestId('kiez-score-dim-mobilitaet')).toBeInTheDocument();
		await expect.element(page.getByTestId('kiez-score-dim-versorgung')).toBeInTheDocument();
		await expect.element(page.getByTestId('kiez-score-dim-wohnschutz')).toBeInTheDocument();
	});

	it('rendert Editorial-Disclaimer-Variant kiez-score-explainer', async () => {
		render(KiezScoreSection, { score: makeScore() });
		const disclaimer = await page.getByTestId('editorial-disclaimer').element();
		expect(disclaimer.getAttribute('data-variant')).toBe('kiez-score-explainer');
	});

	it('rendert Methodik-Link auf /methodik/kiez-score', async () => {
		render(KiezScoreSection, { score: makeScore() });
		const link = (await page
			.getByTestId('kiez-score-methodik-link')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/methodik/kiez-score');
	});

	it('Wohnschutz ValueChip ist positiv-eindeutig (hoher Schutz = success)', async () => {
		render(KiezScoreSection, { score: makeScore() });
		const dim = (await page.getByTestId('kiez-score-dim-wohnschutz').element()) as HTMLElement;
		const chip = dim.querySelector('[data-testid="value-chip"]') as HTMLElement | null;
		expect(chip?.getAttribute('data-severity')).toBe('success');
	});

	it('Dimension mit value=null zeigt „Daten unzureichend"', async () => {
		const score = makeScore();
		score.dimensions[1].value = null;
		render(KiezScoreSection, { score });
		await expect.element(page.getByTestId('kiez-score-missing-gruen-hitze')).toBeInTheDocument();
	});

	it('Quellen-Toggle expandiert Source-Liste', async () => {
		render(KiezScoreSection, { score: makeScore() });
		const toggle = (await page
			.getByTestId('kiez-score-toggle-sources-ruhe-luft')
			.element()) as HTMLButtonElement;
		toggle.click();
		await expect.element(page.getByTestId('kiez-score-sources-ruhe-luft')).toBeInTheDocument();
	});

	it('Stand-Footer zeigt Datum wenn dataStand gesetzt', async () => {
		render(KiezScoreSection, { score: makeScore() });
		await expect.element(page.getByTestId('kiez-score-stand-ruhe-luft')).toBeInTheDocument();
	});
});
