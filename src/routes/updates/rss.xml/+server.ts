import type { RequestHandler } from './$types';
import { loadUpdatesFromModules } from '$lib/content/updates/load-updates.js';
import { buildRssXml } from '$lib/feeds/build-rss.js';

export const prerender = true;

/**
 * Story 2.13 AC-5: RSS 2.0 Feed-Endpoint.
 * Phase 1 DE-only (memory `project_i18n_phase_1_de_only`). EN-Feed in Phase 3.
 */
export const GET: RequestHandler = ({ url }) => {
	const modules = import.meta.glob('/_content/updates/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	const entries = loadUpdatesFromModules(modules);
	const xml = buildRssXml({
		entries,
		origin: url.origin,
		buildTimestamp: new Date().toISOString()
	});
	return new Response(xml, {
		status: 200,
		headers: { 'content-type': 'application/rss+xml; charset=utf-8' }
	});
};
