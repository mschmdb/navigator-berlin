import { resolve } from '$app/paths';
import { localizeHref, type Locale } from '$lib/paraglide/runtime';

/**
 * Locale-aware href, resolved through SvelteKit's `resolve()` so base-path
 * deployments stay correct.
 *
 * Consolidates the `(resolve as (path: string) => string)(localizeHref(...))`
 * cast that used to be duplicated in `lang-switcher.svelte`,
 * `(with-header)/+layout.svelte` and the root `+layout.svelte` (code review,
 * 2026-09-26).
 *
 * @param path - relative path, e.g. `/kiez/mitte`. May already carry a locale
 *   prefix (`localizeHref` de/re-localizes internally either way).
 * @param locale - target locale. Defaults to the current locale (`getLocale()`,
 *   Paraglide's own default when no `locale` option is passed).
 */
export function localizedHref(path: string, locale?: Locale): string {
	const localized = localizeHref(path, locale ? { locale } : undefined);
	return (resolve as (p: string) => string)(localized);
}
