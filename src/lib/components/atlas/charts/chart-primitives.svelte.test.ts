import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ScoreBar from './score-bar.svelte';
import DistanceRing from './distance-ring.svelte';

describe('ScoreBar', () => {
	it('rendert Fill + Anker + sr-only-Tabelle mit Rohwerten', async () => {
		render(ScoreBar, {
			value: 30,
			min: 0,
			max: 100,
			anchorValue: 50,
			anchorLabel: 'Berlin-Median',
			unit: 'µg/m³',
			layerName: 'Luftqualität',
			severity: 'neutral'
		});
		await expect.element(page.getByTestId('score-bar-fill')).toBeInTheDocument();
		await expect.element(page.getByTestId('score-bar-anchor')).toBeInTheDocument();
		const table = (await page.getByTestId('score-bar-table').element()) as HTMLElement;
		expect(table.textContent).toContain('30');
		expect(table.textContent).toContain('50');
	});

	it('default severity neutral (Stigma-sicher)', async () => {
		render(ScoreBar, { value: 80, layerName: 'X' });
		const el = (await page.getByTestId('score-bar').element()) as HTMLElement;
		expect(el.getAttribute('data-severity')).toBe('neutral');
	});
});

describe('DistanceRing', () => {
	it('rendert Arc + Distanz-Text + sr-only-Tabelle', async () => {
		render(DistanceRing, {
			distanceMeters: 250,
			label: 'Nächste Kita',
			layerName: 'Kitas',
			countInPolygon: 3
		});
		await expect.element(page.getByTestId('distance-ring-arc')).toBeInTheDocument();
		const table = (await page.getByTestId('distance-ring-table').element()) as HTMLElement;
		expect(table.textContent).toContain('250 m');
		expect(table.textContent).toContain('3');
	});

	it('distanceMeters null → k. A. ohne Crash', async () => {
		render(DistanceRing, { distanceMeters: null, label: 'Nächste Schule', layerName: 'Schulen' });
		const table = (await page.getByTestId('distance-ring-table').element()) as HTMLElement;
		expect(table.textContent).toContain('k. A.');
	});
});
