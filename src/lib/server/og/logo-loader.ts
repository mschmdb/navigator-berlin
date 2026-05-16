/**
 * Lädt die Brand-Logo-SVG (`static/logo-mark.svg`) als Base64-Data-URI für
 * Satori's `<img src="...">`-Embed. Build-Time only (Node-FS).
 *
 * Satori unterstützt SVG via Data-URI als `<img>`-Source; inline-`<svg>`-VDOM
 * deckt nicht den vollen SVG-Funktionsumfang ab, deshalb der Image-Pfad.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function loadLogoDataUri(
	repoRoot: string,
	filename = 'logo-mark.svg'
): Promise<string> {
	const filePath = path.join(repoRoot, 'static', filename);
	const raw = await readFile(filePath, 'utf-8');
	const base64 = Buffer.from(raw, 'utf-8').toString('base64');
	return `data:image/svg+xml;base64,${base64}`;
}
