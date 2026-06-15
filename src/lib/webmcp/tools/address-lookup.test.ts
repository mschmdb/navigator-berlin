import { describe, it, expect, vi } from 'vitest';
import { createAddressLookupTool } from './address-lookup.js';
import type { GeocodeSuggestion } from '$lib/data';

const FIXTURE_SUGGESTIONS: GeocodeSuggestion[] = [
	{
		id: 'n1',
		displayName: 'Brandenburger Tor, Mitte, Berlin',
		lat: 52.5163,
		lng: 13.3777,
		type: 'tourism',
		addresstype: 'attraction',
		bezirk: 'Mitte',
		kiez: 'Regierungsviertel',
		postcode: '10117'
	},
	{
		id: 'n2',
		displayName: 'Brandenburger Straße, Spandau, Berlin',
		lat: 52.5,
		lng: 13.2,
		type: 'highway',
		addresstype: 'road',
		bezirk: 'Spandau'
	}
];

describe('address-lookup tool', () => {
	it('hat einen snake_case name', () => {
		const tool = createAddressLookupTool({
			geocode: vi.fn(async () => [])
		});
		expect(tool.name).toBe('address_lookup');
	});

	it('hat eine englische description', () => {
		const tool = createAddressLookupTool({
			geocode: vi.fn(async () => [])
		});
		expect(tool.description).toMatch(/Berlin/i);
		expect(tool.description.length).toBeGreaterThan(10);
	});

	it('delegiert an geocode-Funktion', async () => {
		const geocode = vi.fn(async () => FIXTURE_SUGGESTIONS);
		const tool = createAddressLookupTool({ geocode });
		await tool.handler({ query: 'Brandenburger' });
		expect(geocode).toHaveBeenCalledWith('Brandenburger');
	});

	it('mappt camelCase → snake_case im Output', async () => {
		const tool = createAddressLookupTool({
			geocode: async () => FIXTURE_SUGGESTIONS
		});
		const out = (await tool.handler({ query: 'Brandenburger' })) as Array<Record<string, unknown>>;
		expect(Array.isArray(out)).toBe(true);
		expect(out[0]).toMatchObject({
			display_name: 'Brandenburger Tor, Mitte, Berlin',
			lat: 52.5163,
			lng: 13.3777,
			bezirk: 'Mitte',
			kiez: 'Regierungsviertel',
			postcode: '10117'
		});
		// kein internes `id`-Feld leakt durch
		expect(out[0]).not.toHaveProperty('id');
		expect(out[0]).not.toHaveProperty('displayName');
	});

	it('limitiert Output auf limit-Param', async () => {
		const tool = createAddressLookupTool({
			geocode: async () => FIXTURE_SUGGESTIONS
		});
		const out = (await tool.handler({ query: 'Brandenburger', limit: 1 })) as unknown[];
		expect(out).toHaveLength(1);
	});

	it('validiert Input (zu-kurze-Query wirft)', async () => {
		const tool = createAddressLookupTool({
			geocode: async () => []
		});
		await expect(tool.handler({ query: 'a' })).rejects.toThrow();
	});
});
