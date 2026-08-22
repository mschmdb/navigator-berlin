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

/**
 * Zieht die viewBox auf die tatsächlich belegte Fläche zusammen. Das Raster lässt
 * oben und unten je rund 16 Einheiten frei; ohne Crop sitzt die Bildmarke in der
 * OG-Card versetzt unter ihrer Baseline.
 *
 * Die Grenzen kommen aus den Zellen selbst statt aus fest eingetragenen Werten.
 * Ein Neubau über `pnpm logo:pixel` mit anderem Raster verschiebt sie sonst, ohne
 * dass es jemand merkt, und die Marke wird angeschnitten.
 */
function cropViewBox(svg: string): string {
	const cells = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/g)];
	if (cells.length === 0) return svg;

	const pad = 2;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const [, x, y, size] of cells) {
		minX = Math.min(minX, Number(x));
		minY = Math.min(minY, Number(y));
		maxX = Math.max(maxX, Number(x) + Number(size));
		maxY = Math.max(maxY, Number(y) + Number(size));
	}
	const box = [
		Math.max(0, minX - pad),
		Math.max(0, minY - pad),
		Math.min(100, maxX + pad) - Math.max(0, minX - pad),
		Math.min(100, maxY + pad) - Math.max(0, minY - pad)
	]
		.map((n) => +n.toFixed(3))
		.join(' ');
	return svg.replace(/viewBox="0 0 100 100"/, `viewBox="${box}"`);
}

/** Datei-unabhängige Aufbereitung: CSS-Vars auflösen, Fläche entfernen, zuschneiden. */
export function prepareLogoSvg(raw: string): string {
	return cropViewBox(transparentBackground(resolveCssVars(raw)));
}

export async function loadLogoDataUri(
	repoRoot: string,
	filename = 'logo-mark-header.svg'
): Promise<string> {
	const filePath = path.join(repoRoot, 'static', filename);
	const raw = await readFile(filePath, 'utf-8');
	const base64 = Buffer.from(prepareLogoSvg(raw), 'utf-8').toString('base64');
	return `data:image/svg+xml;base64,${base64}`;
}
