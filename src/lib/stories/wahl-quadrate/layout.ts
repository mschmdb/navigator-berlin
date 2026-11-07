import { ORDER, REST_INDEX } from './parteien';

/** Kantenlänge des Quadrats im viewBox-Raster. */
export const SIDE = 100;

export type OrderMode = 'fixed' | 'size';

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface Block extends Rect {
	/** Spalten-Block: Außenbeschriftung unter dem Quadrat. Sonst Streifen: rechts daneben. */
	col: boolean;
}

export interface LayoutOptions {
	/** Wahlbeteiligung 0..1. Gesetzt: Quadrat = Wahlberechtigte, die Stimmen füllen nur einen Teil. */
	turnout?: number | null;
	/** Reihenfolge der Parteiindizes, siehe `orderOf`. */
	order?: readonly number[];
}

function region(turnout: number | null | undefined): Rect {
	if (turnout == null) return { x: 0, y: 0, w: SIDE, h: SIDE };
	if (!(turnout >= 0 && turnout <= 1)) throw new RangeError(`turnout außerhalb 0..1: ${turnout}`);
	return { x: 0, y: 0, w: SIDE * turnout, h: SIDE };
}

/**
 * Treemap Slice-and-dice: gerade Position schneidet senkrecht, ungerade waagerecht.
 * Ein Rechteck pro Partei in `ORDER`, indiziert nach Partei (nicht nach Position).
 * Fläche = Anteil / Summe der Anteile * Fläche der Region.
 */
export function layout(shares: readonly number[], opts: LayoutOptions = {}): Block[] {
	const n = ORDER.length;
	if (shares.length !== n) throw new RangeError(`erwarte ${n} Anteile, bekam ${shares.length}`);
	const ord = opts.order ?? ORDER.map((_, i) => i);
	const tot = shares.reduce((s, v) => s + v, 0) || 1;
	const R = region(opts.turnout);
	const out: Block[] = new Array(n);

	let r: Rect = { ...R };
	let rem = tot;
	ord.forEach((i, p) => {
		const f = p === n - 1 || rem <= 0 ? 1 : shares[i] / rem;
		if (p % 2 === 0) {
			const w = r.w * f;
			out[i] = { x: r.x, y: r.y, w, h: r.h, col: true };
			r = { x: r.x + w, y: r.y, w: r.w - w, h: r.h };
		} else {
			const h = r.h * f;
			out[i] = { x: r.x, y: r.y, w: r.w, h, col: false };
			r = { x: r.x, y: r.y + h, w: r.w, h: r.h - h };
		}
		rem -= shares[i];
	});
	return out;
}

/** `fixed`: feste Plätze. `size`: größte Partei vorn, Gleichstand nach Index, Grau bleibt zuletzt. */
export function orderOf(shares: readonly number[], mode: OrderMode): number[] {
	const idx = ORDER.map((_, i) => i);
	if (mode !== 'size') return idx;
	return idx
		.slice(0, REST_INDEX)
		.sort((p, q) => shares[q] - shares[p] || p - q)
		.concat(REST_INDEX);
}
