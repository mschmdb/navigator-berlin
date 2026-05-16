import type { RequestHandler } from './$types';
import { buildSitemapIndexXml } from '$lib/seo/sitemap-builder.js';

export const prerender = true;

/**
 * Story 2.1 AC-4: sitemap-index. Phase 1 (memory `project_i18n_phase_1_de_only`)
 * lists only `sitemap-de.xml`. When EN coverage ships (story 3.1/3.2), add a
 * second `sitemap-en.xml` entry.
 *
 * `lastmod` uses the build timestamp because the index itself only changes
 * when the build runs.
 */
export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;
	const lastmod = new Date().toISOString();
	const body = buildSitemapIndexXml([
		{ loc: `${origin}/sitemap-de.xml`, lastmod }
		// TODO(story 3.1/3.2): add { loc: `${origin}/sitemap-en.xml`, lastmod } once EN routes ship.
	]);
	return new Response(body, {
		status: 200,
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
