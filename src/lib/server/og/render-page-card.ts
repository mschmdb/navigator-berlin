/**
 * Render-Helper: Satori-VDOM → 1200×630 PNG via Supersample-then-Downsample.
 *
 * Pipeline (Vercel-Issue #60813 + cwparsons.ca-Empfehlung 2024-08-10):
 *   1. Satori → SVG bei 1200×630 (OG-Spec)
 *   2. resvg-js mit `fitTo: { mode: 'zoom', value: 2 }` → 2400×1260 PNG-Raster
 *   3. sharp lanczos3-Downsample → 1200×630 PNG (final output)
 *
 * Warum 2× rastern, dann zurück-skalieren statt direkt 2× ausliefern:
 *   - LinkedIn/Twitter re-encodieren 2400×1260 mit aggressivem JPEG-Lossy.
 *   - Satori-Text wird zu Pfaden konvertiert; sub-pixel-Jitter bei 1× direkt.
 *   - Supersample + lanczos3 = anti-aliased crisp Text bei 1200×630 (Spec).
 *
 * Font-Pipeline aus Story 1.20 (Memory `project_satori_font_pipeline`).
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
	const sharpMod = await import('sharp');
	const sharp = sharpMod.default;

	const svg = await satori(vdom as unknown as Parameters<typeof satori>[0], {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style }))
	});

	const resvg = new Resvg(svg, {
		fitTo: { mode: 'zoom', value: 2 },
		shapeRendering: 2,
		textRendering: 2
	});
	const supersampled = Buffer.from(resvg.render().asPng());

	const downsampled = await sharp(supersampled)
		.resize(OG_WIDTH, OG_HEIGHT, { kernel: 'lanczos3', fit: 'fill' })
		.png({ compressionLevel: 9, adaptiveFiltering: true })
		.toBuffer();

	return downsampled;
}
