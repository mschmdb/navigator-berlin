/**
 * Lädt `logo-mark.svg` (Berlin-Außenkontur als Wireframe-Modell) als data-URI
 * für Satori-`<img>`-Watermark.
 *
 * Unterschied zu `logo-loader.ts`: bewahrt die original-niedrige Stroke-Opacity
 * (0.4) der nicht-Header-Variante, damit das Logo als faint-Background-Element
 * funktioniert, nicht als Brand-Mark.
 *
 * Build-Time only (Node-FS).
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

function resolveCssVars(svg: string): string {
	return svg.replace(/var\(\s*--[a-zA-Z0-9-]+\s*,\s*([^)]+?)\s*\)/g, (_, fallback: string) =>
		fallback.trim()
	);
}

function transparentBackground(svg: string): string {
	return svg.replace(
		/<rect width="100" height="100" fill="[^"]+" \/>/,
		'<rect width="100" height="100" fill="transparent" />'
	);
}

export async function loadWatermarkDataUri(repoRoot: string): Promise<string> {
	const filePath = path.join(repoRoot, 'static', 'logo-mark.svg');
	const raw = await readFile(filePath, 'utf-8');
	const cleaned = transparentBackground(resolveCssVars(raw));
	const base64 = Buffer.from(cleaned, 'utf-8').toString('base64');
	return `data:image/svg+xml;base64,${base64}`;
}
