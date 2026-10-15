import type { RequestHandler } from './$types';
import { buildSitemapIndexXml } from '$lib/seo/sitemap-builder.js';
import { latestLastmod } from '$lib/seo/lastmod.js';
import { loadSitemapEntries } from '$lib/seo/sitemap-context.js';

export const prerender = true;

/**
 * Story 2.1 AC-4: sitemap-index.
 *
 * i18n Block A: lists both per-locale sitemaps. `sitemap-en.xml` renders an
 * empty `<urlset>` until the translation register marks pages translated
 * (`$lib/seo/translation-register.ts`).
 *
 * S5: `lastmod` je Teil-Sitemap = jüngstes `lastmod` ihrer Einträge. Ohne
 * datierte Einträge entfällt es (kein `new Date()` mehr).
 */
export const GET: RequestHandler = async ({ url, fetch }) => {
	const origin = url.origin;
	const [de, en] = await Promise.all([
		loadSitemapEntries({ origin, locale: 'de', fetch }),
		loadSitemapEntries({ origin, locale: 'en', fetch })
	]);
	const deLastmod = latestLastmod(de.map((e) => e.lastmod));
	const enLastmod = latestLastmod(en.map((e) => e.lastmod));
	const body = buildSitemapIndexXml([
		{ loc: `${origin}/sitemap-de.xml`, ...(deLastmod ? { lastmod: deLastmod } : {}) },
		{ loc: `${origin}/sitemap-en.xml`, ...(enLastmod ? { lastmod: enLastmod } : {}) }
	]);
	return new Response(body, {
		status: 200,
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
