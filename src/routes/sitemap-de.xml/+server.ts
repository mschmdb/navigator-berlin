import type { RequestHandler } from './$types';
import { loadManifest } from '$lib/data/manifest.js';
import { buildSitemapXml, collectPrerenderedUrls } from '$lib/seo/sitemap-builder.js';
import { readBezirkSlugsFromGeoJson } from '$lib/seo/sources/bezirk-slugs.js';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';

export const prerender = true;

/**
 * Story 2.1 AC-4 + AC-6: DE-language sitemap.
 *
 * Phase 1 (memory `project_i18n_phase_1_de_only`): only DE routes exist. The EN
 * counterpart `src/routes/sitemap-en.xml/+server.ts` is intentionally NOT
 * created here, story 3.1/3.2 will add it once EN-coverage ships.
 *
 * Background: a single dynamic route `routes/sitemap-[lang]/+server.ts` was
 * tried first but the unexpanded `[lang]` bracket leaks into the `Pathname`
 * union and breaks every `resolve(... as Pathname)` call in the codebase.
 * Two static routes are the simpler shape and match the DE-only roadmap.
 *
 * Story 2.3: Bezirks-Slugs werden hier zur Build-Time aus dem Bezirks-GeoJSON
 * gelesen und im Context an `BEZIRK_PAGES_SOURCE` durchgereicht.
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
				return list.map((w) => ({ jahr: w.jahr, typ: w.typ, stimmtyp: w.stimmtyp }));
			} catch {
				return [];
			}
		})()
	]);
	const entries = collectPrerenderedUrls({
		origin: url.origin,
		locale: 'de',
		manifest,
		buildTimestamp,
		bezirkSlugs,
		kiezSlugs,
		wahlen
	});
	const body = buildSitemapXml(entries);
	return new Response(body, {
		status: 200,
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
