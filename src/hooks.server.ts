import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace('%paraglide.lang%', locale).replace('%paraglide.dir%', getTextDirection(locale))
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

export const handle: Handle = sequence(handleParaglide, handleNoIndexHeaders);
