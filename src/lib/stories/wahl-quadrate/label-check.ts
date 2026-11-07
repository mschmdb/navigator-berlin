/**
 * Prüfungen aus `tools/check.mjs` der Skizze, auf Rechtecken statt auf dem DOM. Die Tests
 * von Treemap-Kern und Plakat teilen sie, damit Bildschirm und Druck dieselbe Regel prüfen:
 * jede Zahl innen oder außen, nichts läuft über, keine Linie kreuzt einen fremden Block.
 */
import type { Labels, Line } from './labels';
import type { PlacedSquare } from './anordnung';
import { SIDE, type Block, type Rect } from './layout';

export interface Problem {
	kind: string;
	i: number;
}

export const inter = (a: Rect, b: Rect): number =>
	Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
	Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

export const overlaps = (a: Rect, b: Rect, tol: number): boolean =>
	Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > tol &&
	Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > tol;

/** Liang-Barsky: schneidet die Strecke das um `tol` verkleinerte Innere des Rechtecks? */
export function segmentHits(l: Line, r: Rect, tol: number): boolean {
	const x0 = r.x + tol,
		x1 = r.x + r.w - tol,
		y0 = r.y + tol,
		y1 = r.y + r.h - tol;
	if (x1 <= x0 || y1 <= y0) return false;
	const dx = l.x2 - l.x1,
		dy = l.y2 - l.y1;
	let t0 = 0,
		t1 = 1;
	for (const [p, q] of [
		[-dx, l.x1 - x0],
		[dx, x1 - l.x1],
		[-dy, l.y1 - y0],
		[dy, y1 - l.y1]
	]) {
		if (p === 0) {
			if (q < 0) return false;
		} else {
			const t = q / p;
			if (p < 0) t0 = Math.max(t0, t);
			else t1 = Math.min(t1, t);
		}
	}
	return t0 < t1;
}

/** Prüft die Zahlen eines Quadrats im viewBox-Raum (100er-Raster). */
export function checkLabels(
	blocks: readonly Block[],
	labels: Labels,
	scale: number,
	fills: readonly (string | null)[],
	insideOnly: boolean
): Problem[] {
	const px = 1 / scale;
	const out: Problem[] = [];
	const visible = blocks.map(
		(b, i) => fills[i] != null && b.w * scale >= 0.5 && b.h * scale >= 0.5
	);
	const insideAt = new Map(labels.inside.map((l) => [l.i, l]));
	const outsideAt = new Map(labels.outside.map((l) => [l.i, l]));
	blocks.forEach((b, i) => {
		const vi = insideAt.has(i),
			vo = outsideAt.has(i);
		if (vi && vo) out.push({ kind: 'doppelt', i });
		if (visible[i] && !vi && !vo && !insideOnly) out.push({ kind: 'fehlt', i });
		if (fills[i] == null && (vi || vo)) out.push({ kind: 'verborgen beschriftet', i });
	});
	for (const l of labels.inside) {
		const b = blocks[l.i],
			B = l.box,
			e = 0.6 * px;
		if (B.x < b.x - e || B.y < b.y - e || B.x + B.w > b.x + b.w + e || B.y + B.h > b.y + b.h + e)
			out.push({ kind: 'überläuft', i: l.i });
	}
	if (insideOnly && labels.outside.length) out.push({ kind: 'außen trotz insideOnly', i: -1 });
	for (const l of labels.outside) {
		blocks.forEach((o, j) => {
			if (o.w * scale < 0.5) return;
			if (inter(l.box, o) > 0 && overlaps(l.box, o, px))
				out.push({ kind: `text über b${j}`, i: l.i });
			if (j !== l.i && segmentHits(l.line, o, px)) out.push({ kind: `linie über b${j}`, i: l.i });
		});
		const B = l.box;
		if (
			B.y < -19 * px ||
			B.y + B.h > SIDE + 35 * px ||
			B.x < -22 * px ||
			B.x + B.w > SIDE + 50 * px
		)
			out.push({ kind: 'abgeschnitten', i: l.i });
	}
	for (let a = 0; a < labels.outside.length; a++)
		for (let c = a + 1; c < labels.outside.length; c++)
			if (overlaps(labels.outside[a].box, labels.outside[c].box, 0.5 * px))
				out.push({ kind: `kollidiert mit b${labels.outside[c].i}`, i: labels.outside[a].i });
	return out;
}

const toPage = (p: PlacedSquare, r: Rect): Rect => {
	const f = p.size / SIDE;
	return { x: p.x + r.x * f, y: p.y + r.y * f, w: r.w * f, h: r.h * f };
};

const lineToPage = (p: PlacedSquare, l: Line): Line => {
	const f = p.size / SIDE;
	return { x1: p.x + l.x1 * f, y1: p.y + l.y1 * f, x2: p.x + l.x2 * f, y2: p.y + l.y2 * f };
};

/**
 * Prüft eine ganze Seite: jedes Quadrat für sich (`checkLabels`, ohne Bildschirmrand), dazu ragt keine Außenzahl
 * und keine Linie in ein fremdes Quadrat oder über eine fremde Zahl.
 */
export function checkPage(squares: readonly PlacedSquare[]): string[] {
	const out: string[] = [];
	const frame = (p: PlacedSquare): Rect => ({ x: p.x, y: p.y, w: p.size, h: p.size });
	const boxes = (p: PlacedSquare): Rect[] =>
		[...(p.labels?.inside ?? []), ...(p.labels?.outside ?? [])].map((l) => toPage(p, l.box));
	squares.forEach((a, ia) => {
		if (a.labels)
			for (const pr of checkLabels(a.blocks, a.labels, a.scale, a.fills, a.insideOnly))
				// „abgeschnitten“ misst den festen Rand der Bildschirm-Ansicht. Auf einer Seite
				// prüft `fitSquareSize` den Platz je Zelle, Kollisionen prüft der Rest hier.
				if (pr.kind !== 'abgeschnitten') out.push(`${a.title} b${pr.i} ${pr.kind}`);
		const tol = 0.5 / (a.scale * (SIDE / a.size));
		for (const l of a.labels?.outside ?? []) {
			const box = toPage(a, l.box);
			const line = lineToPage(a, l.line);
			squares.forEach((b, ib) => {
				if (ia === ib) return;
				if (overlaps(box, frame(b), tol)) out.push(`${a.title} b${l.i} Zahl über ${b.title}`);
				if (segmentHits(line, frame(b), tol)) out.push(`${a.title} b${l.i} Linie über ${b.title}`);
				for (const o of boxes(b))
					if (overlaps(box, o, tol)) out.push(`${a.title} b${l.i} kollidiert mit ${b.title}`);
			});
		}
	});
	return out;
}
