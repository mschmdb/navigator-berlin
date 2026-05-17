import { buildWebMcpManifest } from '$lib/webmcp';
import type { RequestHandler } from './$types';

/**
 * /.well-known/webmcp.json
 *
 * Inoffizielle Konvention für MCP-Discovery via `/.well-known/`-Pfad (analog zu
 * /.well-known/security.txt, /.well-known/openid-configuration). Spiegelt
 * /webmcp-manifest.json, damit Clients die übliche Discovery-Heuristik
 * benutzen können ohne Out-of-Band-URL-Wissen.
 *
 * Wenn W3C einen anderen Pfad standardisiert, hier umpoint'n.
 */
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
