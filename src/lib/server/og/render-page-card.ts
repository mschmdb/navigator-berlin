/**
 * Render-Helper: Satori-VDOM → PNG. Re-use der Story-1.20-Font-Pipeline
 * (`loadDefaultOgFonts`, kein woff2, kein Variable, sequenzielles wawoff2 per
 * Memory `project_satori_font_pipeline`).
 *
 * Lazy-Imports von `satori` und `@resvg/resvg-js`: vermeidet, dass Build-Tools
 * diese in Client-Bundles ziehen (sind nur Server-Side benutzt).
 */

import { loadDefaultOgFonts, type OgFont } from '$lib/utils/og-card-renderer.js';
import type { SatoriNode } from './page-card-template.js';
import { OG_WIDTH, OG_HEIGHT } from './page-card-template.js';

export interface RenderPageCardOptions {
	readonly fonts?: readonly OgFont[];
}

export async function renderPageCardPng(
	vdom: SatoriNode,
	opts: RenderPageCardOptions = {}
): Promise<Buffer> {
	const fonts = opts.fonts ?? (await loadDefaultOgFonts());
	const { default: satori } = await import('satori');
	const { Resvg } = await import('@resvg/resvg-js');
	const svg = await satori(vdom as unknown as Parameters<typeof satori>[0], {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style }))
	});
	const resvg = new Resvg(svg);
	return Buffer.from(resvg.render().asPng());
}
