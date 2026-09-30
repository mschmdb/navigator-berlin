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
	/**
	 * Pfade unterhalb eines `prefix`-Eintrags, die NICHT übersetzt sind
	 * (exakter Vergleich nach Normalisierung), z. B. DE-only Feed-Endpoints.
	 */
	readonly except?: readonly string[];
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
 * (Wahlportal, `spec-i18n-b-wahlportal.md`) registered `/berlin-wahlen` AND
 * its whole detail-page subtree (`prefix: true`), so every
 * `/berlin-wahlen/{slug}` page -- including elections ingested after this
 * file was last touched -- counts as translated without a second,
 * hand-maintained slug list here. Block B2 (`spec-i18n-b2-shell.md`) adds
 * the homepage (`/`, exact match -- no `prefix`, the rest of the route tree
 * below `/` is untouched by this block). Block C1
 * (`spec-i18n-c1-hinweise-layer-erklaerungen.md`) moves `/explore` here from
 * {@link PARTIAL_TRANSLATION_REGISTER}: with layer-explain texts and
 * editorial disclaimers now fully translated (Messages, DE-default),
 * `/explore` has no remaining German content fragments in the UI, so it
 * graduates from "partially translated" to "translated" -- noindex lifts,
 * `SeoHead`'s hreflang cluster now includes `/en/explore`. Two
 * DE exceptions remain on the registered page regardless of locale: the
 * server-rendered OG-image text (`server/og/og-pipeline.ts`, no EN map
 * template yet) and the KI-Export/LLM export (`llm-export-builder.ts`,
 * `data-collector.ts`, `webmcp/**` -- boundary "stay German regardless of
 * page locale"). Block C4a (`spec-i18n-c4a-methodik-kern.md`) registers
 * `/methodik`, `/methodik/kiez-score` and `/methodik/cross-layer-templates` as
 * exact entries (no `prefix`). The OG images of these pages stay German.
 * `/methodik/cross-layer-templates` keeps its explicit `noindex` (co-design
 * preview), the registration only lifts the fallback banner and the German
 * `<main lang>`. Block C4b (`spec-i18n-c4b-wahl-methodik-technik.md`) adds
 * four more exact entries: `/methodik/wahldaten`, `/architektur`, `/webmcp` and
 * `/umwelt-infrastruktur-score`. WebMCP tool names, tool descriptions and the
 * manifest stay German (boundary C1/C2), the OG images stay German. Block C4c
 * (`spec-i18n-c4c-hitze-quellen.md`) adds three more exact entries: `/hitze`,
 * `/kuehle-orte` and `/lizenzen`. The DataCatalog JSON-LD on `/lizenzen` and the
 * live DWD warning text stay German, the OG images stay German. Block C4d
 * (`spec-i18n-c4d-updates.md`) registers `/updates` with `prefix: true`: the
 * index and every `/updates/{slug}` detail page, including entries added later.
 * An entry without `.en.md` sibling or `title_en`/`summary_en` shows its German
 * text with `lang="de"` on the affected element. The feeds stay German, there is
 * no EN feed and the OG images stay German. Block D1
 * (`spec-i18n-d1-register-sitemap.md`) registers `/kiez`, `/bezirk` and `/layer`
 * with `prefix: true` (every detail slug), and the sitemap sources emit
 * localized URLs for every locale, so `sitemap-en.xml` lists every registered,
 * indexable page. Later
 * blocks append further `{ pathname, locale }` entries as more EN content ships
 * -- no other module needs to change.
 */
export const TRANSLATION_REGISTER: readonly TranslationRegisterEntry[] = [
	{ pathname: '/berlin-wahlen', locale: 'en', prefix: true },
	{ pathname: '/', locale: 'en' },
	{ pathname: '/explore', locale: 'en' },
	{ pathname: '/methodik', locale: 'en' },
	{ pathname: '/methodik/kiez-score', locale: 'en' },
	{ pathname: '/methodik/cross-layer-templates', locale: 'en' },
	{ pathname: '/methodik/wahldaten', locale: 'en' },
	{ pathname: '/architektur', locale: 'en' },
	{ pathname: '/webmcp', locale: 'en' },
	{ pathname: '/umwelt-infrastruktur-score', locale: 'en' },
	{ pathname: '/hitze', locale: 'en' },
	{ pathname: '/kuehle-orte', locale: 'en' },
	{ pathname: '/lizenzen', locale: 'en' },
	{ pathname: '/kiez', locale: 'en', prefix: true },
	{ pathname: '/bezirk', locale: 'en', prefix: true },
	{ pathname: '/layer', locale: 'en', prefix: true },
	{
		pathname: '/updates',
		locale: 'en',
		prefix: true,
		// Feeds sind DE-only, `/en/updates/rss.xml` existiert nicht.
		except: ['/updates/rss.xml', '/updates/atom.xml', '/updates/feed.json']
	}
];

/**
 * Partial-translation register -- a SECOND, separate list from
 * {@link TRANSLATION_REGISTER} (spec `spec-i18n-teiluebersetzung-banner.md`).
 *
 * A route in here has a translated FRAME (chrome, headings, labels) but
 * still shows German content fragments (profiles, layer-explain text, …)
 * until Block C finishes full content translation. That is a distinct
 * state from "translated" (`TRANSLATION_REGISTER`): it does NOT flip
 * `isRouteTranslated`, so noindex/hreflang/sitemap/llms stay exactly as
 * they are for these routes -- only the banner text and `<main lang>`
 * (via `resolveFrameLocale`) react to a partial-translation entry.
 *
 * The register is empty since i18n Block D1: `/explore` moved out in Block
 * C1, `/kiez`, `/bezirk` and `/layer` (all with `prefix: true`) moved out in
 * D1 (`spec-i18n-d1-register-sitemap.md`). The mechanism stays for future
 * pages that ship a translated frame before their content.
 */
export const PARTIAL_TRANSLATION_REGISTER: readonly TranslationRegisterEntry[] = [];

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
	if (entry.except?.some((path) => normalizePathname(path) === normalizedPathname)) return false;
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
 * Whether `pathname` is registered as "partially translated" for `locale`:
 * the frame (chrome, headings, labels) is translated, but the page still
 * shows German content fragments alongside it -- see
 * {@link PARTIAL_TRANSLATION_REGISTER}.
 *
 * The base locale is never "partially translated" (it IS the content, there
 * is nothing to fall back from). This is intentionally independent of
 * {@link isRouteTranslated}: a path can be partially translated without
 * ever being marked fully "translated" (that would require a separate
 * `TRANSLATION_REGISTER` entry, which Block C decides later).
 */
export function isRoutePartiallyTranslated(
	pathname: string,
	locale: Locale,
	entries: readonly TranslationRegisterEntry[] = PARTIAL_TRANSLATION_REGISTER
): boolean {
	if (locale === baseLocale) return false;
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
