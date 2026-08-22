/**
 * Server-seitige Brücke kiezSlug → BZR_ID: Die Wahl-Aggregate hängen am
 * disambiguierten Kiez-Slug (Heerstraße!), der Kiez-Finder rechnet auf
 * PLR_IDs, deren Präfix die BZR_ID ist. Die Zuordnung entsteht wie in
 * scripts/fetch-einwohner.ts aus den statischen GeoJSONs (fs, gecacht).
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { FeatureCollection } from 'geojson';
import { buildKiezSlugs } from '$lib/data/internal/kiez-slug.js';

async function loadStaticLayer(repoRoot: string, prefix: string): Promise<FeatureCollection> {
	const dir = path.join(repoRoot, 'static', 'layers');
	const file = (await readdir(dir)).find((f) =>
		new RegExp(`^${prefix}\\.[0-9a-f]+\\.geojson$`).test(f)
	);
	if (!file) throw new Error(`${prefix}-GeoJSON fehlt in ${dir}`);
	return JSON.parse(await readFile(path.join(dir, file), 'utf-8')) as FeatureCollection;
}

let cache: { root: string; value: ReadonlyMap<string, string> } | null = null;

/** kiezSlug → BZR_ID (6-stellig). Leere Map, wenn die GeoJSONs fehlen. */
export async function loadKiezSlugToBzrId(repoRoot: string): Promise<ReadonlyMap<string, string>> {
	if (cache && cache.root === repoRoot) return cache.value;
	let value: ReadonlyMap<string, string>;
	try {
		const [bzrFc, bezirkeFc] = await Promise.all([
			loadStaticLayer(repoRoot, 'lor-bezirksregion'),
			loadStaticLayer(repoRoot, 'bezirke')
		]);
		const bezNames = new Map<string, string>();
		for (const f of bezirkeFc.features) {
			const p = (f.properties ?? {}) as Record<string, unknown>;
			if (typeof p.Gemeinde_schluessel === 'string' && typeof p.Gemeinde_name === 'string') {
				bezNames.set(p.Gemeinde_schluessel.slice(-2), p.Gemeinde_name);
			}
		}
		const props = bzrFc.features.map((f) => (f.properties ?? {}) as Record<string, unknown>);
		const refs = props.map((p) => ({
			name: typeof p.BZR_NAME === 'string' ? p.BZR_NAME : '',
			bezirk: bezNames.get(typeof p.BEZ === 'string' ? p.BEZ : '') ?? ''
		}));
		const slugs = buildKiezSlugs(refs);
		const map = new Map<string, string>();
		props.forEach((p, i) => {
			if (typeof p.BZR_ID === 'string') map.set(slugs[i], p.BZR_ID);
		});
		value = map;
	} catch {
		value = new Map();
	}
	cache = { root: repoRoot, value };
	return value;
}
