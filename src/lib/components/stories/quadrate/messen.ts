/**
 * Schriftmessung für die Zahlen im Block: Canvas `measureText` mit Jost 900.
 * Gemessen wird bei 100 px, zurück kommen Werte je Schriftgröße 1 (siehe `Metrics`).
 * Nur im Browser. Auf dem Server misst `poster-pdf` mit Font-Metriken.
 */
import type { Measure, Metrics } from '$lib/stories/wahl-quadrate/labels';
import { STORY_FONT } from '$lib/stories/tokens';

const PX = 100;
export const SQUARE_FONT = `900 ${PX}px ${STORY_FONT}`;

export type CachedMeasure = Measure & { clear(): void };

export function canvasMeasure(
	ctx: CanvasRenderingContext2D,
	font: string = SQUARE_FONT
): CachedMeasure {
	const cache = new Map<string, Metrics>();
	const measure = ((text: string): Metrics => {
		const hit = cache.get(text);
		if (hit) return hit;
		ctx.font = font;
		const t = ctx.measureText(text);
		const m: Metrics = {
			abl: t.actualBoundingBoxLeft / PX,
			w: (t.actualBoundingBoxLeft + t.actualBoundingBoxRight) / PX,
			asc: t.actualBoundingBoxAscent / PX,
			h: (t.actualBoundingBoxAscent + t.actualBoundingBoxDescent) / PX,
			adv: t.width / PX
		};
		cache.set(text, m);
		return m;
	}) as CachedMeasure;
	measure.clear = () => cache.clear();
	return measure;
}

let shared: CachedMeasure | null = null;

/** Eine Messung für alle Quadrate der Seite. `null` ohne Canvas (Server, alte Browser). */
export function sharedMeasure(): CachedMeasure | null {
	if (shared) return shared;
	if (typeof document === 'undefined') return null;
	const ctx = document.createElement('canvas').getContext('2d');
	shared = ctx ? canvasMeasure(ctx) : null;
	return shared;
}
