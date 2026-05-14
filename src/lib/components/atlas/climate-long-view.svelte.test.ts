import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ClimateLongView from './climate-long-view.svelte';
import type { YearValue } from '$lib/data';

function buildSeries(): YearValue[] {
	const out: YearValue[] = [];
	for (let y = 1881; y <= 2024; y++) {
		out.push({ year: y, temp: 8 + (y - 1881) * 0.01 + Math.sin(y) * 0.3 });
	}
	return out;
}

const SERIES = buildSeries();

describe('ClimateLongView (LayerChart rewrite)', () => {
	it('exposes accessible figure with aria-labelledby + aria-describedby', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector(
			'[data-testid="climate-long-view-figure"]'
		);
		expect(figure).not.toBeNull();
		expect(figure?.getAttribute('role')).toBe('img');
		const titleId = figure?.getAttribute('aria-labelledby');
		const descId = figure?.getAttribute('aria-describedby');
		const title = screen.container.querySelector(`#${titleId}`);
		const desc = screen.container.querySelector(`#${descId}`);
		expect(title?.textContent).toContain('Jahresmitteltemperatur');
		expect(title?.textContent).toContain('Berlin-Dahlem');
		expect(desc?.textContent).toContain('Berlin-Dahlem');
	});

	it('uses 180px compact hero height per AC-4', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const root = screen.container.querySelector('.lc-root-container');
		expect(root).not.toBeNull();
		const heightPx = root ? parseFloat(getComputedStyle(root).height) : 0;
		expect(heightPx).toBeGreaterThanOrEqual(170);
		expect(heightPx).toBeLessThanOrEqual(190);
	});

	it('renders LayerChart container with SVG layer', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const root = screen.container.querySelector('.lc-root-container');
		expect(root).not.toBeNull();
		const svg = root?.querySelector('svg');
		expect(svg).not.toBeNull();
	});

	it('renders main annual temperature spline (≥ 1 path with data)', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const paths = screen.container.querySelectorAll(
			'.lc-root-container svg path'
		);
		const dataPaths = Array.from(paths).filter(
			(p) => (p.getAttribute('d') ?? '').length > 50
		);
		expect(dataPaths.length).toBeGreaterThanOrEqual(1);
	});

	it('renders rolling-mean line as second series', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const paths = screen.container.querySelectorAll(
			'.lc-root-container svg path'
		);
		const longPaths = Array.from(paths).filter(
			(p) => (p.getAttribute('d') ?? '').length > 50
		);
		expect(longPaths.length).toBeGreaterThanOrEqual(2);
	});

	it('renders narrative markers (default Berlin set within range)', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const markers = screen.container.querySelectorAll(
			'[data-testid="long-view-marker"]'
		);
		expect(markers.length).toBeGreaterThanOrEqual(4);
	});

	it('accepts custom marker list', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem',
			narrativeMarkers: [{ year: 1900, label: 'Custom-Marker' }]
		});
		const markers = screen.container.querySelectorAll(
			'[data-testid="long-view-marker"]'
		);
		expect(markers.length).toBe(1);
		expect(markers[0].textContent).toContain('Custom-Marker');
	});

	it('figcaption shows Min, Max, Latest with °C unit', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const fc = screen.container.querySelector('[data-testid="chart-figcaption"]');
		expect(fc?.textContent).toContain('°C');
		expect(fc?.textContent).toMatch(/Min/);
		expect(fc?.textContent).toMatch(/Latest/);
	});

	it('renders DataTableAlternative toggle for table alternative', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const toggle = screen.container.querySelector('[data-testid="table-toggle"]');
		expect(toggle).not.toBeNull();
	});

	it('renders empty state without crashing on empty series', async () => {
		const screen = render(ClimateLongView, {
			series: [],
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector(
			'[data-testid="climate-long-view-figure"]'
		);
		expect(figure).not.toBeNull();
	});
});
