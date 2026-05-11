import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AddressSearch from './address-search.svelte';
import type { GeocodeSuggestion } from '$lib/data';

const mockSuggestions: GeocodeSuggestion[] = [
	{
		id: 'way-100001',
		displayName: 'Brandenburger Tor, Mitte, Berlin',
		lat: 52.5163,
		lng: 13.3777,
		type: 'attraction',
		addresstype: 'tourism',
		bezirk: 'Mitte',
		postcode: '10117'
	},
	{
		id: 'way-200002',
		displayName: 'Pariser Platz, Mitte, Berlin',
		lat: 52.5163,
		lng: 13.3779,
		type: 'primary',
		addresstype: 'road',
		bezirk: 'Mitte',
		postcode: '10117'
	}
];

afterEach(() => vi.restoreAllMocks());

describe('address-search.svelte', () => {
	it('rendert Combobox-Input mit Placeholder', async () => {
		render(AddressSearch, {
			variant: 'hero',
			placeholder: 'Adresse eingeben',
			geocode: async () => []
		});
		const input = page.getByRole('combobox');
		await expect.element(input).toBeInTheDocument();
		const el = (await input.element()) as HTMLInputElement;
		expect(el.placeholder).toBe('Adresse eingeben');
	});

	it('variant hero hat text-xl Klasse', async () => {
		render(AddressSearch, { variant: 'hero', geocode: async () => [] });
		const input = (await page.getByRole('combobox').element()) as HTMLInputElement;
		expect(input.className).toMatch(/text-xl/);
	});

	it('variant header hat text-base + Search-Icon', async () => {
		render(AddressSearch, { variant: 'header', geocode: async () => [] });
		const input = (await page.getByRole('combobox').element()) as HTMLInputElement;
		expect(input.className).toMatch(/text-base/);
		await expect.element(page.getByTestId('search-icon')).toBeInTheDocument();
	});

	it('zeigt Empty-State unter 2 Zeichen NICHT', async () => {
		render(AddressSearch, {
			variant: 'hero',
			geocode: async () => [],
			initialQuery: 'a'
		});
		await expect.element(page.getByTestId('address-search-empty')).not.toBeInTheDocument();
	});

	it('ruft geocode mit Query nach Debounce auf', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		const geocode = vi.fn(async () => mockSuggestions);
		render(AddressSearch, { variant: 'hero', geocode, initialQuery: 'Brand' });
		await vi.advanceTimersByTimeAsync(300);
		expect(geocode).toHaveBeenCalledWith('Brand');
		vi.useRealTimers();
	});
});
