import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MapLegend from './map-legend.svelte';

describe('map-legend.svelte', () => {
	it('rendert nicht wenn activeLayerSlugs leer', async () => {
		const { container } = render(MapLegend, { activeLayerSlugs: [] });
		expect(container.querySelector('[data-testid="map-legend"]')).toBeNull();
	});

	it('rendert categorical-Legend für choropleth-belastung-3 (laerm-2023)', async () => {
		render(MapLegend, { activeLayerSlugs: ['laerm-2023'] });
		await expect.element(page.getByTestId('map-legend')).toBeInTheDocument();
		await expect.element(page.getByTestId('legend-laerm-2023')).toBeInTheDocument();
		await expect.element(page.getByText('Lärmbelastung (Umweltatlas 2023)')).toBeInTheDocument();
		await expect.element(page.getByText('gering')).toBeInTheDocument();
		await expect.element(page.getByText('mittel')).toBeInTheDocument();
		await expect.element(page.getByText('hoch')).toBeInTheDocument();
	});

	it('rendert gradient-Legend mit Range-Labels (choropleth-pet)', async () => {
		render(MapLegend, { activeLayerSlugs: ['klima-pet-2022'] });
		await expect.element(page.getByText('Gefühlte Temperatur (PET 14 Uhr, 2022)')).toBeInTheDocument();
		await expect.element(page.getByText('kühl')).toBeInTheDocument();
		await expect.element(page.getByText('heiß')).toBeInTheDocument();
	});

	it('rendert Wohnlage-Choropleth (3 Klassen)', async () => {
		render(MapLegend, { activeLayerSlugs: ['wohnlagen-2024'] });
		await expect.element(page.getByText('Mietspiegel-Wohnlage 2024')).toBeInTheDocument();
		await expect.element(page.getByText('gut')).toBeInTheDocument();
		await expect.element(page.getByText('mittel')).toBeInTheDocument();
		await expect.element(page.getByText('einfach')).toBeInTheDocument();
	});

	it('mehrere Layer → mehrere Legenden-Sektionen', async () => {
		render(MapLegend, { activeLayerSlugs: ['bezirke', 'laerm-2023', 'ubahn-stationen'] });
		await expect.element(page.getByTestId('legend-bezirke')).toBeInTheDocument();
		await expect.element(page.getByTestId('legend-laerm-2023')).toBeInTheDocument();
		await expect.element(page.getByTestId('legend-ubahn-stationen')).toBeInTheDocument();
	});

	it('ÖPNV-Layer rendert point-marker', async () => {
		render(MapLegend, { activeLayerSlugs: ['sbahn-stationen'] });
		await expect.element(page.getByText('S-Bahn-Station', { exact: true })).toBeInTheDocument();
	});
});
