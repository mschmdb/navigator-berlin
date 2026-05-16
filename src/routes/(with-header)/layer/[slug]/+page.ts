import { error } from '@sveltejs/kit';
import { loadManifest } from '$lib/data/manifest.js';
import { buildLayerDetail, type LayerDetail } from '$lib/data/get-layer-detail.js';
import { getLocale } from '$lib/paraglide/runtime.js';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

/**
 * Story 2.1 T6: enumerate all layer slugs from MANIFEST.json at build time so
 * every `/layer/{slug}` page is prerendered. The manifest is loaded via Node's
 * `fs` import here (build-time) because SvelteKit calls `entries` without a
 * `fetch` context.
 */
export const entries: EntryGenerator = async () => {
	const { readFile } = await import('node:fs/promises');
	const { resolve: pathResolve } = await import('node:path');
	const manifestPath = pathResolve(process.cwd(), 'static/layers/MANIFEST.json');
	const raw = await readFile(manifestPath, 'utf-8');
	const manifest = JSON.parse(raw) as { layers: { slug: string }[] };
	return manifest.layers.map((l) => ({ slug: l.slug }));
};

export const load: PageLoad = async ({ params, fetch }) => {
	const manifest = await loadManifest(fetch);
	const detail: LayerDetail | null = buildLayerDetail(params.slug, getLocale(), manifest);
	if (!detail) error(404, `Layer ${params.slug} nicht gefunden`);
	return { detail };
};
