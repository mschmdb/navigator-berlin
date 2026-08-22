/**
 * scripts/generate-pixel-logo.ts
 *
 * Schreibt die statischen SVG-Fassungen des Pixel-Logos aus dem eingefrorenen
 * Preset in `static/`. Geometrie, Palette und PRNG kommen aus
 * `src/lib/data/pixel-logo-geometry.ts`, damit Komponente und Dateien nie
 * auseinanderlaufen.
 *
 * Rein dekorativ: Die Farben tragen keine Daten und keine Bedeutung.
 *
 * Run: `pnpm logo:pixel`
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	buildGeometry,
	initialFills,
	PRESET,
	SILHOUETTE_PATH_D,
	type PixelLogoPreset
} from '../src/lib/data/pixel-logo-geometry.js';

const DESC =
	'Berlin-Silhouette als Farbraster. Dekorativ, keine Daten. Silhouette: Bezirksgrenzen aus bezirke.geojson (ODIS / Senatsverwaltung Berlin, dl-de/zero-2-0), Douglas-Peucker-vereinfacht.';

export interface PixelSvgOptions {
	readonly preset?: PixelLogoPreset;
	/** Grundfläche hinter dem Raster. Ohne Angabe bleibt der Hintergrund transparent. */
	readonly background?: string;
	/**
	 * Jede Zelle als eigenes `<rect>` statt `<use>` auf eine gemeinsame Definition.
	 * Nötig für resvg/Satori in den OG-Karten, die keine Referenzen auflösen sollen.
	 * Kostet rund das Doppelte an Bytes, was Build-Time-Assets nicht stört.
	 */
	readonly flat?: boolean;
}

export function renderPixelSvg(options: PixelSvgOptions = {}): string {
	if (options.background && !/^#[0-9A-Fa-f]{6}$/.test(options.background)) {
		throw new Error(`background muss ein Hex-Farbwert sein (#RRGGBB): ${options.background}`);
	}
	const preset = options.preset ?? PRESET;
	const { cells, size, radius } = buildGeometry(preset);
	const fills = initialFills(cells.length, preset.seed);

	const byColor = new Map<string, string[]>();
	cells.forEach((cell, i) => {
		const shape = options.flat
			? `<rect x="${cell.x}" y="${cell.y}" width="${size}" height="${size}" rx="${radius}"/>`
			: `<use href="#p" x="${cell.x}" y="${cell.y}"/>`;
		const bucket = byColor.get(fills[i]);
		if (bucket) bucket.push(shape);
		else byColor.set(fills[i], [shape]);
	});

	// Gruppieren nach Farbe spart rund zwei Drittel Dateigröße.
	const groups = [...byColor]
		.map(([fill, shapes]) => `\t<g fill="${fill}">${shapes.join('')}</g>`)
		.join('\n');
	const defs = options.flat
		? ''
		: `\t<defs><rect id="p" width="${size}" height="${size}" rx="${radius}"/></defs>\n`;
	// Die Form `<rect width="100" height="100" ...>` bleibt exakt so stehen:
	// `src/lib/server/og/logo-loader.ts` erkennt die Grundfläche daran.
	const backdrop = options.background
		? `\t<rect width="100" height="100" fill="${options.background}" />\n`
		: '';

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="navigator.berlin">
\t<title>navigator.berlin</title>
\t<desc>${DESC}</desc>
${defs}${backdrop}${groups}
</svg>
`;
}

interface Target {
	readonly file: string;
	readonly options: PixelSvgOptions;
	readonly note: string;
}

const TARGETS: readonly Target[] = [
	{ file: 'logo-pixel.svg', options: {}, note: 'Master, transparent' },
	{
		file: 'logo-pixel-light.svg',
		options: { background: '#ECEAE0' },
		note: 'Master auf Hellbeige'
	},
	{ file: 'logo-pixel-dark.svg', options: { background: '#14161F' }, note: 'Master auf Dunkel' },
	{ file: 'logo-mark.svg', options: { flat: true }, note: 'Master flach, OG-Watermark' },
	{ file: 'logo-mark-header.svg', options: { flat: true }, note: 'Master flach, OG-Brand-Mark' }
];

/**
 * Favicon: die Silhouette als gefüllte beige Fläche auf indigo Kachel. Das
 * Raster liest sich bei 16 px nicht, eine gefüllte Form schon. Negativ auf
 * Akzentfarbe trägt im Tab am weitesten.
 */
export function renderFaviconSvg(): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="navigator.berlin">
\t<title>navigator.berlin</title>
\t<desc>Berlin-Silhouette, gefüllt. Kontur aus bezirke.geojson (ODIS / Senatsverwaltung Berlin, dl-de/zero-2-0), Douglas-Peucker-vereinfacht.</desc>
\t<rect width="100" height="100" rx="14" fill="#2A3F7C" />
\t<path d="${SILHOUETTE_PATH_D}" fill="#ECEAE0" />
</svg>
`;
}

function main(): void {
	const staticDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'static');
	for (const target of TARGETS) {
		const svg = renderPixelSvg(target.options);
		writeFileSync(path.join(staticDir, target.file), svg, 'utf-8');
		process.stdout.write(
			`${target.file.padEnd(24)} ${String(svg.length).padStart(6)} B  ${target.note}\n`
		);
	}
	const favicon = renderFaviconSvg();
	writeFileSync(path.join(staticDir, 'favicon.svg'), favicon, 'utf-8');
	process.stdout.write(
		`${'favicon.svg'.padEnd(24)} ${String(favicon.length).padStart(6)} B  Browser-Tab: Silhouette auf Indigo\n`
	);
}

if (process.argv[1] && /generate-pixel-logo\.(ts|js)$/.test(process.argv[1])) main();
