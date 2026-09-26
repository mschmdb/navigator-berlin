import { locales, baseLocale } from '$lib/paraglide/runtime';

/**
 * Stale locale-prefix redirect resolver.
 *
 * The site ran on a multi-locale URL scheme before the Phase-1 DE-only reduction
 * (memory `project_i18n_phase_1_de_only`). Google indexed locale-prefixed URLs
 * (`/de/…`, `/es/…`, `/fr/…`, …) that now 404, because Paraglide's `reroute`
 * (memory `project_paraglide_reroute`) only strips configured locales and the
 * base locale `de` carries no prefix at all.
 *
 * This resolver maps such a stale path to its canonical DE path so a 301 can
 * consolidate the indexed URL onto the prefix-less canonical instead of 404ing.
 *
 * Operates on the pathname only. Callers must re-append the original query string.
 *
 * Security: the returned target is normalized to a single-origin absolute path.
 * The remainder after the locale segment is untrusted request input, so a
 * scheme-relative remainder (`/de//evil.com`) or a backslash trick
 * (`/de/\evil.com`) must never survive into the 301 Location header, otherwise
 * the hook becomes an open redirect off navigator.berlin.
 *
 * i18n Block A: `en` went live as a real `/en/…` route (`locales` in
 * `$lib/paraglide/runtime` now includes it), so it must NOT collapse onto DE
 * anymore. The stale-prefix set is derived as "every locale prefix this site
 * has ever exposed, minus every locale that is currently active with its own
 * URL prefix" (decision Matze 26.09.2026) -- `de` stays stale forever because
 * the base locale never gets a URL prefix under strategy `['url', 'baseLocale']`,
 * so `/de/…` was never a real route to begin with.
 */

/**
 * Every locale prefix this site has ever exposed under the old multi-locale
 * scheme. Extend when retiring a locale, never when activating one (that's
 * what `locales` in `$lib/paraglide/runtime` is for).
 */
const HISTORICAL_LOCALE_PREFIXES: ReadonlySet<string> = new Set([
	'de',
	'en',
	'es',
	'fr',
	'it',
	'pl',
	'tr',
	'ar'
]);

/**
 * Historical prefixes minus locales that currently own a real `/{locale}/…`
 * route. The base locale is excluded from that subtraction -- it never gets
 * a URL prefix (default Paraglide pattern), so `/de/…` stays stale even
 * though `de` is itself an "active" locale.
 */
const STALE_LOCALE_PREFIXES: ReadonlySet<string> = new Set(
	[...HISTORICAL_LOCALE_PREFIXES].filter(
		(prefix) => !((locales as readonly string[]).includes(prefix) && prefix !== baseLocale)
	)
);

export function staleLocaleRedirectTarget(pathname: string): string | null {
	const firstSlash = pathname.indexOf('/', 1);
	const segment = (
		firstSlash === -1 ? pathname.slice(1) : pathname.slice(1, firstSlash)
	).toLowerCase();

	if (!STALE_LOCALE_PREFIXES.has(segment)) return null;

	const rest = firstSlash === -1 ? '' : pathname.slice(firstSlash);
	// Collapse leading slash/backslash runs to a single '/' so an untrusted
	// remainder can never become a scheme-relative off-origin target.
	const target = rest.replace(/[/\\]+$/, '').replace(/^[/\\]+/, '/');
	return target === '' || target === '/' ? '/' : target;
}
