import type { RequestHandler } from './$types';
import {
	loadDefaultOgFonts,
	renderOgCardPng,
	validateOgParams
} from '$lib/utils/og-card-renderer.js';

const CACHE_HEADER = 'public, max-age=86400, immutable';
const CONTENT_TYPE = 'image/png';

function staticDir(): string {
	return `${process.cwd()}/static`;
}

export const GET: RequestHandler = async ({ url }) => {
	const validation = validateOgParams(url.searchParams);
	if (!validation.ok) {
		return new Response(validation.error, { status: 400 });
	}

	try {
		const fonts = await loadDefaultOgFonts(staticDir());
		const png = await renderOgCardPng(validation.data, { fonts });
		return new Response(new Uint8Array(png), {
			status: 200,
			headers: {
				'Content-Type': CONTENT_TYPE,
				'Cache-Control': CACHE_HEADER
			}
		});
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return new Response(`OG render failed: ${detail}`, { status: 500 });
	}
};
