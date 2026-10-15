import { loadManifest } from '$lib/data/manifest.js';
import { layersOutsideBundles, type LayerOverviewSource } from '$lib/data/layer-overview.js';
import { reportOverviewProblems } from '$lib/server/profile/overview-problems.js';
import type { PageServerLoad } from './$types';

export const prerender = true;

export type DatenOverviewData = {
	readonly layers: readonly LayerOverviewSource[];
};

/**
 * Nur die Felder, die Gruppierung und Detailseiten-Filter brauchen. Namen und
 * Kurztexte löst die Seite in der Seiten-Locale auf.
 */
export const load: PageServerLoad = async ({ fetch }) => {
	const manifest = await loadManifest(fetch);
	const orphans = layersOutsideBundles(manifest.layers);
	reportOverviewProblems(
		'daten',
		orphans.length > 0 ? [`Layer ohne bekannte Themengruppe: ${orphans.join(', ')}.`] : []
	);
	const data: DatenOverviewData = {
		layers: manifest.layers.map(({ slug, bundleGroup, inspectorRelevant, mapRelevant }) => ({
			slug,
			bundleGroup,
			inspectorRelevant,
			mapRelevant
		}))
	};
	return data;
};
