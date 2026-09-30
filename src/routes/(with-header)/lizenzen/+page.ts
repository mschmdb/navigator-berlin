import { loadManifest } from '$lib/data/manifest.js';
import { buildLayerDetail } from '$lib/data/get-layer-detail.js';
import { pickDatasetDescription } from '$lib/seo/dataset-description.js';
import type { DataCatalogDatasetRef } from '$lib/seo/jsonld-datacatalog.js';
import { localizedPathname } from '$lib/seo/canonical.js';
import { getLocale } from '$lib/paraglide/runtime';
import { m } from '$lib/paraglide/messages.js';
import type { PageLoad } from './$types';

export const prerender = true;

/**
 * Baut die DataCatalog-Dataset-Refs build-time aus den Layer-Details. Nur Layer
 * mit oeffentlicher Detail-Page (`buildLayerDetail` != null) kommen rein: Build-
 * only-Layer haben keine `/layer/<slug>`-Page, ihr `@id` wuerde sonst auf eine
 * 404-URL zeigen. `description` aus `explain.short` (Pflichtfeld fuer Schema.org-
 * Dataset, GSC 2026-05-29), `creatorName` aus `methodology.authority`.
 *
 * i18n Block D1: Das DataCatalog-JSON-LD folgt der Seiten-Locale. Name,
 * Beschreibung und Behörde kommen in der Locale von `getLocale()`, die
 * Dataset-URLs zeigen auf `/en/layer/...`, sobald die Seite `/en` ist.
 */
export const load: PageLoad = async ({ fetch, url }) => {
	// Abhängigkeit auf `url`: `/lizenzen` und `/en/lizenzen` laden bei Client-Navigation neu.
	void url.pathname;
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
					m.lizenzen_datacatalog_dataset_fallback({ layerName: detail.layerName }, { locale })
				),
				urlPath: localizedPathname(`/layer/${layer.slug}`, locale),
				license: layer.license,
				creatorName: detail.methodology?.authority
			};
		})
		.filter((ref): ref is DataCatalogDatasetRef => ref !== null);

	return { manifest, catalogDatasets };
};
