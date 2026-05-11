import { query } from '$app/server';
import * as v from 'valibot';
import { proxyNominatim } from '$lib/server/geocode';
import type { GeocodeSuggestion } from './types.js';

export const geocodeAddress = query(
	v.object({ q: v.pipe(v.string(), v.minLength(2), v.maxLength(120)) }),
	async ({ q }): Promise<GeocodeSuggestion[]> => proxyNominatim(q, 'de')
);
