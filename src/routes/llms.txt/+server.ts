import type { RequestHandler } from './$types';
import { loadManifest } from '$lib/data/manifest.js';
import { buildLlmsTxt } from '$lib/seo/llms-builder.js';
import { collectLlmsData } from '$lib/server/llms/data-collector.js';

export const prerender = true;

/**
 * Story 2.8 AC-1 + AC-6: /llms.txt als Site-Index für LLM-Crawler.
 *
 * Folgt der llmstxt.org-Spec: H1 + Blockquote-Summary + H2-Sektionen mit
 * Markdown-Hyperlink-Bullets.
 *
 * Phase 1 DE-only (memory `project_i18n_phase_1_de_only`): keine EN-Variante.
 *
 * Variante B (User-Decision): on-the-fly Prerender, kein llms_content-Cache.
 * Graceful DB-Fallback in `collectLlmsData` falls DATABASE_URL fehlt.
 *
 * Konsistenz mit Sitemap (Story 2.1): URLs aus dem gleichen Manifest +
 * Bezirk-/Kiez-Listen wie Sitemap-Sources.
 */
export const GET: RequestHandler = async ({ url, fetch }) => {
	const manifest = await loadManifest(fetch);
	const collected = await collectLlmsData(manifest);
	const body = buildLlmsTxt({
		origin: url.origin,
		locale: 'de',
		manifest,
		buildTimestamp: new Date().toISOString(),
		bezirke: collected.bezirke,
		kieze: collected.kieze,
		layer: collected.layer
	});
	return new Response(body, {
		status: 200,
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
