/**
 * Resource `navigator://layers/active`: aktuell aktive + soft-hidden Layer-Slugs
 * (Mirror aus UI-Context).
 */

import type { WebMcpResourceRead } from './resource-types.js';

export interface LoadedLayersReadInput {
	readonly uri: string;
	readonly activeLayerSlugs: readonly string[];
	readonly hiddenLayerSlugs: readonly string[];
}

export function readLoadedLayersResource(
	input: LoadedLayersReadInput
): WebMcpResourceRead {
	return {
		uri: input.uri,
		mimeType: 'application/json',
		content: {
			active: [...input.activeLayerSlugs],
			hidden: [...input.hiddenLayerSlugs]
		}
	};
}
