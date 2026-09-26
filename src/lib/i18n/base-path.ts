import { deLocalizeUrl } from '$lib/paraglide/runtime';

/**
 * The pathname with any locale prefix stripped, e.g. `/en/explore` -> `/explore`,
 * `/en/api/geocode` -> `/api/geocode`, `/explore` -> `/explore` (DE has no prefix).
 *
 * Code-review fix (2026-09-26, i18n Block A): every prefix check that compared
 * `url.pathname` directly against a literal path (`startsWith`/`===`) silently
 * broke for `/en/...` requests -- `/en/explore` fell into the wrong layout
 * branch, `/en/api/*` lost its `X-Robots-Tag` header. Use this helper instead
 * of raw `url.pathname` for ANY such check.
 */
export function basePathname(url: URL): string {
	return deLocalizeUrl(url).pathname;
}
