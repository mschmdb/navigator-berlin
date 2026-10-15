import type { RequestHandler } from './$types';
import { sitemapResponse } from '$lib/seo/sitemap-context.js';

export const prerender = true;

/**
 * i18n Block A/B/D1: EN-language sitemap.
 *
 * Every source registered in `sitemap-builder.ts` emits `/en/...` URLs, and
 * `collectPrerenderedUrls` keeps only the paths that
 * `$lib/seo/translation-register.ts` marks as translated. The data loading is
 * shared with `sitemap-de.xml` (`$lib/seo/sitemap-context.ts`), so every
 * registered detail page (Kiez, Bezirk, Layer, Wahlen, Updates) appears.
 */
export const GET: RequestHandler = ({ url, fetch }) =>
	sitemapResponse({ origin: url.origin, locale: 'en', fetch });
