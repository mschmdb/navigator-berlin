import type { RequestHandler } from './$types';
import { loadManifest } from '$lib/data/manifest.js';
import { buildLlmsFullTxt } from '$lib/seo/llms-builder.js';
import { collectLlmsData } from '$lib/server/llms/data-collector.js';

export const prerender = true;

/**
 * Story 2.8 AC-2 + AC-6: /llms-full.txt als Single-File-Inhalts-Quelle.
 *
 * Concat aller Bezirk-, Top-50-Kiez- und Layer-Markdowns, getrennt mit `---`-
 * Markern. Overflow-Kieze (> 50) erscheinen am Ende als URL-only-Liste.
 *
 * Phase 1 DE-only. Variante B (on-the-fly). max-age=3600 (1h).
 */
export const GET: RequestHandler = async ({ url, fetch }) => {
	const manifest = await loadManifest(fetch);
	const collected = await collectLlmsData(manifest, url.origin);
	const body = buildLlmsFullTxt({
		origin: url.origin,
		locale: 'de',
		manifest,
		buildTimestamp: new Date().toISOString(),
		bezirke: collected.bezirke,
		kieze: collected.kieze,
		layer: collected.layer,
		wahlen: collected.wahlen
	});
	return new Response(body, {
		status: 200,
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
