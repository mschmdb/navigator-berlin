/**
 * Lädt die Brand-Logo-SVG (`static/logo-mark.svg`) als Base64-Data-URI für
 * Satori's `<img src="...">`-Embed. Build-Time only (Node-FS).
 *
 * Wichtig: resvg/satori rendern CSS-Custom-Properties (`var(--…)`) NICHT.
 * Wir ersetzen `var(--bg, #FALLBACK)` und `var(--accent, #FALLBACK)` durch
 * deren Fallback-Hex-Werte bevor wir die SVG enkodieren — sonst landet das
 * Logo als schwarzes Quadrat in der OG-Card.
 *
 * Außerdem: transparenter Hintergrund statt Brand-Hellbeige damit das Logo
 * mit dem Panel-Background harmoniert (`#ECEAE0`-Rect blendet sonst hart).
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

/** Ersetzt `var(--name, #fallback)` → `#fallback` deterministisch. */
function resolveCssVars(svg: string): string {
	return svg.replace(/var\(\s*--[a-zA-Z0-9-]+\s*,\s*([^)]+?)\s*\)/g, (_, fallback: string) =>
		fallback.trim()
	);
}

/** Macht das outer `<rect ...>`-Background transparent. */
function transparentBackground(svg: string): string {
	return svg.replace(
		/<rect width="100" height="100" fill="[^"]+" \/>/,
		'<rect width="100" height="100" fill="transparent" />'
	);
}

export async function loadLogoDataUri(
	repoRoot: string,
	filename = 'logo-mark-header.svg'
): Promise<string> {
	const filePath = path.join(repoRoot, 'static', filename);
	const raw = await readFile(filePath, 'utf-8');
	const cleaned = transparentBackground(resolveCssVars(raw));
	const base64 = Buffer.from(cleaned, 'utf-8').toString('base64');
	return `data:image/svg+xml;base64,${base64}`;
}
