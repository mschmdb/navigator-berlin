import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ClimateSparkline from './climate-sparkline.svelte';
import type { YearValue } from '$lib/data';

const SUMMER: YearValue[] = [
	{ year: 1950, count: 8 },
	{ year: 1990, count: 12 },
	{ year: 2024, count: 18 }
];

describe('ClimateSparkline', () => {
	it('rendert figure mit Titel "Sommertage" für metric=summer', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const title = screen.container.querySelector('svg title');
		expect(title?.textContent).toContain('Sommertage');
	});

	it('Titel = "Frosttage" für metric=frost', async () => {
		const screen = render(ClimateSparkline, {
			series: [{ year: 1950, count: 20 }, { year: 2024, count: 5 }],
			metric: 'frost',
			stationName: 'Berlin-Tempelhof'
		});
		const title = screen.container.querySelector('svg title');
		expect(title?.textContent).toContain('Frosttage');
	});

	it('Titel = "Heiße Tage" für metric=hot', async () => {
		const screen = render(ClimateSparkline, {
			series: [{ year: 1950, count: 2 }, { year: 2024, count: 6 }],
			metric: 'hot',
			stationName: 'Berlin-Dahlem'
		});
		const title = screen.container.querySelector('svg title');
		expect(title?.textContent).toContain('Heiße Tage');
	});

	it('aria-desc enthält Stationsnamen und Latest-Wert', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const desc = screen.container.querySelector('svg desc');
		expect(desc?.textContent).toContain('Berlin-Dahlem');
		expect(desc?.textContent).toContain('18');
	});

	it('zeichnet eine SVG-Linie für die Datenpunkte', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const path = screen.container.querySelector('path[data-testid="sparkline-line"]');
		expect(path).not.toBeNull();
		expect(path?.getAttribute('d')).toMatch(/^M/);
	});

	it('rendert Trend-Line als zweite Path-Linie', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const trend = screen.container.querySelector('path[data-testid="sparkline-trend"]');
		expect(trend).not.toBeNull();
	});

	it('rendert Latest-Annotation mit Plex-Mono', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const latestText = screen.container.querySelector('[data-testid="sparkline-annotation-latest"]');
		expect(latestText?.textContent).toContain('18');
		expect(latestText?.classList.toString()).toMatch(/mono|font-mono/);
	});

	it('figcaption enthält Min, Max, Latest', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const fc = screen.container.querySelector('[data-testid="chart-figcaption"]');
		expect(fc?.textContent).toContain('Min: 8');
		expect(fc?.textContent).toContain('Max: 18');
		expect(fc?.textContent).toContain('Latest: 18');
	});

	it('keine Krash bei leerer Serie', async () => {
		const screen = render(ClimateSparkline, {
			series: [],
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector('[data-testid="accessible-chart"]');
		expect(figure).not.toBeNull();
	});
});
