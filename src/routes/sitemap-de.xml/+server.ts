import type { RequestHandler } from './$types';
import { sitemapResponse } from '$lib/seo/sitemap-context.js';

export const prerender = true;

/**
 * Story 2.1 AC-4 + AC-6: DE-language sitemap.
 *
 * Daten laden, `lastmod`-Regeln und die Build-Härte (Prod-Build ohne Wahl-Daten
 * bricht ab) stecken in `$lib/seo/sitemap-context.ts`. Die EN-Route
 * (`sitemap-en.xml`) und der Index (`sitemap.xml`) nutzen dieselbe Quelle.
 *
 * Zwei statische Routes statt `routes/sitemap-[lang]/+server.ts`: die
 * unexpandierte `[lang]`-Klammer landet in der `Pathname`-Union und bricht jeden
 * `resolve(... as Pathname)`-Aufruf.
 */
export const GET: RequestHandler = ({ url, fetch }) =>
	sitemapResponse({ origin: url.origin, locale: 'de', fetch });
