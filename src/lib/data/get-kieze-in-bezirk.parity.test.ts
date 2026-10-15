import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildKiezeInBezirk } from './get-kieze-in-bezirk.js';
import { normalizeSlug } from './internal/slug.js';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import type { Manifest } from './types.js';

type Fc = { features: { properties?: Record<string, unknown> }[] };

async function loadLayer(manifest: Manifest, slug: string): Promise<Fc> {
	const layer = manifest.layers.find((l) => l.slug === slug);
	if (!layer) throw new Error(`${slug} fehlt im MANIFEST.json`);
	const raw = await readFile(resolve(process.cwd(), 'static/layers', layer.filename), 'utf-8');
	return JSON.parse(raw) as Fc;
}

describe('buildKiezeInBezirk · Parität mit readKiezSlugsFromGeoJson', () => {
	it('liefert über alle Bezirke dieselben Slugs wie die Prerender-Entries', async () => {
		const manifest = JSON.parse(
			await readFile(resolve(process.cwd(), 'static/layers/MANIFEST.json'), 'utf-8')
		) as Manifest;
		const [lor, bezirke] = await Promise.all([
			loadLayer(manifest, 'lor-bezirksregion'),
			loadLayer(manifest, 'bezirke')
		]);
		const codeToSlug = new Map<string, string>();
		for (const f of bezirke.features) {
			const key = f.properties?.Schluessel_gesamt;
			const name = f.properties?.Gemeinde_name;
			if (typeof key === 'string' && typeof name === 'string') {
				codeToSlug.set(key.slice(-2), normalizeSlug(name));
			}
		}
		const slugs = new Set<string>();
		for (const bezirkSlug of new Set(codeToSlug.values())) {
			const refs = buildKiezeInBezirk({
				lorFeatureCollection: lor,
				bezirkCodeToSlug: codeToSlug,
				scores: new Map(),
				bezirkSlug
			});
			for (const r of refs) slugs.add(r.slug);
		}
		expect([...slugs].sort()).toEqual(await readKiezSlugsFromGeoJson());
	});
});
