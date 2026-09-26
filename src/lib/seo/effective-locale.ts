import { baseLocale, getLocale, type Locale } from '$lib/paraglide/runtime';
import {
	isRouteTranslated,
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
