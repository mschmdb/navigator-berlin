import type { RequestHandler } from './$types';
import { loadManifest } from '$lib/data/manifest.js';
import { buildSitemapXml, collectPrerenderedUrls } from '$lib/seo/sitemap-builder.js';
import { readBezirkSlugsFromGeoJson } from '$lib/seo/sources/bezirk-slugs.js';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { featureFlags } from '$lib/data/feature-flags.js';

export const prerender = true;

/**
 * i18n Block A/B/D1: EN-language sitemap.
 *
 * Every source registered in `sitemap-builder.ts` emits `/en/...` URLs, and
 * `collectPrerenderedUrls` keeps only the paths that
 * `$lib/seo/translation-register.ts` marks as translated. This endpoint loads
 * the same Bezirk/Kiez slugs and `wahlen` rows as `sitemap-de.xml`, so every
 * registered detail page (Kiez, Bezirk, Layer, Wahlen, Updates) appears.
 */
export const GET: RequestHandler = async ({ url, fetch }) => {
	const manifest = await loadManifest(fetch);
	const buildTimestamp = new Date().toISOString();
	const [bezirkSlugs, kiezSlugs, wahlen] = await Promise.all([
		readBezirkSlugsFromGeoJson(),
		readKiezSlugsFromGeoJson(),
		(async () => {
			if (!process.env.DATABASE_URL) return [];
			try {
				const list = await getWahlList();
				return list.map((w) => ({
					jahr: w.jahr,
					typ: w.typ,
					stimmtyp: w.stimmtyp,
					sourceUpdatedAt: w.sourceUpdatedAt ? w.sourceUpdatedAt.toISOString() : null
				}));
			} catch {
				return [];
			}
		})()
	]);
	const entries = collectPrerenderedUrls({
		origin: url.origin,
		locale: 'en',
		manifest,
		buildTimestamp,
		bezirkSlugs,
		kiezSlugs,
		wahlen,
		wahlPortalEnabled: featureFlags.wahlPortal
	});
	const body = buildSitemapXml(entries);
	return new Response(body, {
		status: 200,
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
