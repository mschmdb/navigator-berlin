import type { Locale } from '$lib/paraglide/runtime';

/**
 * Region subtag per locale for BCP-47 / `og:locale` output. Centralizes the
 * `{ de: 'de-DE', en: 'en-US' }`-style maps that used to live inline in
 * `+layout.svelte` and per-page JSON-LD builders (decision Matze 26.09.2026).
 *
 * Missing entries fall back to the bare language subtag (see
 * {@link localeToBcp47}).
 */
const REGION_SUBTAG: Partial<Record<Locale, string>> = {
	de: 'DE',
	en: 'US'
};

/** BCP-47 language tag, e.g. `de-DE`, `en-US`. Used for JSON-LD `inLanguage`. */
export function localeToBcp47(locale: Locale): string {
	const region = REGION_SUBTAG[locale];
	return region ? `${locale}-${region}` : locale;
}

/** `og:locale` format (underscore instead of hyphen), e.g. `de_DE`, `en_US`. */
export function localeToOgLocale(locale: Locale): string {
	return localeToBcp47(locale).replace('-', '_');
}
