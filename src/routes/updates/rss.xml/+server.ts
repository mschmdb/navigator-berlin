import type { RequestHandler } from './$types';
import { loadUpdatesFromModules } from '$lib/content/updates/load-updates.js';
import { buildRssXml } from '$lib/feeds/build-rss.js';

export const prerender = true;

/**
 * Story 2.13 AC-5: RSS 2.0 Feed-Endpoint.
 * DE-only, auch seit i18n C4d: kein EN-Feed (Entscheidung Matze 30.09.). `.en.md`-Schwestern erzeugen keine Einträge.
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
