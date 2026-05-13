import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AccessibleChart from './accessible-chart.svelte';

const SERIES = [
	{ year: 2000, value: 10 },
	{ year: 2001, value: 12 },
	{ year: 2002, value: 14 },
	{ year: 2003, value: 18 }
];

describe('AccessibleChart', () => {
	it('rendert figure mit role=img und aria-labelledby/-describedby auf die internen IDs', async () => {
		const screen = render(AccessibleChart, {
			chartId: 'spark-summer',
			title: 'Sommertage',
			description: 'Sparkline Sommertage 2000-2003.',
			series: SERIES,
			figcaption: 'Min: 10 · Max: 18 · Latest: 18',
			tableCaption: 'Sommertage tabellarisch'
		});
		const figure = screen.container.querySelector('[data-testid="accessible-chart"]');
		expect(figure).not.toBeNull();
		expect(figure?.getAttribute('role')).toBe('img');
		expect(figure?.getAttribute('aria-labelledby')).toBe('chart-title-spark-summer');
		expect(figure?.getAttribute('aria-describedby')).toBe('chart-desc-spark-summer');

		const title = figure?.querySelector('svg title');
		const desc = figure?.querySelector('svg desc');
		expect(title?.id).toBe('chart-title-spark-summer');
		expect(title?.textContent).toBe('Sommertage');
		expect(desc?.id).toBe('chart-desc-spark-summer');
		expect(desc?.textContent).toBe('Sparkline Sommertage 2000-2003.');
	});

	it('zeigt figcaption mit Plex-Mono-Stats', async () => {
		const screen = render(AccessibleChart, {
			chartId: 'spark-fc',
			title: 'X',
			description: 'Y',
			series: SERIES,
			figcaption: 'Min: 10 · Max: 18 · Latest: 18',
			tableCaption: 'X tabellarisch'
		});
		const caption = screen.container.querySelector('[data-testid="chart-figcaption"]');
		expect(caption?.textContent).toContain('Min: 10');
		expect(caption?.textContent).toContain('Latest: 18');
		expect(caption?.className).toContain('font-mono');
	});

	it('hat Tabellen-Toggle und sortiert Jahr DESC by default', async () => {
		const screen = render(AccessibleChart, {
			chartId: 'spark-toggle',
			title: 'X',
			description: 'Y',
			series: SERIES,
			figcaption: 'X',
			tableCaption: 'Sommertage tabellarisch'
		});
		await screen.getByTestId('table-toggle').click();
		const rows = screen.container.querySelectorAll('tbody tr');
		expect(rows.length).toBe(4);
		expect(rows[0].textContent).toContain('2003');
		expect(rows[3].textContent).toContain('2000');
	});

	it('Pfeil-Rechts setzt focusedIndex auf 0 wenn vorher -1', async () => {
		const screen = render(AccessibleChart, {
			chartId: 'spark-kbd',
			title: 'X',
			description: 'Y',
			series: SERIES,
			figcaption: 'X',
			tableCaption: 'tab'
		});
		const figure = screen.container.querySelector(
			'[data-testid="accessible-chart"]'
		) as HTMLElement;
		figure.focus();
		figure.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		await new Promise((r) => setTimeout(r, 10));
		expect(figure.getAttribute('data-focused-index')).toBe('0');
	});

	it('End-Taste springt zu letztem Datapoint, Home-Taste zum ersten', async () => {
		const screen = render(AccessibleChart, {
			chartId: 'spark-homend',
			title: 'X',
			description: 'Y',
			series: SERIES,
			figcaption: 'X',
			tableCaption: 'tab'
		});
		const figure = screen.container.querySelector(
			'[data-testid="accessible-chart"]'
		) as HTMLElement;
		figure.focus();
		figure.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
		await new Promise((r) => setTimeout(r, 10));
		expect(figure.getAttribute('data-focused-index')).toBe('3');
		figure.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
		await new Promise((r) => setTimeout(r, 10));
		expect(figure.getAttribute('data-focused-index')).toBe('0');
	});

	it('rendert leere Serie ohne Crash', async () => {
		const screen = render(AccessibleChart, {
			chartId: 'spark-empty',
			title: 'X',
			description: 'Y',
			series: [],
			figcaption: '–',
			tableCaption: 'leer'
		});
		const figure = screen.container.querySelector('[data-testid="accessible-chart"]');
		expect(figure).not.toBeNull();
	});
});
