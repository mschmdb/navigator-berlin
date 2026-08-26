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
 */

/**
 * Locale prefixes that the old multi-locale scheme exposed and that must now
 * collapse onto the prefix-less DE canonical. `de` is included because the base
 * locale no longer carries a prefix, so `/de/…` is itself stale.
 */
const STALE_LOCALE_PREFIXES: ReadonlySet<string> = new Set([
	'de',
	'en',
	'es',
	'fr',
	'it',
	'pl',
	'tr',
	'ar'
]);

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
