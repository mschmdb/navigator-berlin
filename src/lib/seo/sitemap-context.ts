import { loadManifest } from '$lib/data/manifest.js';
import { featureFlags } from '$lib/data/feature-flags.js';
import type { Locale } from '$lib/paraglide/runtime';
import { buildSitemapXml, collectPrerenderedUrls, type SitemapEntry } from './sitemap-builder.js';
import { readBezirkSlugsFromGeoJson } from './sources/bezirk-slugs.js';
import { readKiezSlugsFromGeoJson } from './sources/kiez-slugs.js';
import { readProfileDates, readScoresGeneratedAt } from './sources/profile-dates.js';
import { loadWahlenForSitemap } from './sitemap-wahlen.js';

interface LoadSitemapEntriesInput {
	readonly origin: string;
	readonly locale: Locale;
	readonly fetch: typeof fetch;
}

/** Lädt alle Datenquellen und liefert die Sitemap-Einträge einer Locale. */
export async function loadSitemapEntries(input: LoadSitemapEntriesInput): Promise<SitemapEntry[]> {
	const [manifest, bezirkSlugs, kiezSlugs, wahlen, kiezDates, bezirkDates, scoresGeneratedAt] =
		await Promise.all([
			loadManifest(input.fetch),
			readBezirkSlugsFromGeoJson(),
			readKiezSlugsFromGeoJson(),
			loadWahlenForSitemap(),
			readProfileDates('kiez'),
			readProfileDates('bezirk'),
			readScoresGeneratedAt()
		]);
	return collectPrerenderedUrls({
		origin: input.origin,
		locale: input.locale,
		manifest,
		bezirkSlugs,
		kiezSlugs,
		wahlen,
		profileDates: { kiez: kiezDates, bezirk: bezirkDates },
		scoresGeneratedAt,
		wahlPortalEnabled: featureFlags.wahlPortal
	});
}

/** Rendert die Sitemap einer Locale als `Response`. */
export async function sitemapResponse(input: LoadSitemapEntriesInput): Promise<Response> {
	const entries = await loadSitemapEntries(input);
	return new Response(buildSitemapXml(entries), {
		status: 200,
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
}
