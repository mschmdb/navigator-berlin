import type { RequestHandler } from './$types';

export const prerender = true;

/**
 * Story 2.1 AC-5: robots.txt with Allow-All and a Sitemap reference to the
 * sitemap-index. All pages indexable in production. `_dev/` routes are excluded
 * from the production build (`prerender = false`) and from the sitemap, so they
 * never receive a Disallow rule.
 */
export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;
	const body = [
		'User-agent: *',
		'Allow: /',
		'',
		`Sitemap: ${origin}/sitemap.xml`,
		''
	].join('\n');
	return new Response(body, {
		status: 200,
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};
