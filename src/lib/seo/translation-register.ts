import { baseLocale, deLocalizeHref, type Locale } from '$lib/paraglide/runtime';

/**
 * One (pathname, locale) pair -- or, with `prefix: true`, a whole subtree --
 * with real, human-translated content. `pathname` may be given with or
 * without a locale prefix -- both `isRouteTranslated`/`translatedLocalesFor`
 * normalize via `deLocalizeHref` before comparing, so `/methodik` and
 * `/en/methodik` match the same entry.
 */
export interface TranslationRegisterEntry {
	readonly pathname: string;
	readonly locale: Locale;
	/**
	 * Review-Fund (i18n Block B): a `false`/omitted `prefix` matches only the
	 * exact `pathname`. `prefix: true` matches `pathname` itself AND every
	 * path segment below it (e.g. `/berlin-wahlen` with `prefix: true`
	 * matches `/berlin-wahlen/2025-btw-zweitstimme` too) -- one entry then
	 * covers every CURRENT and FUTURE detail slug under that route without a
	 * hand-maintained per-slug list here (the previous approach expanded
	 * `buildWahlFallbackList()`'s fixed 23-row snapshot into 23 separate
	 * entries, silently excluding any election ingested later).
	 */
	readonly prefix?: boolean;
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
 * Block A shipped zero entries on purpose (`/en/...` routing and SEO
 * mechanics went live with every page still un-registered/noindex). Block B
 * (Wahlportal, `spec-i18n-b-wahlportal.md`) is the first content to register:
 * `/berlin-wahlen` AND its whole detail-page subtree (`prefix: true`), so
 * every `/berlin-wahlen/{slug}` page -- including elections ingested after
 * this file was last touched -- counts as translated without a second,
 * hand-maintained slug list here. Later blocks append further
 * `{ pathname, locale }` entries as more EN content ships -- no other
 * module needs to change.
 */
export const TRANSLATION_REGISTER: readonly TranslationRegisterEntry[] = [
	{ pathname: '/berlin-wahlen', locale: 'en', prefix: true }
];

function normalizePathname(pathname: string): string {
	const deLocalized = deLocalizeHref(pathname);
	const withoutQuery = deLocalized.split(/[?#]/)[0] ?? deLocalized;
	if (withoutQuery.length > 1) return withoutQuery.replace(/\/+$/, '');
	return withoutQuery || '/';
}

/** Whether `normalizedPathname` matches `entry` -- exact match, or (with
 * `entry.prefix`) the entry's pathname itself plus everything below it. */
function matchesEntry(normalizedPathname: string, entry: TranslationRegisterEntry): boolean {
	const normalizedEntry = normalizePathname(entry.pathname);
	if (!entry.prefix) return normalizedPathname === normalizedEntry;
	if (normalizedPathname === normalizedEntry) return true;
	const prefixWithSlash = normalizedEntry.endsWith('/') ? normalizedEntry : `${normalizedEntry}/`;
	return normalizedPathname.startsWith(prefixWithSlash);
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
	return entries.some((entry) => entry.locale === locale && matchesEntry(normalized, entry));
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
