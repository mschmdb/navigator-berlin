import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

/**
 * Story 5.9 AC-10: IndexNow-Key-File-Endpoint.
 *
 * Bing verifiziert Ownership ueber GET https://navigator.berlin/{key}.txt das
 * `{key}` als Body zurueck liefert. Wir matchen den dynamischen Param gegen
 * `INDEXNOW_KEY` aus .env (Bitwarden) und liefern denselben Key zurueck. Bei
 * Mismatch 404.
 *
 * Pattern `[key].txt` matched alle Top-Level-`.txt`-Requests. robots.txt
 * + llms.txt liegen unter expliziten Routes davor → SvelteKit-Router prefer
 * konkret. Safety: zusaetzlich Pfad-Filter falls jemand einen Konflikt baut.
 */
export const prerender = false;

const RESERVED = new Set(['robots', 'llms', 'llms-full', 'humans', 'security']);

export const GET: RequestHandler = ({ params }) => {
	const key = (params.key ?? '').toLowerCase();
	if (RESERVED.has(key)) error(404, 'reserved');
	const indexNowKey = env.INDEXNOW_KEY;
	if (!indexNowKey) error(404, 'indexnow not configured');
	if (key !== indexNowKey.toLowerCase()) error(404, 'unknown key');
	return new Response(indexNowKey, {
		status: 200,
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600',
			'x-robots-tag': 'noindex,nofollow'
		}
	});
};
