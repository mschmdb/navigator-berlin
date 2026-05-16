import { describe, it, expect } from 'vitest';
import { resolveResource } from './resolve-resource.js';
import type { GeocodeSuggestion } from '$lib/data';

const SUGGESTION: GeocodeSuggestion = {
	id: 'x',
	displayName: 'Pariser Platz, Mitte, Berlin',
	lat: 52.5163,
	lng: 13.3777,
	type: 'tourism',
	addresstype: 'attraction',
	bezirk: 'Mitte'
};

describe('resolveResource', () => {
	it('löst address-URI auf', () => {
		const result = resolveResource('navigator://address/current', {
			selectedAddress: SUGGESTION,
			activeLayerSlugs: [],
			hiddenLayerSlugs: []
		});
		expect(result?.uri).toBe('navigator://address/current');
		const content = result?.content as Record<string, unknown>;
		expect(content?.display_name).toBe('Pariser Platz, Mitte, Berlin');
	});

	it('löst layers/active-URI auf', () => {
		const result = resolveResource('navigator://layers/active', {
			selectedAddress: null,
			activeLayerSlugs: ['wohnlagen-2024'],
			hiddenLayerSlugs: []
		});
		expect(result?.uri).toBe('navigator://layers/active');
		expect(result?.content).toEqual({ active: ['wohnlagen-2024'], hidden: [] });
	});

	it('liefert null bei unbekanntem-scheme', () => {
		const result = resolveResource('https://example.com/foo', {
			selectedAddress: null,
			activeLayerSlugs: [],
			hiddenLayerSlugs: []
		});
		expect(result).toBeNull();
	});

	it('liefert null bei nicht-supportetem-resource-type', () => {
		// bezirk/kiez-Mirror sind als URI-Pattern verstanden, aber Resource-Read
		// nicht implementiert (Resources sind Mirrors, Profile-Inhalte holt der
		// Agent via Tool `get_kiez_profile`).
		const result = resolveResource('navigator://kiez/regierungsviertel', {
			selectedAddress: null,
			activeLayerSlugs: [],
			hiddenLayerSlugs: []
		});
		expect(result).toBeNull();
	});
});
