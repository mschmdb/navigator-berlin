import type { RequestHandler } from './$types';
import { loadUpdatesFromModules } from '$lib/content/updates/load-updates.js';
import { buildJsonFeed } from '$lib/feeds/build-json-feed.js';

export const prerender = true;

/** Story 2.13 AC-7: JSON Feed 1.1 Endpoint. DE-only Phase 1. */
export const GET: RequestHandler = ({ url }) => {
	const modules = import.meta.glob('/_content/updates/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	const entries = loadUpdatesFromModules(modules);
	const feed = buildJsonFeed({ entries, origin: url.origin });
	return new Response(JSON.stringify(feed, null, 2), {
		status: 200,
		headers: { 'content-type': 'application/feed+json; charset=utf-8' }
	});
};
