import type { PageServerLoad } from './$types';
import { fetchBerlinHeatWarning } from '$lib/server/dwd-warnings.js';
import { loadManifest } from '$lib/data/manifest.js';
import type { LayerFormat } from '$lib/data/types.js';

// Story 16.2: Hitze-Home dynamisch (nicht prerendered), damit die Live-DWD-Warnlage
// pro Request abgerufen wird. fetchBerlinHeatWarning degradiert intern zu null (AC-3).
export const prerender = false;

/** Datengrundlage der Seite: der Kühle-Orte-Layer. */
const KUEHLE_ORTE_LAYER_SLUG = 'kuehle-orte';

export interface HitzeDatasetSource {
	readonly slug: string;
	readonly format: LayerFormat;
	/** `sourceUpdatedAt`, sonst `fetchedAt` aus dem MANIFEST. */
	readonly dateModified: string;
	readonly sourceUrl: string;
}

/** Fehlt das MANIFEST oder der Layer, bleibt die Seite renderbar und das Dataset-JSON-LD entfällt. */
async function loadDatasetSource(fetchFn: typeof fetch): Promise<HitzeDatasetSource | null> {
	try {
		const manifest = await loadManifest(fetchFn);
		const layer = manifest.layers.find((l) => l.slug === KUEHLE_ORTE_LAYER_SLUG);
		if (!layer) return null;
		return {
			slug: layer.slug,
			format: layer.format ?? 'geojson',
			dateModified: layer.sourceUpdatedAt ?? layer.fetchedAt,
			sourceUrl: layer.sourceUrl
		};
	} catch {
		return null;
	}
}

export const load: PageServerLoad = async ({ fetch }) => {
	const [warning, datasetSource] = await Promise.all([
		fetchBerlinHeatWarning(),
		loadDatasetSource(fetch)
	]);
	return { warning, datasetSource };
};
