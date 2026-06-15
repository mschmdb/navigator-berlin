import { normalizeSlug } from '$lib/data/internal/slug.js';
import type { Manifest } from '$lib/data/types.js';

/**
 * Story 2.3 Helper: liest die 12 Bezirks-Slugs aus dem `bezirke`-Layer-GeoJSON.
 *
 * Verwendung: Build-Time (Prerender). SvelteKit ruft `entries()` ohne fetch-Kontext,
 * daher Node-`fs`-Pfad statt `loadManifest(fetch)`.
 *
 * Slug-Konvention spiegelt `scripts/aggregate-data.ts` + `src/lib/server/og/og-pipeline.ts`:
 * `Gemeinde_name` → `normalizeSlug` (kebab-case, Umlaut-Mapping).
 */
export async function readBezirkSlugsFromGeoJson(): Promise<string[]> {
	const { readFile } = await import('node:fs/promises');
	const { resolve: pathResolve } = await import('node:path');

	const manifestPath = pathResolve(process.cwd(), 'static/layers/MANIFEST.json');
	const manifestRaw = await readFile(manifestPath, 'utf-8');
	const manifest = JSON.parse(manifestRaw) as Manifest;
	const layer = manifest.layers.find((l) => l.slug === 'bezirke');
	if (!layer) throw new Error('bezirke-Layer fehlt im MANIFEST.json');

	const geojsonPath = pathResolve(process.cwd(), 'static/layers', layer.filename);
	const geojsonRaw = await readFile(geojsonPath, 'utf-8');
	const fc = JSON.parse(geojsonRaw) as {
		features: { properties?: Record<string, unknown> }[];
	};

	const slugs = new Set<string>();
	for (const feature of fc.features) {
		const props = feature.properties ?? {};
		const name =
			typeof props.Gemeinde_name === 'string'
				? props.Gemeinde_name
				: typeof props.NAME === 'string'
					? props.NAME
					: null;
		if (!name) continue;
		slugs.add(normalizeSlug(name));
	}
	return [...slugs].sort();
}
