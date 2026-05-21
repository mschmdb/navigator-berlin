import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ScoreBar from './score-bar.svelte';
import DistributionBar from './distribution-bar.svelte';
import CoverageBar from './coverage-bar.svelte';
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

describe('DistributionBar', () => {
	it('rendert Segmente + dominante Klasse + sr-only-Tabelle', async () => {
		render(DistributionBar, {
			classes: [
				{ label: 'gering', share: 1 },
				{ label: 'mittel', share: 2 },
				{ label: 'hoch', share: 1 }
			],
			layerName: 'Lärm',
			neutral: true
		});
		await expect.element(page.getByTestId('distribution-segment-0')).toBeInTheDocument();
		await expect.element(page.getByTestId('distribution-dominant')).toBeInTheDocument();
		const dom = (await page.getByTestId('distribution-dominant').element()) as HTMLElement;
		expect(dom.textContent).toContain('mittel');
		const table = (await page.getByTestId('distribution-bar-table').element()) as HTMLElement;
		expect(table.textContent).toContain('gering');
		expect(table.textContent).toContain('50%');
	});

	it('neutral-Flag setzt data-neutral', async () => {
		render(DistributionBar, {
			classes: [{ label: 'a', share: 1 }],
			layerName: 'MSS',
			neutral: true
		});
		const el = (await page.getByTestId('distribution-bar').element()) as HTMLElement;
		expect(el.getAttribute('data-neutral')).toBe('true');
	});
});

describe('CoverageBar', () => {
	it('rendert Anteil + Fill + sr-only-Tabelle', async () => {
		render(CoverageBar, { share: 42, label: 'Kaltluft', layerName: 'Kaltluftentstehung' });
		const val = (await page.getByTestId('coverage-bar-value').element()) as HTMLElement;
		expect(val.textContent).toContain('42%');
		await expect.element(page.getByTestId('coverage-bar-fill')).toBeInTheDocument();
		const table = (await page.getByTestId('coverage-bar-table').element()) as HTMLElement;
		expect(table.textContent).toContain('42%');
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
