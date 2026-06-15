/**
 * Resource-Resolver: nimmt eine `navigator://`-URI + einen Snapshot des
 * UI-Zustands und liefert den passenden Resource-Read.
 *
 * Pure-Function. Keine Side-Effects, keine Store-Reads (die müssen vor
 * dem Aufruf erfolgen, damit Tests deterministisch bleiben).
 */

import { parseResourceUri } from '../internal/uri-parser.js';
import { readActiveAddressResource } from './active-address.js';
import { readLoadedLayersResource } from './loaded-layers.js';
import type { WebMcpResourceRead } from './resource-types.js';
import type { GeocodeSuggestion } from '$lib/data';

export interface ResourceContext {
	readonly selectedAddress: GeocodeSuggestion | null;
	readonly activeLayerSlugs: readonly string[];
	readonly hiddenLayerSlugs: readonly string[];
}

export function resolveResource(uri: string, ctx: ResourceContext): WebMcpResourceRead | null {
	const ref = parseResourceUri(uri);
	if (!ref) return null;
	switch (ref.type) {
		case 'address':
			return readActiveAddressResource({
				uri,
				selectedAddress: ctx.selectedAddress
			});
		case 'layers':
			return readLoadedLayersResource({
				uri,
				activeLayerSlugs: ctx.activeLayerSlugs,
				hiddenLayerSlugs: ctx.hiddenLayerSlugs
			});
		case 'bezirk':
		case 'kiez':
			// Profile-Inhalte holt der Agent via Tool `get_kiez_profile` /
			// `get_bezirk_profile`. Resources sind nur Mirrors aus UI-State.
			return null;
	}
}
