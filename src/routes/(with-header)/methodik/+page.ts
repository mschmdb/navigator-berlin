import { loadManifest } from '$lib/data/manifest.js';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ fetch }) => {
	const manifest = await loadManifest(fetch);
	return { manifest };
};
