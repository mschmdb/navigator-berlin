import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import KlimaPetCard from './klima-pet-card.svelte';
import type { LayerHit } from '$lib/data';
import type { NumericMedianAggregate } from '$lib/data/layer-aggregates-types.js';

const hit: LayerHit = {
	layer: 'klima-pet-2022',
	value: { schl5: '0100', pet14h: 40.3 },
	source: '',
	updatedAt: '',
	license: 'dl-de/by-2-0'
};

function agg(median: number, min: number, max: number): NumericMedianAggregate {
	return {
		type: 'numeric-median',
		median,
		min,
		max,
		contributingMembers: 10,
		totalMembers: 10,
		coverage: '10/10'
	};
}

describe('KlimaPetCard', () => {
	it('zeigt Adresswert prominent', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: 'Lichtenrade',
			kiezAggregate: agg(36, 24, 45),
			bezirkName: 'Tempelhof-Schöneberg',
			bezirkAggregate: agg(37, 22, 46),
			berlinAggregate: agg(35.5, 20, 48)
		});
		const val = (await page.getByTestId('pet-address-value').element()) as HTMLElement;
		expect(val.textContent).toContain('40,3');
	});

	it('rendert Score-Bar im Kiez-Kontext', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: 'Lichtenrade',
			kiezAggregate: agg(36, 24, 45),
			bezirkName: 'X',
			bezirkAggregate: null,
			berlinAggregate: null
		});
		await expect.element(page.getByTestId('score-bar')).toBeInTheDocument();
	});

	it('listet verfügbare Kontext-Skalen (Kiez/Bezirk/Berlin) mit Median + Spanne', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: 'Lichtenrade',
			kiezAggregate: agg(36, 24, 45),
			bezirkName: 'Tempelhof-Schöneberg',
			bezirkAggregate: agg(37, 22, 46),
			berlinAggregate: agg(35.5, 20, 48)
		});
		const card = (await page.getByTestId('klima-pet-card').element()) as HTMLElement;
		expect(card.textContent).toContain('Lichtenrade');
		expect(card.textContent).toContain('Tempelhof-Schöneberg');
		expect(card.textContent).toContain('Berlin');
		expect(card.textContent).toContain('36');
	});

	it('kein Punkt-Messwert + Kontext da → Umfeld-Hinweis + Kontext-Zeilen', async () => {
		const noPointHit: LayerHit = {
			layer: 'klima-pet-2022',
			value: {},
			source: '',
			updatedAt: '',
			license: 'dl-de/by-2-0'
		};
		render(KlimaPetCard, {
			hit: noPointHit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: 'Tegel-Süd',
			kiezAggregate: agg(37.3, 25.8, 41),
			bezirkName: 'Reinickendorf',
			bezirkAggregate: agg(36.3, 24.7, 42.6),
			berlinAggregate: agg(36.5, 24.4, 45.2)
		});
		await expect.element(page.getByTestId('pet-address-value')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('pet-no-point-value')).toBeInTheDocument();
		const card = (await page.getByTestId('klima-pet-card').element()) as HTMLElement;
		expect(card.textContent).toContain('Tegel-Süd');
	});

	it('ohne Aggregate: nur Adresswert, kein Score-Bar, kein Crash', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: null,
			kiezAggregate: null,
			bezirkName: null,
			bezirkAggregate: null,
			berlinAggregate: null
		});
		await expect.element(page.getByTestId('pet-address-value')).toBeInTheDocument();
		await expect.element(page.getByTestId('score-bar')).not.toBeInTheDocument();
	});
});
