import type { Block, Rect } from './layout';
import type { Lang } from './grau';
import { textOn } from './kontrast';

/**
 * Tinten-Box eines Textes bei Schriftgröße 1, gemessen ab dem Text-Ursprung.
 * Browser: Canvas `measureText` (actualBoundingBox*). Server: Font-Metriken.
 */
export interface Metrics {
	/** actualBoundingBoxLeft */
	abl: number;
	/** Breite der Tinte (left + right) */
	w: number;
	/** actualBoundingBoxAscent */
	asc: number;
	/** Höhe der Tinte (ascent + descent) */
	h: number;
	/** Vorschubbreite, nötig für `text-anchor="middle"` */
	adv: number;
}

export type Measure = (text: string) => Metrics;

export interface LabelOptions {
	/** Pixel pro viewBox-Einheit (Quadratbreite in px / 100). */
	scale: number;
	measure: Measure;
	/** Gezeichnete Füllfarbe je Block. `null` = Block verborgen, keine Zahl. */
	fills: readonly (string | null)[];
	/** Schmale Ansicht: nur Zahlen im Block, Mindestgröße 2 px, kleiner Einzug. */
	insideOnly?: boolean;
	/** Export (Plakat, Video): Mindestgröße 17 px innen und außen. */
	exportMode?: boolean;
	/** Eigene Mindestgröße in Pixeln, z. B. 2 mm im Druck. Kleinere Zahlen entfallen mit `insideOnly`. */
	minPx?: number;
}

export interface Line {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface InsideLabel {
	i: number;
	text: string;
	fontSize: number;
	/** Text-Ursprung, Transformation: translate(x y) rotate(rotate) */
	x: number;
	y: number;
	rotate: 0 | -90;
	fill: string;
	/** Tinten-Box im viewBox-Raum */
	box: Rect;
}

export interface OutsideLabel {
	i: number;
	text: string;
	fontSize: number;
	x: number;
	y: number;
	anchor: 'middle' | 'start';
	line: Line;
	box: Rect;
}

export interface Labels {
	inside: InsideLabel[];
	outside: OutsideLabel[];
}

const SAFE = 0.985;
const MAX_FONT = 30;

const PCT: Record<Lang, string> = { de: ' %', en: '%' };

/** Zahl im Block: ganzzahlig, unter 1 % als „<1“, ohne Anteil `null`. */
export function shareTexts(shares: readonly number[], lang: Lang): (string | null)[] {
	return shares.map((v) => (v > 0 ? (Math.round(v * 100) || '<1') + PCT[lang] : null));
}

interface Pending {
	i: number;
	r: Block;
	text: string;
	m: Metrics;
}

/**
 * Setzt jede Zahl in ihren Block, gedreht oder waagerecht. Passt sie nicht mit Mindestgröße,
 * steht sie klein außerhalb mit Linie: Spalten-Blöcke unter dem Quadrat, Streifen rechts.
 */
export function placeLabels(
	blocks: readonly Block[],
	texts: readonly (string | null)[],
	opts: LabelOptions
): Labels {
	const { scale, measure, fills } = opts;
	if (!(scale > 0)) throw new RangeError(`scale muss positiv sein: ${scale}`);
	const io = opts.insideOnly ?? false;
	const exp = opts.exportMode ?? false;
	const minF = (opts.minPx ?? (exp ? 17 : io ? 2 : 10)) / scale;
	const inset = Math.max(io ? 0.4 : 0.8, (io ? 1.5 : 3.5) / scale);
	const fl = (exp ? 17 : 11) / scale;

	const inside: InsideLabel[] = [];
	const outside: OutsideLabel[] = [];
	const colOut: Pending[] = [];
	const slabOut: Pending[] = [];
	const rb = Math.max(...blocks.map((r) => r.y + r.h));
	const rr = Math.max(...blocks.map((r) => r.x + r.w));

	blocks.forEach((r, i) => {
		const text = texts[i];
		const fill = fills[i];
		if (fill == null || text == null || r.w * scale < 0.25 || r.h * scale < 0.25) return;
		const m = measure(text);
		const base = Math.min(MAX_FONT, 0.38 * Math.sqrt(r.w * r.h));
		const fh = Math.min(base, (r.w - 2 * inset) / m.w, (r.h - 2 * inset) / m.h) * SAFE;
		const fv = Math.min(base, (r.h - 2 * inset) / m.w, (r.w - 2 * inset) / m.h) * SAFE;
		const rot = fv > fh * 1.5;
		const fs = rot ? fv : fh;
		if (fs >= minF) {
			const box: Rect = rot
				? { x: r.x + inset, y: r.y + r.h - inset - m.w * fs, w: m.h * fs, h: m.w * fs }
				: { x: r.x + inset, y: r.y + inset, w: m.w * fs, h: m.h * fs };
			inside.push({
				i,
				text,
				fontSize: fs,
				x: rot ? r.x + inset + m.asc * fs : r.x + inset + m.abl * fs,
				y: rot ? r.y + r.h - inset - m.abl * fs : r.y + inset + m.asc * fs,
				rotate: rot ? -90 : 0,
				fill: textOn(fill),
				box
			});
		} else if (!io) (r.col ? colOut : slabOut).push({ i, r, text, m });
	});

	const L = fl * 0.9;

	colOut.sort((p, q) => p.r.x - q.r.x);
	const tiers = [
		{ px: -1e9, pw: 0 },
		{ px: -1e9, pw: 0 }
	];
	for (const c of colOut) {
		const w = c.m.adv * fl;
		const cx = c.r.x + c.r.w / 2;
		const gap = fl * 0.7;
		const cand = tiers.map((t) => Math.max(cx, t.px + (t.pw + w) / 2 + gap));
		const k = cand[1] < cand[0] - fl * 0.5 ? 1 : 0;
		const x = cand[k];
		tiers[k] = { px: x, pw: w };
		const ty = rb + L + k * fl * 1.4;
		const y = ty + c.m.asc * fl;
		const left = x - w / 2 - c.m.abl * fl;
		outside.push({
			i: c.i,
			text: c.text,
			fontSize: fl,
			x,
			y,
			anchor: 'middle',
			line: { x1: cx, y1: rb, x2: x, y2: ty - fl * 0.15 },
			box: { x: left, y: y - c.m.asc * fl, w: c.m.w * fl, h: c.m.h * fl }
		});
	}

	slabOut.sort((p, q) => p.r.y - q.r.y);
	const ys: number[] = [];
	let py = -1e9;
	for (const c of slabOut) {
		const y = Math.max(c.r.y + c.r.h / 2, py + fl * 1.4, (c.m.asc * fl) / 2 + 0.3);
		ys.push(y);
		py = y;
	}
	for (let j = ys.length - 1, lim = rb - fl * 0.8; j >= 0; j--, lim = ys[j + 1] - fl * 1.4)
		if (ys[j] > lim) ys[j] = lim;
	slabOut.forEach((c, j) => {
		const cy = c.r.y + c.r.h / 2;
		const x = rr + L * 1.2 + c.m.abl * fl;
		const y = ys[j] + (c.m.asc * fl) / 2;
		outside.push({
			i: c.i,
			text: c.text,
			fontSize: fl,
			x,
			y,
			anchor: 'start',
			line: { x1: rr, y1: cy, x2: rr + L, y2: ys[j] },
			box: { x: x - c.m.abl * fl, y: y - c.m.asc * fl, w: c.m.w * fl, h: c.m.h * fl }
		});
	});

	return { inside, outside };
}
