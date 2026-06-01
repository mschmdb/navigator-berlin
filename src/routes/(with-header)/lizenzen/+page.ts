import { loadManifest } from '$lib/data/manifest.js';
import { buildLayerDetail } from '$lib/data/get-layer-detail.js';
import { getLocale } from '$lib/paraglide/runtime.js';
import { pickDatasetDescription } from '$lib/seo/dataset-description.js';
import type { DataCatalogDatasetRef } from '$lib/seo/jsonld-datacatalog.js';
import type { PageLoad } from './$types';

export const prerender = true;

/**
 * Baut die DataCatalog-Dataset-Refs build-time aus den Layer-Details. Nur Layer
 * mit oeffentlicher Detail-Page (`buildLayerDetail` != null) kommen rein: Build-
 * only-Layer haben keine `/layer/<slug>`-Page, ihr `@id` wuerde sonst auf eine
 * 404-URL zeigen. `description` aus `explain.short` (Pflichtfeld fuer Schema.org-
 * Dataset, GSC 2026-05-29), `creatorName` aus `methodology.authority`.
 */
export const load: PageLoad = async ({ fetch }) => {
	const manifest = await loadManifest(fetch);
	const locale = getLocale();

	const catalogDatasets: DataCatalogDatasetRef[] = manifest.layers
		.map((layer): DataCatalogDatasetRef | null => {
			const detail = buildLayerDetail(layer.slug, locale, manifest);
			if (!detail) return null;
			return {
				name: detail.layerName,
				description: pickDatasetDescription(
					[detail.explain.short, detail.explain.long],
					`Geo-Datensatz ${detail.layerName} in Berlin im Daten-Atlas navigator.berlin.`
				),
				urlPath: `/layer/${layer.slug}`,
				license: layer.license,
				creatorName: detail.methodology?.authority
			};
		})
		.filter((ref): ref is DataCatalogDatasetRef => ref !== null);

	return { manifest, catalogDatasets };
};
