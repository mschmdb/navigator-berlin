import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { staleLocaleRedirectTarget } from '$lib/seo/stale-locale-redirect';
import { renamedRouteRedirectTarget } from '$lib/seo/renamed-route-redirect';

/**
 * 301 stale locale-prefixed URLs (`/de/…`, `/es/…`, …) onto the prefix-less DE
 * canonical. These were indexed under the pre-Phase-1 multi-locale scheme and
 * now 404 (memory `project_i18n_phase_1_de_only` + `project_paraglide_reroute`).
 * Runs before Paraglide so the redirect happens prior to locale resolution.
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
 */
const handleRenamedRouteRedirect: Handle = ({ event, resolve }) => {
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
 * Story 5.9 AC-9: X-Robots-Tag: noindex,nofollow auf alle /api/* und /_dev/*
 * Responses. Crawl-Budget + verhindert dass Suchmaschinen JSON-Endpoints oder
 * Dev-Showcase-Pages indexieren falls Default-Block in robots.txt overridden
 * wird. Komplement zum meta-robots-Tag im HTML.
 */
const handleNoIndexHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	const path = event.url.pathname;
	if (path.startsWith('/api/') || path.startsWith('/_dev/')) {
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
