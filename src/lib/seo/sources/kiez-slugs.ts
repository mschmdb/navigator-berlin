import { normalizeSlug } from '$lib/data/internal/slug.js';
import type { Manifest } from '$lib/data/types.js';

/**
 * Story 2.4 Helper: liest die 143 Kiez-Slugs (LOR-Bezirksregionen 2021) aus
 * `lor-bezirksregion`-GeoJSON. Build-Time-Pfad via Node-`fs` weil
 * SvelteKit `entries()` ohne fetch-Kontext aufruft.
 *
 * Slug-Konvention spiegelt `scripts/aggregate-data.ts` + 2.9a + og-pipeline:
 * `BZR_NAME` → `normalizeSlug` (kebab-case, Umlaut-Mapping).
 */
export async function readKiezSlugsFromGeoJson(): Promise<string[]> {
	const { readFile } = await import('node:fs/promises');
	const { resolve: pathResolve } = await import('node:path');

	const manifestPath = pathResolve(process.cwd(), 'static/layers/MANIFEST.json');
	const manifestRaw = await readFile(manifestPath, 'utf-8');
	const manifest = JSON.parse(manifestRaw) as Manifest;
	const layer = manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
	if (!layer) throw new Error('lor-bezirksregion-Layer fehlt im MANIFEST.json');

	const geojsonPath = pathResolve(process.cwd(), 'static/layers', layer.filename);
	const geojsonRaw = await readFile(geojsonPath, 'utf-8');
	const fc = JSON.parse(geojsonRaw) as {
		features: { properties?: Record<string, unknown> }[];
	};

	const slugs = new Set<string>();
	for (const feature of fc.features) {
		const props = feature.properties ?? {};
		const name =
			typeof props.BZR_NAME === 'string'
				? props.BZR_NAME
				: typeof props.NAME === 'string'
					? props.NAME
					: null;
		if (!name) continue;
		slugs.add(normalizeSlug(name));
	}
	return [...slugs].sort();
}
