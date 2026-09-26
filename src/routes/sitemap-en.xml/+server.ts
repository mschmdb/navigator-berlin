import type { RequestHandler } from './$types';
import { loadManifest } from '$lib/data/manifest.js';
import { buildSitemapXml, collectPrerenderedUrls } from '$lib/seo/sitemap-builder.js';

export const prerender = true;

/**
 * i18n Block A: EN-language sitemap.
 *
 * Every source registered in `sitemap-builder.ts` only emits an entry for a
 * path that `$lib/seo/translation-register.ts` marks as translated for the
 * requested locale -- and that register ships empty in Block A (decision
 * Matze 26.09. 17:10, Variante A: `/en/...` pages stay `noindex` and out of
 * the sitemap until a page is registered as translated). This endpoint
 * therefore renders a valid, empty `<urlset>` for now; no code change is
 * needed here once a later block starts registering translated pages.
 *
 * Mirrors `sitemap-de.xml/+server.ts` but skips the bezirk/kiez/wahl slug
 * fetches -- every source short-circuits on the locale check before
 * touching them, so fetching that data here would be pure prerender cost
 * for a guaranteed-empty result.
 */
export const GET: RequestHandler = async ({ url, fetch }) => {
	const manifest = await loadManifest(fetch);
	const buildTimestamp = new Date().toISOString();
	const entries = collectPrerenderedUrls({
		origin: url.origin,
		locale: 'en',
		manifest,
		buildTimestamp
	});
	const body = buildSitemapXml(entries);
	return new Response(body, {
		status: 200,
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
