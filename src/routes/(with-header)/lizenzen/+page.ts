import { loadManifest } from '$lib/data/manifest.js';
import { buildLayerDetail } from '$lib/data/get-layer-detail.js';
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
 *
 * i18n Block C2 (spec-i18n-c2-layer-methodik.md): Das DataCatalog-JSON-LD
 * bleibt bis zur Registrierung vollstaendig DE (Boundary "B4b-Linie"), auch
 * auf `/en/lizenzen`. `buildLayerDetail` bekommt deshalb bewusst `'de'` fest
 * statt der Seiten-Locale -- ein `getLocale()`-Aufruf hier wuerde auf
 * `/en/lizenzen` (prerendert) sonst Name, Beschreibung und Behoerde englisch
 * ins JSON-LD durchsickern lassen, analog zum Fix auf `/layer/[slug]`
 * (`deLayerName`/`deExplain`/`deMethodology`).
 */
export const load: PageLoad = async ({ fetch }) => {
	const manifest = await loadManifest(fetch);

	const catalogDatasets: DataCatalogDatasetRef[] = manifest.layers
		.map((layer): DataCatalogDatasetRef | null => {
			const detail = buildLayerDetail(layer.slug, 'de', manifest);
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
