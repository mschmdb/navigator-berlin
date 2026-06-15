/**
 * Resource `navigator://address/{ref}`: Spiegel der aktuell im Inspector
 * aktiven Adresse. Pure-Read aus dem UI-Context.
 */

import type { WebMcpResourceRead } from './resource-types.js';
import type { JsonObject } from '../internal/json-types.js';
import type { GeocodeSuggestion } from '$lib/data';

export interface ActiveAddressReadInput {
	readonly uri: string;
	readonly selectedAddress: GeocodeSuggestion | null;
}

export function readActiveAddressResource(input: ActiveAddressReadInput): WebMcpResourceRead {
	const sa = input.selectedAddress;
	if (!sa) {
		return { uri: input.uri, mimeType: 'application/json', content: null };
	}
	const content: JsonObject = {
		display_name: sa.displayName,
		lat: sa.lat,
		lng: sa.lng
	};
	if (sa.bezirk) content.bezirk = sa.bezirk;
	if (sa.kiez) content.kiez = sa.kiez;
	if (sa.postcode) content.postcode = sa.postcode;
	return { uri: input.uri, mimeType: 'application/json', content };
}
