import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { JostWeight } from './jost';

const WEIGHTS: readonly JostWeight[] = [400, 900];
const FONT_DIR = path.join(process.cwd(), 'node_modules/@fontsource/jost/files');
const TTF_DIR = path.join(os.tmpdir(), 'navigator-berlin-jost');

let ttfFiles: Promise<string[]> | null = null;

/** Dateiname mit Inhalts-Hash: eine neue Jost-Version landet nie in einer alten Cache-Datei. */
export function ttfName(weight: JostWeight, woff2: Buffer): string {
	const hash = createHash('sha256').update(woff2).digest('hex').slice(0, 16);
	return `jost-latin-${weight}-normal-${hash}.ttf`;
}

/**
 * resvg liest nur TTF/OTF. Die woff2-Schnitte aus @fontsource entpackt wawoff2 einmal pro
 * Prozess in ein Temp-Verzeichnis. Nacheinander, weil wawoff2 WASM-Speicher teilt.
 */
function jostTtfFiles(): Promise<string[]> {
	ttfFiles ??= (async () => {
		const { decompress } = await import('wawoff2');
		mkdirSync(TTF_DIR, { recursive: true });
		const files: string[] = [];
		for (const w of WEIGHTS) {
			const woff2 = readFileSync(path.join(FONT_DIR, `jost-latin-${w}-normal.woff2`));
			const file = path.join(TTF_DIR, ttfName(w, woff2));
			if (!existsSync(file)) {
				// Erst unter eigenem Namen schreiben, dann umbenennen: parallele Builds lesen nie halbe Dateien.
				const part = `${file}.${process.pid}.part`;
				writeFileSync(part, Buffer.from(await decompress(woff2)));
				renameSync(part, file);
			}
			files.push(file);
		}
		return files;
	})();
	return ttfFiles;
}

/** Rastert ein SVG mit Jost als einziger Schrift auf die Zielbreite. */
export async function svgToPng(svg: string, width: number): Promise<Buffer> {
	const { Resvg } = await import('@resvg/resvg-js');
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: width },
		font: { loadSystemFonts: false, fontFiles: await jostTtfFiles(), defaultFontFamily: 'Jost' },
		shapeRendering: 2,
		textRendering: 2
	});
	return Buffer.from(resvg.render().asPng());
}
