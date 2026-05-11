import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MapLegend from './map-legend.svelte';

describe('map-legend.svelte', () => {
	it('rendert nicht wenn activeLayers leer', async () => {
		const { container } = render(MapLegend, { activeLayers: [] });
		expect(container.querySelector('[data-testid="map-legend"]')).toBeNull();
	});

	it('rendert pro Layer Name + Min/Max', async () => {
		render(MapLegend, {
			activeLayers: [
				{
					slug: 'mietspiegel',
					name: 'Mietspiegel Wohnlage',
					valueRange: { min: 1, max: 4 },
					scale: 'sequential'
				}
			]
		});
		await expect.element(page.getByTestId('map-legend')).toBeInTheDocument();
		await expect.element(page.getByText('Mietspiegel Wohnlage')).toBeInTheDocument();
		await expect.element(page.getByText('1')).toBeInTheDocument();
		await expect.element(page.getByText('4')).toBeInTheDocument();
	});

	it('Sequential-Scale liefert Gradient-Bar', async () => {
		render(MapLegend, {
			activeLayers: [
				{
					slug: 's1',
					name: 'Seq',
					valueRange: { min: 0, max: 10 },
					scale: 'sequential'
				}
			]
		});
		const bar = (await page.getByTestId('legend-gradient-s1').element()) as HTMLElement;
		expect(bar.style.background).toMatch(/linear-gradient/);
	});

	it('Divergent-Scale: Gradient hat 3 Stops', async () => {
		render(MapLegend, {
			activeLayers: [
				{
					slug: 'd1',
					name: 'Div',
					valueRange: { min: -5, max: 5 },
					scale: 'divergent'
				}
			]
		});
		const bar = (await page.getByTestId('legend-gradient-d1').element()) as HTMLElement;
		expect(bar.style.background).toMatch(/linear-gradient/);
		const stops = (bar.style.background.match(/,/g) || []).length;
		expect(stops).toBeGreaterThanOrEqual(3);
	});

	it('mehrere Layer → mehrere Legenden-Items', async () => {
		render(MapLegend, {
			activeLayers: [
				{ slug: 'a', name: 'A', valueRange: { min: 0, max: 1 }, scale: 'sequential' },
				{ slug: 'b', name: 'B', valueRange: { min: 0, max: 1 }, scale: 'sequential' }
			]
		});
		await expect.element(page.getByText('A')).toBeInTheDocument();
		await expect.element(page.getByText('B')).toBeInTheDocument();
	});
});
