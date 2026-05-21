import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import LayerCard from './layer-card.svelte';
import type { LayerHit } from '$lib/data';

const hit: LayerHit = {
	layer: 'laerm-2023',
	value: { plr_id: '01100101', plr_name: 'Stülerstraße', kategorie: 'gering' },
	source: '',
	updatedAt: '',
	license: 'dl-de/by-2-0'
};

describe('LayerCard', () => {
	it('zeigt Adress-Wert-Chip', async () => {
		render(LayerCard, { hit, layerName: 'Lärmbelastung 2023', contextRows: [] });
		await expect.element(page.getByTestId('value-chip')).toBeInTheDocument();
	});

	it('rendert vorgebaute Kontext-Zeilen (label + text)', async () => {
		render(LayerCard, {
			hit,
			layerName: 'Lärmbelastung 2023',
			contextRows: [
				{ label: 'Parkviertel', text: 'meist mittel (66.7%)' },
				{ label: 'Mitte', text: 'meist hoch (53.1%)' },
				{ label: 'Berlin', text: 'meist mittel (50%)' }
			]
		});
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		expect(card.textContent).toContain('Parkviertel');
		expect(card.textContent).toContain('meist mittel (66.7%)');
	});

	it('ohne Kontext-Zeilen: nur Chip, keine dl', async () => {
		render(LayerCard, { hit, layerName: 'Lärmbelastung 2023', contextRows: [] });
		await expect.element(page.getByTestId('value-chip')).toBeInTheDocument();
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		expect(card.querySelector('dl')).toBeNull();
	});

	it('Details-Collapsible togglet Quelle/Beschreibung', async () => {
		render(LayerCard, {
			hit,
			layerName: 'Lärmbelastung 2023',
			contextRows: [{ label: 'Parkviertel', text: 'meist mittel (66.7%)' }]
		});
		await expect.element(page.getByTestId('card-details')).not.toBeInTheDocument();
		await page.getByTestId('card-details-toggle').click();
		await expect.element(page.getByTestId('card-details')).toBeInTheDocument();
	});
});
