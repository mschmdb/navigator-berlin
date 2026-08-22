/**
 * Geometrie und Palette des navigator.berlin-Pixel-Logos.
 * Rein dekorativ: Die Farben tragen keine Bedeutung und stellen keine Daten dar.
 *
 * Silhouette: 32-Punkte-Kontur aus `static/favicon.svg` (bezirke.geojson,
 * ODIS / Senatsverwaltung Berlin, dl-de/zero-2-0), Douglas-Peucker-vereinfacht.
 */

export interface PixelCell {
	readonly x: number;
	readonly y: number;
}

export interface PixelLogoGeometry {
	readonly cells: readonly PixelCell[];
	/** Kantenlänge einer Zelle in viewBox-Einheiten. */
	readonly size: number;
	readonly radius: number;
}

export interface PixelLogoPreset {
	/** Zellen je Achse. Unter 16 wird Berlin unlesbar, ab 32 kippt es klein in Rauschen. */
	readonly grid: number;
	/** Fugenbreite in Prozent der Zelle. */
	readonly gap: number;
	/** Eckenradius in Prozent der halben Zellbreite. */
	readonly round: number;
	/** Mindest-Deckung einer Zelle durch die Silhouette, in Prozent. */
	readonly threshold: number;
	/** Startwert des PRNG. Gleicher Wert = gleiches Bild auf Server und Client. */
	readonly seed: number;
}

const POLY: readonly (readonly [number, number])[] = [
	[49.37, 76.93],
	[24.83, 67.68],
	[13.08, 74.65],
	[8.0, 69.64],
	[17.78, 49.53],
	[11.34, 47.91],
	[15.87, 36.34],
	[12.79, 33.45],
	[23.87, 33.41],
	[24.27, 25.0],
	[29.74, 25.3],
	[32.07, 18.33],
	[35.48, 19.02],
	[34.55, 25.23],
	[41.64, 26.04],
	[55.53, 20.15],
	[53.12, 17.93],
	[56.72, 15.28],
	[62.18, 21.56],
	[60.31, 32.45],
	[78.96, 45.28],
	[73.25, 57.47],
	[84.52, 57.97],
	[91.44, 62.51],
	[92.0, 64.33],
	[87.22, 64.37],
	[89.25, 70.51],
	[77.95, 84.72],
	[77.18, 76.65],
	[56.76, 72.85],
	[54.72, 67.68],
	[49.11, 69.96]
];

/**
 * Die Silhouette als geschlossener SVG-Pfad, für gefüllte Fassungen wie das
 * Favicon. Gleiche 32 Punkte wie das Raster.
 */
export const SILHOUETTE_PATH_D: string =
	'M ' + POLY.map(([x, y]) => `${x},${y}`).join(' L ') + ' Z';

/**
 * 20 gesättigte Fremdfarben, bewusst unabhängig von den `COLORS`-Tokens in
 * `$lib/components/atlas/internal/colors.ts`. Nicht umfärben ohne Rücksprache.
 */
export const PALETTE: readonly string[] = [
	'#D4322C',
	'#F4A582',
	'#FDDBC7',
	'#2166AC',
	'#4393C3',
	'#92C5DE',
	'#1B7837',
	'#7FBC41',
	'#B8E186',
	'#762A83',
	'#9970AB',
	'#C2A5CF',
	'#E7D4E8',
	'#F7F7F7',
	'#1A1A1A',
	'#E08214',
	'#FEE0B6',
	'#8C510A',
	'#01665E',
	'#35978F'
];

/**
 * Palette ohne die blassen Tints. Das Favicon sitzt auf einer hellen Kachel und
 * rendert bei 16 px eine Zelle auf einen halben Gerätepixel. Helle Töne fallen
 * dort mit der Kachel zusammen und reißen Löcher in die Silhouette. Nur hierfür
 * gedacht, überall sonst gilt die volle Palette.
 */
export const PALETTE_STRONG: readonly string[] = PALETTE.filter(
	(color) =>
		![
			'#FDDBC7',
			'#E7D4E8',
			'#F7F7F7',
			'#FEE0B6',
			'#C2A5CF',
			'#B8E186',
			'#92C5DE',
			'#F4A582',
			'#7FBC41'
		].includes(color)
);

/** Reglerwerte aus dem Prototyp-Durchlauf vom 21.08.2026. Eingefroren. */
export const PRESET: PixelLogoPreset = {
	grid: 31,
	gap: 20,
	round: 41,
	threshold: 45,
	seed: 20260821
};

function pointInPolygon(x: number, y: number): boolean {
	let hit = false;
	for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) {
		const [xi, yi] = POLY[i];
		const [xj, yj] = POLY[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
	}
	return hit;
}

/** Anteil einer Rasterzelle, der innerhalb der Silhouette liegt (4x4-Abtastung). */
export function coverageAt(x: number, y: number, step: number): number {
	let n = 0;
	for (let a = 0; a < 4; a++) {
		for (let b = 0; b < 4; b++) {
			if (pointInPolygon(x + ((a + 0.5) / 4) * step, y + ((b + 0.5) / 4) * step)) n++;
		}
	}
	return n / 16;
}

export function buildGeometry(preset: PixelLogoPreset = PRESET): PixelLogoGeometry {
	const step = 100 / preset.grid;
	const inset = (preset.gap / 100) * step;
	const size = step - inset;
	const cells: PixelCell[] = [];
	for (let row = 0; row < preset.grid; row++) {
		for (let col = 0; col < preset.grid; col++) {
			const x = col * step;
			const y = row * step;
			if (coverageAt(x, y, step) < preset.threshold / 100) continue;
			cells.push({ x: +(x + inset / 2).toFixed(3), y: +(y + inset / 2).toFixed(3) });
		}
	}
	return { cells, size: +size.toFixed(3), radius: +(((preset.round / 100) * size) / 2).toFixed(3) };
}

/** mulberry32: klein, deterministisch, reicht für Dekoration. */
export function seededRandom(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Startfarben. Deterministisch, damit SSR-Markup und Hydration übereinstimmen. */
export function initialFills(
	count: number,
	seed: number = PRESET.seed,
	palette: readonly string[] = PALETTE
): string[] {
	const random = seededRandom(seed);
	return Array.from({ length: count }, () => palette[Math.floor(random() * palette.length)]);
}
