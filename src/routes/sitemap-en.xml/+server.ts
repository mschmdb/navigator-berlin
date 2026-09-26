import type { RequestHandler } from './$types';
import { loadManifest } from '$lib/data/manifest.js';
import { buildSitemapXml, collectPrerenderedUrls } from '$lib/seo/sitemap-builder.js';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { featureFlags } from '$lib/data/feature-flags.js';

export const prerender = true;

/**
 * i18n Block A/B: EN-language sitemap.
 *
 * Every source registered in `sitemap-builder.ts` only emits an entry for a
 * path that `$lib/seo/translation-register.ts` marks as translated for the
 * requested locale. Block A shipped an empty register (every `/en/...` page
 * stayed `noindex` and out of the sitemap). Block B (Wahlportal) registers
 * `/berlin-wahlen` + every detail slug, so this endpoint now fetches the
 * same `wahlen` rows and `wahlPortalEnabled` flag as `sitemap-de.xml` to let
 * `WAHL_PORTAL_PAGE_SOURCE`/`WAHL_DETAIL_SOURCE` emit their `/en/...`
 * entries. Bezirk/Kiez slugs stay un-fetched -- those pages are not
 * registered as translated yet, their sources still short-circuit for
 * `locale=en` before touching that data.
 */
export const GET: RequestHandler = async ({ url, fetch }) => {
	const manifest = await loadManifest(fetch);
	const buildTimestamp = new Date().toISOString();
	let wahlen: Array<{
		jahr: number;
		typ: 'btw' | 'agh' | 'bvv';
		stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
		sourceUpdatedAt: string | null;
	}> = [];
	if (process.env.DATABASE_URL) {
		try {
			const list = await getWahlList();
			wahlen = list.map((w) => ({
				jahr: w.jahr,
				typ: w.typ,
				stimmtyp: w.stimmtyp,
				sourceUpdatedAt: w.sourceUpdatedAt ? w.sourceUpdatedAt.toISOString() : null
			}));
		} catch {
			wahlen = [];
		}
	}
	const entries = collectPrerenderedUrls({
		origin: url.origin,
		locale: 'en',
		manifest,
		buildTimestamp,
		wahlen,
		wahlPortalEnabled: featureFlags.wahlPortal
	});
	const body = buildSitemapXml(entries);
	return new Response(body, {
		status: 200,
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
