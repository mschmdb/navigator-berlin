import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ClimateSparkline from './climate-sparkline.svelte';
import type { YearValue } from '$lib/data';

const SUMMER: YearValue[] = [
	{ year: 1950, count: 8 },
	{ year: 1990, count: 12 },
	{ year: 2024, count: 18 }
];

const FROST: YearValue[] = [
	{ year: 1950, count: 20 },
	{ year: 2024, count: 5 }
];

const HOT: YearValue[] = [
	{ year: 1950, count: 2 },
	{ year: 2024, count: 6 }
];

describe('ClimateSparkline (LayerChart rewrite)', () => {
	it('exposes accessible figure with aria-labelledby + aria-describedby', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector('[data-testid="climate-sparkline-figure"]');
		expect(figure).not.toBeNull();
		expect(figure?.getAttribute('role')).toBe('img');
		const titleId = figure?.getAttribute('aria-labelledby');
		const descId = figure?.getAttribute('aria-describedby');
		expect(titleId).toBeTruthy();
		expect(descId).toBeTruthy();
		const title = screen.container.querySelector(`#${titleId}`);
		const desc = screen.container.querySelector(`#${descId}`);
		expect(title?.textContent).toContain('Sommertage');
		expect(desc?.textContent).toContain('Berlin-Dahlem');
		expect(desc?.textContent).toContain('18');
	});

	it('renders DWD definition subline per metric', async () => {
		for (const [metric, expected] of [
			['summer', 'Tagesmaximum ≥ 25 °C'],
			['frost', 'Tagesminimum < 0 °C'],
			['hot', 'Tagesmaximum ≥ 30 °C']
		] as const) {
			const screen = render(ClimateSparkline, {
				series: SUMMER,
				metric,
				stationName: 'Berlin-Dahlem'
			});
			const def = screen.container.querySelector(
				'[data-testid="climate-sparkline-definition"]'
			);
			expect(def?.textContent).toContain(expected);
		}
	});

	it('renders Sommertage label for metric=summer', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const heading = screen.container.querySelector('[data-testid="climate-sparkline-heading"]');
		expect(heading?.textContent).toContain('Sommertage');
	});

	it('renders Frosttage label for metric=frost', async () => {
		const screen = render(ClimateSparkline, {
			series: FROST,
			metric: 'frost',
			stationName: 'Berlin-Tempelhof'
		});
		const heading = screen.container.querySelector('[data-testid="climate-sparkline-heading"]');
		expect(heading?.textContent).toContain('Frosttage');
	});

	it('renders Heiße Tage label for metric=hot', async () => {
		const screen = render(ClimateSparkline, {
			series: HOT,
			metric: 'hot',
			stationName: 'Berlin-Dahlem'
		});
		const heading = screen.container.querySelector('[data-testid="climate-sparkline-heading"]');
		expect(heading?.textContent).toContain('Heiße Tage');
	});

	it('uses compact 64px height per AC-1', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector('[data-testid="climate-sparkline-figure"]');
		expect(figure).not.toBeNull();
		const svgs = figure!.querySelectorAll('svg');
		expect(svgs.length).toBeGreaterThan(0);
		const lcRoot = figure!.querySelector('.lc-root-container');
		expect(lcRoot).not.toBeNull();
		const style = lcRoot ? getComputedStyle(lcRoot) : null;
		const heightPx = style ? parseFloat(style.height) : 0;
		expect(heightPx).toBeLessThanOrEqual(72);
		expect(heightPx).toBeGreaterThanOrEqual(56);
	});

	it('renders LayerChart container (.lc-root-container) with SVG layer', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const layerChart = screen.container.querySelector('.lc-root-container');
		expect(layerChart).not.toBeNull();
		const svg = layerChart?.querySelector('svg');
		expect(svg).not.toBeNull();
	});

	it('renders main value spline path', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const paths = screen.container.querySelectorAll('.lc-root-container svg path');
		const splinePaths = Array.from(paths).filter((p) => {
			const d = p.getAttribute('d') ?? '';
			return d.length > 4 && d.startsWith('M');
		});
		expect(splinePaths.length).toBeGreaterThanOrEqual(1);
	});

	it('renders trend spline as dashed secondary series (AC-1)', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const dashed = screen.container.querySelector(
			'.lc-root-container svg path[stroke-dasharray]'
		);
		expect(dashed).not.toBeNull();
	});

	it('renders latest-value annotation (AC-1)', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const annotation = screen.container.querySelector(
			'[data-testid="sparkline-annotation-latest"]'
		);
		expect(annotation).not.toBeNull();
		expect(annotation?.textContent).toContain('18');
	});

	it('figcaption shows Min, Max, Latest', async () => {
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

	it('renders DataTableAlternative toggle button (AC-7)', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const toggle = screen.container.querySelector('[data-testid="table-toggle"]');
		expect(toggle).not.toBeNull();
		expect(toggle?.textContent).toMatch(/Tabelle/i);
	});

	it('figure is keyboard-focusable when data present (AC-3)', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector(
			'[data-testid="climate-sparkline-figure"]'
		);
		expect(figure?.getAttribute('tabindex')).toBe('0');
	});

	it('responds to ArrowRight by advancing focused index (AC-3)', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector(
			'[data-testid="climate-sparkline-figure"]'
		) as HTMLElement | null;
		expect(figure).not.toBeNull();
		figure!.focus();
		expect(figure?.getAttribute('data-focused-index')).toBe('-1');
		figure!.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
		);
		await new Promise((r) => setTimeout(r, 16));
		expect(figure?.getAttribute('data-focused-index')).toBe('0');
		figure!.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
		);
		await new Promise((r) => setTimeout(r, 16));
		expect(figure?.getAttribute('data-focused-index')).toBe('1');
	});

	it('Home / End jump to first / last data point (AC-3)', async () => {
		const screen = render(ClimateSparkline, {
			series: SUMMER,
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector(
			'[data-testid="climate-sparkline-figure"]'
		) as HTMLElement | null;
		figure!.focus();
		figure!.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'End', bubbles: true })
		);
		await new Promise((r) => setTimeout(r, 16));
		expect(figure?.getAttribute('data-focused-index')).toBe(
			String(SUMMER.length - 1)
		);
		figure!.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
		);
		await new Promise((r) => setTimeout(r, 16));
		expect(figure?.getAttribute('data-focused-index')).toBe('0');
	});

	it('renders empty state without crashing when series is empty', async () => {
		const screen = render(ClimateSparkline, {
			series: [],
			metric: 'summer',
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector(
			'[data-testid="climate-sparkline-figure"]'
		);
		expect(figure).not.toBeNull();
		const layerChart = screen.container.querySelector('.lc-root-container');
		expect(layerChart).toBeNull();
	});
});
