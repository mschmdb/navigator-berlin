import type { RequestHandler } from './$types';
import { loadUpdatesFromModules } from '$lib/content/updates/load-updates.js';
import { buildAtomXml } from '$lib/feeds/build-atom.js';

export const prerender = true;

/** Story 2.13 AC-6: Atom 1.0 Feed-Endpoint. DE-only Phase 1. */
export const GET: RequestHandler = ({ url }) => {
	const modules = import.meta.glob('/_content/updates/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	const entries = loadUpdatesFromModules(modules);
	const xml = buildAtomXml({
		entries,
		origin: url.origin,
		buildTimestamp: new Date().toISOString()
	});
	return new Response(xml, {
		status: 200,
		headers: { 'content-type': 'application/atom+xml; charset=utf-8' }
	});
};
