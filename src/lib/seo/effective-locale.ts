import { baseLocale, getLocale, type Locale } from '$lib/paraglide/runtime';
import {
	isRoutePartiallyTranslated,
	isRouteTranslated,
	PARTIAL_TRANSLATION_REGISTER,
	TRANSLATION_REGISTER,
	type TranslationRegisterEntry
} from './translation-register.js';

/**
 * The locale whose CONTENT actually renders for a given path.
 *
 * DE is always authoritative. A non-base `pageLocale` only renders its own
 * content once `translation-register.ts` marks the path as translated for
 * that locale -- otherwise the page falls back to DE content while keeping
 * its `/en/...` URL and `lang="en"` (Block A: this is every page, since the
 * register ships empty).
 *
 * Shared by `+layout.svelte` (WebSite JSON-LD `inLanguage`), `SeoHead`
 * (`og:locale`, canonical), and `TranslationDisclaimer` (fallback-vs-
 * translated variant) so the three stay consistent by construction.
 *
 * `entries` defaults to the real {@link TRANSLATION_REGISTER} and exists so
 * callers/tests can inject a different register without module-mocking.
 */
export function resolveEffectiveLocale(
	pathname: string,
	pageLocale: Locale = getLocale(),
	entries: readonly TranslationRegisterEntry[] = TRANSLATION_REGISTER
): Locale {
	return isRouteTranslated(pathname, pageLocale, entries) ? pageLocale : baseLocale;
}

/**
 * The locale the page FRAME (chrome, headings, labels, `<main lang>`)
 * renders in -- as opposed to {@link resolveEffectiveLocale}, which stays
 * the CONTENT/SEO locale and is deliberately left untouched by this spec
 * (`spec-i18n-teiluebersetzung-banner.md`, Boundary: `isRouteTranslated`,
 * sitemap, hreflang, noindex and llms stay exactly as they are).
 *
 * A partially-translated route (`partialEntries`) renders its own frame
 * locale even though its content locale still falls back to the base
 * locale (the route is not, and does not become, "translated"). Every
 * other route keeps `resolveEffectiveLocale`'s result: a fully translated
 * route already returns `pageLocale` there, and an untouched route returns
 * the base locale in both places.
 */
export function resolveFrameLocale(
	pathname: string,
	pageLocale: Locale = getLocale(),
	partialEntries: readonly TranslationRegisterEntry[] = PARTIAL_TRANSLATION_REGISTER,
	entries: readonly TranslationRegisterEntry[] = TRANSLATION_REGISTER
): Locale {
	if (isRoutePartiallyTranslated(pathname, pageLocale, partialEntries)) return pageLocale;
	return resolveEffectiveLocale(pathname, pageLocale, entries);
}
