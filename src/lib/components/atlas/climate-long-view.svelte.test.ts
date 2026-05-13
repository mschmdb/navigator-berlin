import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ClimateLongView from './climate-long-view.svelte';
import type { YearValue } from '$lib/data';

function buildSeries(): YearValue[] {
	const out: YearValue[] = [];
	for (let y = 1719; y <= 2024; y++) {
		out.push({ year: y, temp: 8 + (y - 1719) * 0.005 + Math.sin(y) * 0.3 });
	}
	return out;
}

const SERIES = buildSeries();

describe('ClimateLongView', () => {
	it('rendert figure mit Dahlem-Title', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const title = screen.container.querySelector('svg title');
		expect(title?.textContent).toContain('Jahresmitteltemperatur');
		expect(title?.textContent).toContain('Berlin-Dahlem');
	});

	it('rendert default Berlin-Narrative-Markers (6)', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const markers = screen.container.querySelectorAll('[data-testid="long-view-marker"]');
		expect(markers.length).toBe(6);
	});

	it('akzeptiert Custom-Marker-Liste', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem',
			narrativeMarkers: [{ year: 1800, label: 'Custom' }]
		});
		const markers = screen.container.querySelectorAll('[data-testid="long-view-marker"]');
		expect(markers.length).toBe(1);
		expect(markers[0].textContent).toContain('Custom');
	});

	it('zeichnet 30-Jahr-Mittel als sekundäre Path-Linie', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const rolling = screen.container.querySelector('path[data-testid="long-view-rolling"]');
		expect(rolling).not.toBeNull();
	});

	it('zeichnet Haupt-Temperatur-Linie', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const line = screen.container.querySelector('path[data-testid="long-view-line"]');
		expect(line).not.toBeNull();
		expect(line?.getAttribute('d')?.length ?? 0).toBeGreaterThan(50);
	});

	it('rendert Höhe 280px (Hero-Chart)', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const svg = screen.container.querySelector('svg');
		expect(svg?.getAttribute('height')).toBe('280');
	});

	it('figcaption nennt °C als Einheit', async () => {
		const screen = render(ClimateLongView, {
			series: SERIES,
			stationName: 'Berlin-Dahlem'
		});
		const fc = screen.container.querySelector('[data-testid="chart-figcaption"]');
		expect(fc?.textContent).toContain('°C');
	});

	it('rendert auch bei leerer Serie ohne Crash', async () => {
		const screen = render(ClimateLongView, {
			series: [],
			stationName: 'Berlin-Dahlem'
		});
		const figure = screen.container.querySelector('[data-testid="accessible-chart"]');
		expect(figure).not.toBeNull();
	});
});
