import { localizeHref, type Locale } from '$lib/paraglide/runtime';

/**
 * Build a canonical URL from an origin and pathname.
 *
 * Strips query strings, hash fragments, and trailing slashes (except on root).
 * Normalizes the origin and pathname so the result has exactly one slash between them.
 *
 * Per AC-2 in story 2.1: query parameters and hash fragments must never appear
 * in a canonical URL. URL state like `?bbox=...&layers=...` is a client-only concern.
 */
export function buildCanonical(origin: string, pathname: string): string {
	const trimmedOrigin = origin.replace(/\/+$/, '');
	let path = pathname;
	const queryIdx = path.indexOf('?');
	if (queryIdx !== -1) path = path.slice(0, queryIdx);
	const hashIdx = path.indexOf('#');
	if (hashIdx !== -1) path = path.slice(0, hashIdx);
	if (!path.startsWith('/')) path = `/${path}`;
	if (path.length > 1) path = path.replace(/\/+$/, '');
	return `${trimmedOrigin}${path}`;
}

/**
 * Locale-specific canonical pathname via Paraglide's `localizeHref`: DE has
 * no prefix, every other locale gets its `/locale/...` prefix -- independent
 * of whether `pathname` itself already carries a (possibly different)
 * prefix. Shared by `hreflang.ts` (per-locale alternate hrefs) and
 * `seo-head.svelte` (canonical target for a non-translated non-base page,
 * which must point at the DE URL, not at itself).
 *
 * Leading slash/backslash runs are collapsed to one before calling
 * `localizeHref`, so a malformed pathname (e.g. `//evil.example`) can never
 * make it resolve against a foreign origin (code review, 2026-09-26).
 */
export function localizedPathname(pathname: string, locale: Locale): string {
	let path = pathname;
	const queryIdx = path.indexOf('?');
	if (queryIdx !== -1) path = path.slice(0, queryIdx);
	const hashIdx = path.indexOf('#');
	if (hashIdx !== -1) path = path.slice(0, hashIdx);
	if (!path.startsWith('/')) path = `/${path}`;
	path = path.replace(/^[/\\]+/, '/');
	const localized = localizeHref(path, { locale });
	const withoutQuery = localized.split('?')[0]?.split('#')[0] ?? localized;
	if (withoutQuery.length > 1) return withoutQuery.replace(/\/+$/, '');
	return withoutQuery || '/';
}
