import { baseLocale, deLocalizeHref, type Locale } from '$lib/paraglide/runtime';

/**
 * One (pathname, locale) pair with real, human-translated content.
 * `pathname` may be given with or without a locale prefix -- both
 * `isRouteTranslated`/`translatedLocalesFor` normalize via `deLocalizeHref`
 * before comparing, so `/methodik` and `/en/methodik` match the same entry.
 */
export interface TranslationRegisterEntry {
	readonly pathname: string;
	readonly locale: Locale;
}

/**
 * Translation register -- the single source of truth for which (pathname,
 * locale) pairs have real translated content.
 *
 * `SeoHead` (noindex + hreflang), the sitemap sources, and `llms-builder`
 * all derive their EN-visibility decision from this module instead of each
 * re-implementing their own `locale !== 'de'` check (decision Matze
 * 26.09.2026, `spec-i18n-a-infra-routing.md`).
 *
 * Block A ships zero entries on purpose: `/en/...` routing, SEO-mechanics
 * and the language switcher go live, but no page is marked translated yet.
 * `sitemap-en.xml` therefore stays empty and every `/en/...` page is
 * `noindex`. Later blocks append `{ pathname, locale }` entries here as EN
 * content ships -- no other module needs to change.
 */
export const TRANSLATION_REGISTER: readonly TranslationRegisterEntry[] = [];

function normalizePathname(pathname: string): string {
	const deLocalized = deLocalizeHref(pathname);
	const withoutQuery = deLocalized.split(/[?#]/)[0] ?? deLocalized;
	if (withoutQuery.length > 1) return withoutQuery.replace(/\/+$/, '');
	return withoutQuery || '/';
}

/**
 * Whether `pathname` has real, human-translated content for `locale`.
 *
 * The base locale (DE) is always authoritative and therefore always
 * "translated". Every other locale must be explicitly registered.
 *
 * `entries` defaults to the real {@link TRANSLATION_REGISTER} and exists as
 * a parameter so callers (and tests) can inject a different register
 * without module-mocking -- e.g. `SeoHead`'s `registerEntries` prop.
 */
export function isRouteTranslated(
	pathname: string,
	locale: Locale,
	entries: readonly TranslationRegisterEntry[] = TRANSLATION_REGISTER
): boolean {
	if (locale === baseLocale) return true;
	const normalized = normalizePathname(pathname);
	return entries.some(
		(entry) => entry.locale === locale && normalizePathname(entry.pathname) === normalized
	);
}

/**
 * The subset of `locales` (excluding the base locale) that have real
 * translated content for `pathname`. Used to build the hreflang cluster.
 */
export function translatedLocalesFor(
	pathname: string,
	locales: readonly Locale[],
	entries: readonly TranslationRegisterEntry[] = TRANSLATION_REGISTER
): readonly Locale[] {
	return locales.filter(
		(locale) => locale !== baseLocale && isRouteTranslated(pathname, locale, entries)
	);
}
