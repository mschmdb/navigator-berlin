import type { RequestHandler } from './$types';
import { buildSitemapIndexXml } from '$lib/seo/sitemap-builder.js';

export const prerender = true;

/**
 * Story 2.1 AC-4: sitemap-index.
 *
 * i18n Block A: lists both per-locale sitemaps. `sitemap-en.xml` renders an
 * empty `<urlset>` until the translation register marks pages translated
 * (`$lib/seo/translation-register.ts`) -- listing it now is harmless (a
 * valid, empty sitemap) and means Block B needs no change here.
 *
 * `lastmod` uses the build timestamp because the index itself only changes
 * when the build runs.
 */
export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;
	const lastmod = new Date().toISOString();
	const body = buildSitemapIndexXml([
		{ loc: `${origin}/sitemap-de.xml`, lastmod },
		{ loc: `${origin}/sitemap-en.xml`, lastmod }
	]);
	return new Response(body, {
		status: 200,
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
