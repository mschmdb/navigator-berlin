import { getKiezNeighborLists, readLayer } from '$lib/server/kiez-neighbors-index.js';
import {
	buildRegionOutline,
	type OutlineRegion,
	type RegionOutline
} from '$lib/seo/region-outline-svg.js';
import { bezirkSlugFromName, cleanName } from '$lib/data/region-display-names.js';
import { neighborBezirke } from './bezirk-neighbors';

let berlinOutlineCache: Promise<RegionOutline | null> | null = null;

/** Alle 12 Bezirke als Umriss: der eigene Bezirk klein in der Berlin-Karte. Einmal pro Prozess. */
export function readBerlinBezirkeOutline(): Promise<RegionOutline | null> {
	berlinOutlineCache ??= (async () => {
		const fc = await readLayer('bezirke');
		const regions: OutlineRegion[] = [];
		for (const f of fc.features) {
			const n = f.properties?.Gemeinde_name;
			const g = f.geometry as OutlineRegion['geometry'] | null | undefined;
			if (typeof n === 'string' && g && (g.type === 'Polygon' || g.type === 'MultiPolygon')) {
				regions.push({ id: bezirkSlugFromName(cleanName(n)), geometry: g });
			}
		}
		return buildRegionOutline(regions);
	})().catch((err) => {
		berlinOutlineCache = null;
		throw err;
	});
	return berlinOutlineCache;
}

/** Nachbarbezirke über die Kiez-Nachbarschaften (vorhandener Index), als Slugs. */
export async function loadNeighborBezirkSlugs(
	bezirkSlug: string,
	bezirkName: string,
	ownKiezSlugs: readonly string[]
): Promise<string[]> {
	const lists = new Map(
		await Promise.all(ownKiezSlugs.map(async (s) => [s, await getKiezNeighborLists(s)] as const))
	);
	return neighborBezirke(ownKiezSlugs, bezirkName, (s) => lists.get(s)?.neighbors ?? [])
		.map(bezirkSlugFromName)
		.filter((s) => s !== bezirkSlug);
}
