import type { RequestHandler } from './$types';

// Phase-1-Stub: satori + @resvg/resvg-js Native-Pipeline blockt adapter-node-Bundling.
// Re-enable in Story 4.6/4.7 wenn Build-Setup für Native-Module stabilisiert ist
// (entweder Migration zu @resvg/resvg-wasm oder Rollup-external-Workaround).
// Memory: project_satori_font_pipeline.

export const GET: RequestHandler = () =>
	new Response('OG share renderer disabled in Phase 1', {
		status: 503,
		headers: { 'Cache-Control': 'no-store' }
	});
