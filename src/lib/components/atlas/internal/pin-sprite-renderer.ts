import { rampForSlug, SCORE_DOT_BASE_PX, scoreDotImageId } from './dimension-ramps.js';
import type { PinIconSpec, SvgNode } from './pin-icon-mapping.js';

// Hintergrund-Token --bg-elevated aus src/app.css. Duplikat hier weil Canvas-Rendering
// keine CSS-Vars liest. Sync bei Theme-Aenderung pflegen.
const PIN_BG_HEX = '#F5F3EA';

const PIN_VIEW_BOX = 28;
const CIRCLE_CX = 14;
const CIRCLE_CY = 14;
const CIRCLE_R = 12.5;
const CIRCLE_STROKE = 1;
const ICON_OFFSET = 6; // (28 - 16) / 2 = 6 — zentriert 16er-Icon-Subview im 28er-Pin.
const ICON_SUBSIZE = 16;

function serializeAttrs(attrs: Readonly<Record<string, string | number>>): string {
	return Object.entries(attrs)
		.map(([k, v]) => `${k}="${v}"`)
		.join(' ');
}

function serializeNode(node: SvgNode): string {
	return `<${node.tag} ${serializeAttrs(node.attrs)} />`;
}

/**
 * Baut deterministisches SVG fuer einen Pin (Story 1.15 AC-1).
 * Layout: 28x28 viewBox, weisser Background-Kreis r=12.5 + 1px Color-Outline,
 * Lucide-Icon (24-Unit-Native) embedded als nested <svg width=16 height=16> mit Color-Stroke.
 */
export function buildPinSvg(spec: PinIconSpec, hexColor: string): string {
	const innerNodes = spec.svgNodes.map(serializeNode).join('');
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIN_VIEW_BOX} ${PIN_VIEW_BOX}" width="${PIN_VIEW_BOX}" height="${PIN_VIEW_BOX}">` +
		`<circle cx="${CIRCLE_CX}" cy="${CIRCLE_CY}" r="${CIRCLE_R}" fill="${PIN_BG_HEX}" stroke="${hexColor}" stroke-width="${CIRCLE_STROKE}" />` +
		`<svg x="${ICON_OFFSET}" y="${ICON_OFFSET}" width="${ICON_SUBSIZE}" height="${ICON_SUBSIZE}" viewBox="0 0 24 24" fill="none" stroke="${hexColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
		innerNodes +
		`</svg></svg>`
	);
}

export function pinImageId(slug: string): string {
	return `navigator-pin-${slug}`;
}

/**
 * Wandelt eine Pin-Spec in ein bitmapped <img>-Element (Browser-only).
 * Reuse als Source fuer MapLibre `map.addImage`.
 */
export function loadPinImage(spec: PinIconSpec, hexColor: string): Promise<HTMLImageElement> {
	const svg = buildPinSvg(spec, hexColor);
	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			reject(e instanceof Error ? e : new Error('Pin-Sprite-Load fehlgeschlagen'));
		};
		img.src = url;
	});
}

export interface PinAddImageMap {
	hasImage: (id: string) => boolean;
	addImage: (id: string, image: HTMLImageElement | ImageData) => void;
}

/**
 * Registriert alle Pin-Sprites bei der MapLibre-Instanz.
 * Idempotent: bereits registrierte IDs werden uebersprungen.
 */
export async function registerPinIcons(
	map: PinAddImageMap,
	iconMap: Readonly<Record<string, PinIconSpec>>,
	colorResolver: (token: PinIconSpec['colorToken']) => string
): Promise<void> {
	const tasks = Object.entries(iconMap).map(async ([slug, spec]) => {
		const id = pinImageId(slug);
		if (map.hasImage(id)) return;
		const img = await loadPinImage(spec, colorResolver(spec.colorToken));
		if (map.hasImage(id)) return;
		map.addImage(id, img);
	});
	await Promise.all(tasks);
}

/**
 * Punktsymbol der sekundären Score-Dimension: gefüllter Kreis in der
 * Dimensionsfarbe mit hellem Rand, Basisgröße geteilt mit den
 * icon-size-Faktoren aus dimension-ramps.
 */
export function buildScoreDotSvg(hexColor: string): string {
	const half = SCORE_DOT_BASE_PX / 2;
	const radius = half - 1.5;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SCORE_DOT_BASE_PX} ${SCORE_DOT_BASE_PX}" width="${SCORE_DOT_BASE_PX}" height="${SCORE_DOT_BASE_PX}">` +
		`<circle cx="${half}" cy="${half}" r="${radius}" fill="${hexColor}" stroke="#ECEAE0" stroke-width="1.5" />` +
		`</svg>`
	);
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			reject(e instanceof Error ? e : new Error('Score-Dot-Sprite-Load fehlgeschlagen'));
		};
		img.src = url;
	});
}

/**
 * Registriert die Kreis-Sprites aller Score-Dimensionen bei MapLibre.
 * Idempotent wie registerPinIcons; Farbe = dunkler Anker der Dimension-Rampe.
 */
export async function registerScoreDots(
	map: PinAddImageMap,
	slugs: readonly string[]
): Promise<void> {
	const tasks = slugs.map(async (slug) => {
		const ramp = rampForSlug(slug);
		if (!ramp) return;
		const id = scoreDotImageId(slug);
		if (map.hasImage(id)) return;
		const img = await loadSvgImage(buildScoreDotSvg(ramp[4]));
		if (map.hasImage(id)) return;
		map.addImage(id, img);
	});
	await Promise.all(tasks);
}
