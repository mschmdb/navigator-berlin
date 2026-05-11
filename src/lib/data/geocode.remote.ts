import { query } from '$app/server';
import * as v from 'valibot';
import { proxyNominatim, reverseGeocode } from '$lib/server/geocode';
import type { GeocodeSuggestion } from './types.js';

export const geocodeAddress = query(
	v.object({ q: v.pipe(v.string(), v.minLength(2), v.maxLength(120)) }),
	async ({ q }): Promise<GeocodeSuggestion[]> => proxyNominatim(q, 'de')
);

export const reverseGeocodeAddress = query(
	v.object({
		lat: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
		lng: v.pipe(v.number(), v.minValue(-180), v.maxValue(180))
	}),
	async ({ lat, lng }): Promise<GeocodeSuggestion | null> => reverseGeocode(lat, lng, 'de')
);
