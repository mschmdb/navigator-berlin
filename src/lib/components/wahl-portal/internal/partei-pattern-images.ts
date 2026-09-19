/**
 * Story 4 (Winner-Map, Achromatopsie-Muster): erzeugt deterministische
 * Pixel-Bitmaps (ImageData-Rohdaten) pro Partei-Pattern-Typ
 * (`solid`/`stripes`/`dots`/`diagonal`, `partei-farben.ts`), registrierbar
 * über MapLibre `map.addImage` als `fill-pattern`.
 *
 * `buildPatternImageData` ist reines TS (kein Canvas/DOM), damit es ohne
 * Browser getestet werden kann; nur `toImageData`/`registerPartyPatterns`
 * fassen den `ImageData`-Constructor an (browser-only, aus onMount gerufen).
 */
import { parteiColor, parteiPattern, type Pattern } from '$lib/data/partei-farben.js';
import { normalizeSlug } from '$lib/data/internal/slug.js';

export const PATTERN_TILE_SIZE = 16;

export interface PatternImageSpec {
	readonly width: number;
	readonly height: number;
	/** RGBA, 4 Bytes pro Pixel, row-major (kompatibel zu `ImageData`). */
	readonly data: Uint8ClampedArray;
}

function hexToRgb(hex: string): readonly [number, number, number] {
	const clean = hex.replace('#', '');
	const value = Number.parseInt(clean, 16);
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function setPixel(
	data: Uint8ClampedArray,
	width: number,
	x: number,
	y: number,
	rgb: readonly [number, number, number]
): void {
	const idx = (y * width + x) * 4;
	data[idx] = rgb[0];
	data[idx + 1] = rgb[1];
	data[idx + 2] = rgb[2];
	data[idx + 3] = 255;
}

/**
 * Baut die Pixel-Rohdaten für ein Pattern-Tile (RGBA, `size`×`size`).
 * `solid` füllt vollständig (entspricht optisch reiner Farbfläche);
 * `stripes` horizontale 2px-Streifen, `dots` Punktraster, `diagonal`
 * 45°-Streifen. Nicht gesetzte Pixel bleiben transparent (Alpha 0).
 */
export function buildPatternImageData(
	pattern: Pattern,
	hexColor: string,
	size: number = PATTERN_TILE_SIZE
): PatternImageSpec {
	const rgb = hexToRgb(hexColor);
	const data = new Uint8ClampedArray(size * size * 4);

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const paint = shouldPaint(pattern, x, y);
			if (paint) setPixel(data, size, x, y, rgb);
		}
	}
	return { width: size, height: size, data };
}

function shouldPaint(pattern: Pattern, x: number, y: number): boolean {
	switch (pattern) {
		case 'solid':
			return true;
		case 'stripes':
			return Math.floor(y / 2) % 2 === 0;
		case 'diagonal':
			return (x + y) % 4 < 2;
		case 'dots': {
			const cx = (x % 8) - 3.5;
			const cy = (y % 8) - 3.5;
			return cx * cx + cy * cy <= 4;
		}
	}
}

/** Stabile MapLibre-Image-ID pro Partei (normalisierter Kurzname). */
export function patternImageId(parteiKurzname: string): string {
	return `wahl-partei-pattern-${normalizeSlug(parteiKurzname)}`;
}

/** Wandelt eine Pattern-Spec in echtes `ImageData` (browser-only). */
export function toImageData(spec: PatternImageSpec): ImageData {
	// `Uint8ClampedArray`s generischer Buffer-Typ (`ArrayBufferLike`) ist enger als der
	// `ImageData`-Constructor-Overload (`ArrayBuffer`) erwartet, obwohl zur Laufzeit immer
	// ein echtes `ArrayBuffer` vorliegt (kein SharedArrayBuffer). Lib-Typing-Lücke, kein
	// echter Typ-Fehler.
	return new ImageData(spec.data as Uint8ClampedArray<ArrayBuffer>, spec.width, spec.height);
}

export interface PatternAddImageMap {
	hasImage: (id: string) => boolean;
	addImage: (id: string, image: ImageData) => void;
}

/**
 * Registriert die Pattern-Sprites der übergebenen Parteien bei MapLibre.
 * Idempotent (wie `registerPinIcons`/`registerScoreDots`): bereits
 * registrierte IDs werden übersprungen.
 */
export function registerPartyPatterns(
	map: PatternAddImageMap,
	parteien: readonly string[]
): void {
	for (const partei of parteien) {
		const id = patternImageId(partei);
		if (map.hasImage(id)) continue;
		const spec = buildPatternImageData(parteiPattern(partei), parteiColor(partei));
		map.addImage(id, toImageData(spec));
	}
}
