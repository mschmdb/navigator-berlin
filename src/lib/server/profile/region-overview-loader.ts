import { getEinwohnerGesamtForScope } from '$lib/data/get-kiez-demografie.js';
import { fetchLayer } from '$lib/data/internal/layer-fetch.js';
import { loadManifest } from '$lib/data/manifest.js';
import { bezirkSlugFromName, type FeatureCollectionLike } from '$lib/data/region-display-names.js';
import { buildRegionOverview, type OverviewBezirk } from '$lib/data/region-overview.js';
import type { Manifest } from '$lib/data/types.js';
import { readRegionComposites } from './meta-sources.js';
import { reportOverviewProblems } from './overview-problems.js';

async function readLayerFeatureCollection(
	manifest: Manifest,
	layerSlug: string,
	fetchFn: typeof fetch
): Promise<FeatureCollectionLike> {
	const layer = manifest.layers.find((l) => l.slug === layerSlug);
	if (!layer) throw new Error(`${layerSlug}-Layer fehlt im MANIFEST.json`);
	return fetchLayer(layer.filename, fetchFn);
}

export interface LoadRegionOverviewOptions {
	/** Einwohnerzahlen laden und fehlende melden (nur `/bezirke` zeigt sie). */
	readonly withEinwohner?: boolean;
	/** Bezeichnung für Warnungen und Strict-Build-Fehler. */
	readonly scope: 'kieze' | 'bezirke';
}

/**
 * Lädt alle Bezirke samt Kiezen für die Übersichtsseiten `/kieze` und `/bezirke`.
 * Namen und Gruppierung kommen aus dem GeoJSON, Scores aus dem statischen Composite-JSON
 * (fehlt es, bleiben die Scores leer), Einwohner optional aus dem Demografie-Payload.
 * Befunde zur Vollständigkeit warnen lokal und brechen den Strict-Build ab.
 */
export async function loadRegionOverview(
	fetchFn: typeof fetch,
	{ withEinwohner = false, scope }: LoadRegionOverviewOptions
): Promise<OverviewBezirk[]> {
	const manifest = await loadManifest(fetchFn);
	const [lorFc, bezirkeFc, composites] = await Promise.all([
		readLayerFeatureCollection(manifest, 'lor-bezirksregion', fetchFn),
		readLayerFeatureCollection(manifest, 'bezirke', fetchFn),
		readRegionComposites()
	]);

	const einwohner = new Map<string, number>();
	if (withEinwohner) {
		const bezirkSlugs = bezirkeFc.features
			.map((f) => f.properties?.Gemeinde_name)
			.filter((n): n is string => typeof n === 'string')
			.map((n) => bezirkSlugFromName(n));
		await Promise.all(
			bezirkSlugs.map(async (slug) => {
				const count = await getEinwohnerGesamtForScope('bezirk', slug, fetchFn);
				if (count !== null) einwohner.set(slug, count);
			})
		);
	}

	const { bezirke, problems } = buildRegionOverview({
		lorFc,
		bezirkeFc,
		composites,
		einwohner,
		requireEinwohner: withEinwohner
	});
	reportOverviewProblems(scope, problems);
	return bezirke;
}
