import { error } from '@sveltejs/kit';
import { loadManifest } from '$lib/data/manifest.js';
import { buildLayerDetail, type LayerDetail } from '$lib/data/get-layer-detail.js';
import { getLocale } from '$lib/paraglide/runtime.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const manifest = await loadManifest(fetch);
	const detail: LayerDetail | null = buildLayerDetail(params.slug, getLocale(), manifest);
	if (!detail) error(404, `Layer ${params.slug} nicht gefunden`);
	return { detail };
};
