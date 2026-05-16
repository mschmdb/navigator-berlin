import { buildWebMcpManifest } from '$lib/webmcp';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	const manifest = buildWebMcpManifest();
	return new Response(JSON.stringify(manifest, null, 2) + '\n', {
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
