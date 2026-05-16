import { describe, it, expect } from 'vitest';
import { readActiveAddressResource } from './active-address.js';
import type { GeocodeSuggestion } from '$lib/data';

const SUGGESTION: GeocodeSuggestion = {
	id: 'x',
	displayName: 'Pariser Platz, Mitte, Berlin',
	lat: 52.5163,
	lng: 13.3777,
	type: 'tourism',
	addresstype: 'attraction',
	bezirk: 'Mitte',
	kiez: 'Regierungsviertel',
	postcode: '10117'
};

describe('readActiveAddressResource', () => {
	it('mirror UI-Adress-State', () => {
		const result = readActiveAddressResource({
			uri: 'navigator://address/current',
			selectedAddress: SUGGESTION
		});
		expect(result.uri).toBe('navigator://address/current');
		expect(result.mimeType).toBe('application/json');
		expect(result.content).toMatchObject({
			display_name: 'Pariser Platz, Mitte, Berlin',
			lat: 52.5163,
			lng: 13.3777,
			bezirk: 'Mitte',
			kiez: 'Regierungsviertel',
			postcode: '10117'
		});
	});

	it('liefert null-content wenn keine Adresse selected', () => {
		const result = readActiveAddressResource({
			uri: 'navigator://address/current',
			selectedAddress: null
		});
		expect(result.content).toBeNull();
	});
});
