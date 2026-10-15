import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import KiezScoreRing from './kiez-score-ring.svelte';
import type { KiezScore } from '$lib/data';

function makeScore(overall = 50): KiezScore {
	return {
		persona: 'allgemein',
		overall,
		missingDimensions: [],
		dimensions: [
			{ dimension: 'ruhe-luft', value: 80, sources: [], missingData: [], dataStand: null },
			{ dimension: 'gruen-hitze', value: 50, sources: [], missingData: [], dataStand: null },
			{ dimension: 'mobilitaet', value: 70, sources: [], missingData: [], dataStand: null },
			{ dimension: 'versorgung', value: 60, sources: [], missingData: [], dataStand: null },
			{ dimension: 'wohnschutz', value: 30, sources: [], missingData: [], dataStand: null }
		]
	};
}

describe('KiezScoreRing', () => {
	it('rendert ArcChart-Ring + Gesamt + sr-only-Tabelle (alle 5 Dimensionen)', async () => {
		render(KiezScoreRing, { score: makeScore(50) });
		await expect.element(page.getByTestId('kiez-score-ring')).toBeInTheDocument();
		const table = (await page.getByTestId('kiez-score-ring-table').element()) as HTMLElement;
		expect(table.textContent).toContain('Gesamt');
		expect(table.textContent).toContain('50 / 100');
		expect(table.textContent).toContain('Ruhe & Luft');
		expect(table.textContent).toContain('Wohnschutz');
		expect(table.textContent).toContain('Versorgung');
	});

	it('Dimension mit value null zeigt keine Daten in Tabelle', async () => {
		const score = makeScore(50);
		score.dimensions[1].value = null;
		render(KiezScoreRing, { score });
		const table = (await page.getByTestId('kiez-score-ring-table').element()) as HTMLElement;
		expect(table.textContent).toContain('keine Daten');
	});

	// i18n Block B2: geteilter Baustein behaelt DE-Defaults; Konsumenten mit
	// eigener Locale (hier: Startseite) uebergeben ihre Labels per Prop.
	it('EN: Ueberschreiben von overallLabel/noDataLabel/dimensionLabels per Prop', async () => {
		const score = makeScore(50);
		score.dimensions[1].value = null;
		render(KiezScoreRing, {
			score,
			overallLabel: 'Overall',
			noDataLabel: 'no data',
			dimensionLabels: { 'ruhe-luft': 'Quiet & air', 'gruen-hitze': 'Green & heat' }
		});
		const table = (await page.getByTestId('kiez-score-ring-table').element()) as HTMLElement;
		expect(table.textContent).toContain('Overall');
		expect(table.textContent).toContain('no data');
		expect(table.textContent).toContain('Quiet & air');
		expect(table.textContent).not.toContain('Ruhe & Luft');
	});

	it('ohne Prop bleibt der DE-Default (kein getLocale()-Fallback)', async () => {
		render(KiezScoreRing, { score: makeScore(50) });
		const table = (await page.getByTestId('kiez-score-ring-table').element()) as HTMLElement;
		expect(table.textContent).toContain('Gesamt');
		expect(table.textContent).toContain('Ruhe & Luft');
	});
});
