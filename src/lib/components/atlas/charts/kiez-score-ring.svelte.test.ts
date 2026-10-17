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

	// GH-86: Die Bogen-Beschriftung (8 px) schnitt Namen ab („Grün …“). Die Namen
	// stehen jetzt in einer Legende neben dem Ring, mindestens 11 px, ohne Clipping.
	it('zeigt die Dimensionen als Legende mit Wert statt als Bogen-Beschriftung', async () => {
		render(KiezScoreRing, { score: makeScore(50) });
		const legend = (await page.getByTestId('kiez-score-ring-legend').element()) as HTMLElement;
		// Client-Tests laden app.css nicht: die Klasse belegt die Dichte-Skala, die
		// Mindestgröße (11 px) gilt zusätzlich gegen die Browser-Defaults.
		expect(legend.className).toContain('text-dense-label');
		const items = legend.querySelectorAll('li');
		expect(items).toHaveLength(5);
		expect(items[0]!.textContent).toContain('Ruhe & Luft');
		expect(items[0]!.textContent).toContain('80');
		expect(items[1]!.textContent).toContain('Grün & Hitze');
		for (const item of items) {
			expect(parseFloat(getComputedStyle(item).fontSize)).toBeGreaterThanOrEqual(11);
			expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
		}
		const ring = (await page.getByTestId('kiez-score-ring').element()) as HTMLElement;
		expect(ring.querySelectorAll('svg text')).toHaveLength(0);
	});

	it('Legende zeigt fehlende Werte als keine Daten', async () => {
		const score = makeScore(50);
		score.dimensions[1].value = null;
		render(KiezScoreRing, { score });
		const legend = (await page.getByTestId('kiez-score-ring-legend').element()) as HTMLElement;
		expect(legend.querySelectorAll('li')[1]!.textContent).toContain('keine Daten');
	});

	it('ohne Prop bleibt der DE-Default (kein getLocale()-Fallback)', async () => {
		render(KiezScoreRing, { score: makeScore(50) });
		const table = (await page.getByTestId('kiez-score-ring-table').element()) as HTMLElement;
		expect(table.textContent).toContain('Gesamt');
		expect(table.textContent).toContain('Ruhe & Luft');
	});

	it('Legende und Reihenfolge-Zeile stehen linksbündig, auch in zentrierten Containern (#90)', async () => {
		render(KiezScoreRing, { score: makeScore(50) });
		const legend = (await page.getByTestId('kiez-score-ring-legend').element()) as HTMLElement;
		const order = (await page.getByTestId('kiez-score-ring-order').element()) as HTMLElement;
		expect(legend.className).toMatch(/\btext-left\b/);
		expect(order.className).toMatch(/\btext-left\b/);
	});
});
