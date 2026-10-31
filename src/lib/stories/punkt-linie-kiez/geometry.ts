import { scaleMarks } from './scales';
import { BAR_HEIGHT, VIEW, type Geometrie, type Kennzahlen } from './types';

const BAR_SEARCH_TRIES = 200;
const CENTER = VIEW / 2;
/** Abstand der Formen zum Rand, damit Konturen nicht anschneiden. */
const MARGIN = 2;
const clampTo = (v: number, lo: number, hi: number): number =>
	Math.min(Math.max(v, lo), Math.max(lo, hi));

/** Gleicher Seed (Slug) ergibt dieselbe Folge in [0, 1). */
export function seededRandom(seed: string): () => number {
	let h = 2166136261;
	for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
	return () => {
		h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
		return (h >>> 0) / 4294967296;
	};
}

/**
 * Platziert die Zeichen eines Bezirks oder Kiezes deterministisch im 200er-Feld.
 * Fehlende Werte lassen ihre Form weg, die Zufallsfolge bleibt dieselbe.
 * Dadurch bleiben Kreis, Quadrat und Dreieck an ihrem Platz. Donut und Balken
 * weichen den vorhandenen Formen aus und können sich verschieben.
 * Alle Formen liegen am Ende vollständig im Feld.
 */
export function geometry(k: Kennzahlen): Geometrie {
	const marks = scaleMarks(k);
	const circleR = marks.circleR;
	const sq = marks.squareSize;
	const tri = marks.triangleSize;
	const bar = marks.barLength;
	const ringR = marks.donutR;
	const lines = marks.lineCount;

	const r = seededRandom(k.slug);
	const sqPlace = sq ?? 0;
	const rawCx = 50 + r() * 60;
	const rawCy = 50 + r() * 50;
	const rawSx = 70 + r() * (VIEW - 80 - sqPlace);
	const rawSy = 80 + r() * (VIEW - 90 - sqPlace);
	const rawTx = 30 + r() * 120;
	const rawTy = 150 - r() * 40;
	const cR = circleR ?? 0;
	const triPlace = tri ?? 0;
	const cx = clampTo(rawCx, cR + MARGIN, VIEW - cR - MARGIN);
	const cy = clampTo(rawCy, cR + MARGIN, VIEW - cR - MARGIN);
	const sx = clampTo(rawSx, MARGIN, VIEW - sqPlace - MARGIN);
	const sy = clampTo(rawSy, MARGIN, VIEW - sqPlace - MARGIN);
	const tx = clampTo(rawTx, MARGIN, VIEW - triPlace - MARGIN);
	const ty = clampTo(rawTy, triPlace * 0.87 + MARGIN, VIEW - MARGIN);
	let rot = Math.round(r() * 90 - 45);
	let barY = 20 + r() * 160;

	const inCircle = (x: number, y: number, pad: number): boolean =>
		circleR !== null && Math.hypot(x - cx, y - cy) < circleR + pad;
	const inSquare = (x: number, y: number, pad: number): boolean =>
		sq !== null && x > sx - pad && x < sx + sq + pad && y > sy - pad && y < sy + sq + pad;
	const inTriangle = (x: number, y: number, pad: number): boolean =>
		tri !== null && x > tx - pad && x < tx + tri + pad && y > ty - tri * 0.87 - pad && y < ty + pad;

	let spot: [number, number] | null = null;
	if (ringR > 0) {
		const free = (x: number, y: number): boolean =>
			!inCircle(x, y, ringR + 4) &&
			!(
				sq !== null &&
				x > sx - ringR - 4 &&
				x < sx + sq + ringR + 4 &&
				y > sy - ringR - 4 &&
				y < sy + sq + ringR + 4
			) &&
			!(
				tri !== null &&
				x > tx - ringR &&
				x < tx + tri + ringR &&
				y > ty - tri * 0.87 - ringR &&
				y < ty + ringR
			);
		for (let tries = 0; !spot && tries < 600; tries++) {
			const x = ringR + 6 + r() * (VIEW - 2 * ringR - 12);
			const y = ringR + 6 + r() * (VIEW - 2 * ringR - 12);
			if (free(x, y)) spot = [x, y];
		}
		if (!spot) spot = [VIEW - ringR - 8, ringR + 8];
	}

	let barPlacement: Geometrie['bar'] = null;
	if (bar !== null) {
		const point = (rotDeg: number, y: number, i: number): [number, number] => {
			const a = (rotDeg * Math.PI) / 180;
			const px = (VIEW - bar) / 2 + (bar * i) / 20 - CENTER;
			const py = y + BAR_HEIGHT / 2 - CENTER;
			return [
				CENTER + px * Math.cos(a) - py * Math.sin(a),
				CENTER + px * Math.sin(a) + py * Math.cos(a)
			];
		};
		const clipped = (rotDeg: number, y: number): boolean => {
			for (let i = 0; i <= 20; i++) {
				const [x, yy] = point(rotDeg, y, i);
				if (x < 8 || x > VIEW - 8 || yy < 8 || yy > VIEW - 8) return true;
			}
			return false;
		};
		// Kandidaten probieren, den mit der geringsten Überdeckung nehmen.
		// Angeschnitten am Rand zählt doppelt: Dann ist die Länge nicht mehr ablesbar.
		const hidden = (rotDeg: number, y: number): number => {
			let hits = 0;
			for (let i = 0; i <= 20; i++) {
				const [x, yy] = point(rotDeg, y, i);
				if (x < 8 || x > VIEW - 8 || yy < 8 || yy > VIEW - 8) hits += 2;
				else if (
					inCircle(x, yy, 3) ||
					inSquare(x, yy, 3) ||
					inTriangle(x, yy, 3) ||
					(spot !== null && Math.hypot(x - spot[0], yy - spot[1]) < ringR + 3)
				)
					hits++;
			}
			return hits;
		};
		let best = hidden(rot, barY);
		for (let t = 0; t < BAR_SEARCH_TRIES && best > 0; t++) {
			const candRot = Math.round(r() * 90 - 45);
			const candY = 20 + r() * 160;
			const h = hidden(candRot, candY);
			if (h < best) [best, rot, barY] = [h, candRot, candY];
		}
		if (clipped(rot, barY)) {
			// Waagerecht liegt der Balken immer im Feld (Länge höchstens 170).
			rot = 0;
			best = Infinity;
			for (let y = 20; y <= 180; y += 5) {
				const h = hidden(0, y);
				if (h < best) [best, barY] = [h, y];
			}
		}
		barPlacement = { x: (VIEW - bar) / 2, y: barY, w: bar, h: BAR_HEIGHT, rot };
	}

	return {
		lines: Array.from({ length: lines }, (_, i) => 10 + (i + 1) * (VIEW / (lines + 1))),
		circle: circleR === null ? null : { cx, cy, r: circleR },
		square: sq === null ? null : { x: sx, y: sy, size: sq },
		triangle: tri === null ? null : { x: tx, y: ty, size: tri },
		bar: barPlacement,
		donut: spot ? { cx: spot[0], cy: spot[1], r: ringR } : null
	};
}
