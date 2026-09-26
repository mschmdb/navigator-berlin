import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { staleLocaleRedirectTarget } from '$lib/seo/stale-locale-redirect';
import { renamedRouteRedirectTarget } from '$lib/seo/renamed-route-redirect';
import { basePathname } from '$lib/i18n/base-path';

/**
 * 301 stale locale prefixes (`/de/…`, `/es/…`, …) onto the prefix-less DE
 * canonical. `de` stays stale forever (the base locale never carries a URL
 * prefix under Paraglide's `['url', 'baseLocale']` strategy). `en` is the
 * one exception since i18n Block A (2026-09-26, ADR-005): it's now an active
 * locale with its own real `/en/…` routes, so `staleLocaleRedirectTarget`
 * excludes it from this redirect (see `$lib/seo/stale-locale-redirect.ts`
 * for the historical-vs-active split). Runs before Paraglide so the redirect
 * happens prior to locale resolution.
 */
const handleStaleLocaleRedirect: Handle = ({ event, resolve }) => {
	const target = staleLocaleRedirectTarget(event.url.pathname);
	if (target !== null) {
		return new Response(null, {
			status: 301,
			headers: { location: target + event.url.search }
		});
	}
	return resolve(event);
};

/**
 * 301 umbenannte Routes auf ihren neuen Slug (ADR-015: /wo-lebt-es-sich-gut →
 * /umwelt-infrastruktur-score). Läuft vor Paraglide, erhält Query-String.
 *
 * Named export (statt nur intern in `sequence(...)`) für `hooks.server.test.ts`:
 * der zusammengesetzte `handle` hängt über `sequence()` an SvelteKits
 * Request-Store (`AsyncLocalStorage`), der außerhalb eines echten Requests
 * nicht existiert -- der einzelne Handler braucht das nicht und ist direkt
 * mit einem Fake-Event testbar.
 */
export const handleRenamedRouteRedirect: Handle = ({ event, resolve }) => {
	const target = renamedRouteRedirectTarget(event.url.pathname);
	if (target !== null) {
		return new Response(null, {
			status: 301,
			headers: { location: target + event.url.search }
		});
	}
	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

/**
 * Story 5.9 AC-9: X-Robots-Tag: noindex,nofollow auf alle /api/*-Responses.
 * Crawl-Budget + verhindert dass Suchmaschinen JSON-Endpoints indexieren
 * falls Default-Block in robots.txt overridden wird. Komplement zum
 * meta-robots-Tag im HTML.
 *
 * Code-review fix (i18n Block A, 2026-09-26): `event.url.pathname` trägt bei
 * einem `/en/api/...`-Request den Locale-Präfix, ein nackter
 * `startsWith('/api/')`-Check hätte den Header dort verloren.
 * `basePathname()` normalisiert erst auf den präfixfreien Pfad.
 */
export const handleNoIndexHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	const path = basePathname(event.url);
	if (path.startsWith('/api/')) {
		response.headers.set('X-Robots-Tag', 'noindex,nofollow');
	}
	return response;
};

export const handle: Handle = sequence(
	handleStaleLocaleRedirect,
	handleRenamedRouteRedirect,
	handleParaglide,
	handleNoIndexHeaders
);
