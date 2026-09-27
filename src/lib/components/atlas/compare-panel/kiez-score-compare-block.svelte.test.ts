import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KiezScoreCompareBlock from './kiez-score-compare-block.svelte';
import type { KiezScore } from '$lib/data';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

function score(overrides: Partial<KiezScore> = {}): KiezScore {
	return {
		persona: 'allgemein',
		overall: 64,
		missingDimensions: [],
		dimensions: [
			{ dimension: 'ruhe-luft', value: 50, sources: [], missingData: [], dataStand: null },
			{ dimension: 'gruen-hitze', value: 46, sources: [], missingData: [], dataStand: null },
			{ dimension: 'mobilitaet', value: 41, sources: [], missingData: [], dataStand: null },
			{ dimension: 'versorgung', value: 77, sources: [], missingData: [], dataStand: null },
			{ dimension: 'wohnschutz', value: 100, sources: [], missingData: [], dataStand: null },
			{ dimension: 'kultur', value: 30, sources: [], missingData: [], dataStand: null },
			{ dimension: 'kriminalitaet', value: 20, sources: [], missingData: [], dataStand: null }
		],
		...overrides
	};
}

describe('kiez-score-compare-block', () => {
	it('rendert nichts ohne Score A/B', async () => {
		render(KiezScoreCompareBlock, { scoreA: null, scoreB: null });
		await expect.element(page.getByTestId('compare-kiez-score')).not.toBeInTheDocument();
	});

	it('rendert Gesamt-Zeile + Dimensions-Zeilen', async () => {
		render(KiezScoreCompareBlock, { scoreA: score(), scoreB: null });
		await expect.element(page.getByTestId('compare-kiez-score-overall')).toBeInTheDocument();
		await expect.element(page.getByTestId('compare-kiez-score-dim-ruhe-luft')).toBeInTheDocument();
	});

	it('Spaltenkopf bleibt DE „Dimension“', async () => {
		render(KiezScoreCompareBlock, { scoreA: score(), scoreB: null });
		const section = (await page.getByTestId('compare-kiez-score').element()) as HTMLElement;
		expect(section.querySelector('thead th')?.textContent?.trim()).toBe('Dimension');
	});

	it('fehlende Seite zeigt Em-Dash-Platzhalter', async () => {
		render(KiezScoreCompareBlock, { scoreA: score(), scoreB: null });
		const overall = (await page.getByTestId('compare-kiez-score-overall').element()) as HTMLElement;
		const cellB = overall.querySelectorAll('td')[1];
		expect(cellB?.textContent?.trim()).toBe('—');
	});

	it('Methodik-Link zeigt auf den DE-Default-Pfad', async () => {
		render(KiezScoreCompareBlock, { scoreA: score(), scoreB: null });
		const link = (await page
			.getByTestId('compare-kiez-score-methodik-link')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/methodik/kiez-score');
		expect(link.textContent?.trim()).toBe('Methodik · Wie der Kiez-Score berechnet wird');
	});

	// i18n Block B3c: EN-Locale übersetzt Header, Dimension-Labels, Gesamt-Label
	// und lokalisiert den Methodik-Link.
	describe('i18n Block B3c (EN)', () => {
		it('Header, Gesamt-Label und Dimension-Labels englisch', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezScoreCompareBlock, { scoreA: score(), scoreB: null });
			await expect
				.element(page.getByTestId('compare-kiez-score-header'))
				.toHaveTextContent('Kiez score');
			const overall = (await page
				.getByTestId('compare-kiez-score-overall')
				.element()) as HTMLElement;
			expect(overall.querySelector('th')?.textContent?.trim()).toBe('Overall');
			const dim = (await page
				.getByTestId('compare-kiez-score-dim-ruhe-luft')
				.element()) as HTMLElement;
			expect(dim.querySelector('th')?.textContent?.trim()).toBe('Quiet & air');
		});

		it('Methodik-Link lokalisiert auf /en/...', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezScoreCompareBlock, { scoreA: score(), scoreB: null });
			const link = (await page
				.getByTestId('compare-kiez-score-methodik-link')
				.element()) as HTMLAnchorElement;
			expect(link.getAttribute('href')).toBe('/en/methodik/kiez-score');
			expect(link.textContent?.trim()).toBe('Methodology · How the Kiez score is calculated');
		});

		it('Dimension-Chip zeigt EN-Skalen-Label + EN-Severity-Text in der Aria', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezScoreCompareBlock, { scoreA: score(), scoreB: null });
			const dim = (await page.getByTestId('compare-kiez-score-dim-ruhe-luft').element()) as HTMLElement;
			const chip = dim.querySelector('[data-testid="value-chip"]') as HTMLElement;
			expect(chip.querySelector('[data-testid="value-chip-value"]')?.textContent?.trim()).toBe(
				'medium (50)'
			);
			expect(chip.getAttribute('aria-label')).toMatch(/neutral rating/);
		});

		it('Gesamt-Chip: EN-Skalen-Label + EN-Overall-LayerName in der Aria', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezScoreCompareBlock, { scoreA: score(), scoreB: null });
			const overall = (await page.getByTestId('compare-kiez-score-overall').element()) as HTMLElement;
			const chip = overall.querySelector('[data-testid="value-chip"]') as HTMLElement;
			expect(chip.querySelector('[data-testid="value-chip-value"]')?.textContent?.trim()).toBe(
				'high (64/100)'
			);
			expect(chip.getAttribute('aria-label')).toMatch(/^Kiez score overall:/);
		});
	});
});
