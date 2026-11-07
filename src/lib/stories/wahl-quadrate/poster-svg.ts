/**
 * Plakat „Berlin in Quadraten: Alle Bezirke, alle Wahlen“ (#192) als SVG, 1000 × 1250
 * Einheiten für 400 × 500 mm. Links das Raster aus 12 Bezirken × allen Wahlen eines Typs,
 * rechts Lesehilfe, Legende und Grau berlinweit als Tabelle, unten Quellen.
 */
import { m } from '$lib/paraglide/messages.js';
import { STORY_FONT, STORY_INK, STORY_PAPER } from '../tokens';
import { fitSquareSize, placeSquare, type PlacedSquare } from './anordnung';
import { DEFAULT_THRESHOLD, type Lang } from './grau';
import { bezirkeAlphabetisch, greyRows, sourceLine, squareSpec, wahlenOf } from './bilddaten';
import { colorsInOrder } from './farben';
import { legendNames } from './legende';
import type { WahlTyp } from './parteien';
import { esc, n2, splitName, txt, wrap, type Fonts } from './satz';
import { fillsFor, placedSquareSvg } from './svg';
import { TEXTE } from './texte';
import type { StoriesWahlData } from './types';

export const POSTER_WIDTH = 1000;
export const POSTER_HEIGHT = 1250;

const MARGIN = 50;
/**
 * Pixel pro Plakateinheit für die Zahlenregeln aus `labels.ts`. Bei 1,6 stehen Außenzahlen
 * in 6,9 Einheiten (2,75 mm, rund 8 pt), Zahlen im Block ab 6,25 Einheiten.
 */
const DENSITY = 1.6;
const NAME_W = 140;
const HEADER_H = 36;

/** Rasterfläche, Quadrate samt Außenzahlen bleiben darin. */
export const GRID = { left: MARGIN, top: 196, right: 640, bottom: 1136 } as const;
const SIDE_X = 680;
const SIDE_W = POSTER_WIDTH - MARGIN - SIDE_X;
const FOOTER_Y = 1160;

export interface WallPosterInput {
	data: StoriesWahlData;
	typ: WahlTyp;
	lang: Lang;
	fonts: Fonts;
	thr?: number;
}

export interface WallPoster {
	svg: string;
	squares: PlacedSquare[];
}

/** Lesehilfe, Legende und Grau-Tabelle in der rechten Spalte. */
function sideColumn(input: WallPosterInput, thr: number): string {
	const { data, typ, lang, fonts } = input;
	const t = TEXTE[lang];
	const colors = colorsInOrder();
	const out: string[] = [];
	let y = GRID.top + 14;

	for (const line of wrap(t.reading, SIDE_W, 13, fonts.regular)) {
		out.push(txt(line, SIDE_X, y, 13));
		y += 18;
	}

	y += 16;
	legendNames(lang, thr).forEach((name, i) => {
		out.push(
			`<rect x="${SIDE_X}" y="${n2(y - 11)}" width="13" height="13" fill="${colors[i]}"/>`,
			txt(name, SIDE_X + 22, y, 12)
		);
		y += 21;
	});

	y += 18;
	for (const line of wrap(t.greyHead(Math.round(thr * 100)), SIDE_W, 12, fonts.regular)) {
		out.push(txt(line, SIDE_X, y, 12));
		y += 17;
	}

	y += 12;
	out.push(txt(t.greyCaption(t.typ[typ]), SIDE_X, y, 12, { black: true }));
	y += 20;
	const colX = [SIDE_X, SIDE_X + 44, SIDE_X + 88];
	t.columns.forEach((c, i) => out.push(txt(c, colX[i], y, 10)));
	y += 6;
	const partsW = SIDE_X + SIDE_W - colX[2];
	for (const row of greyRows(data, typ, lang, thr)) {
		out.push(
			`<line x1="${SIDE_X}" y1="${n2(y)}" x2="${SIDE_X + SIDE_W}" y2="${n2(y)}" stroke="${STORY_INK}" stroke-width="0.5"/>`
		);
		y += 15;
		const pct = lang === 'de' ? `${row.percent} %` : `${row.percent}%`;
		out.push(
			`<g data-wahl="${row.slug}" data-grau="${row.percent}">`,
			txt(String(row.jahr), colX[0], y, 11, { black: true }),
			txt(pct, colX[1], y, 11, { black: true })
		);
		const lines = wrap(row.parts, partsW, 10, fonts.regular);
		lines.forEach((l, i) => out.push(txt(l, colX[2], y + i * 13, 10)));
		out.push(`</g>`);
		y += (lines.length - 1) * 13 + 6;
	}
	return out.join('');
}

function footer(input: WallPosterInput): string {
	const { data, typ, lang, fonts } = input;
	const width = POSTER_WIDTH - 2 * MARGIN - 220;
	const lines = [
		...wrap(sourceLine(data, typ, lang), width, 8, fonts.regular),
		...wrap(m.plk_pdf_license({}, { locale: lang }), width, 8, fonts.regular)
	];
	const base = POSTER_HEIGHT - MARGIN - (lines.length - 1) * 11;
	return (
		`<line x1="${MARGIN}" y1="${FOOTER_Y}" x2="${POSTER_WIDTH - MARGIN}" y2="${FOOTER_Y}" stroke="${STORY_INK}" stroke-width="1"/>` +
		txt(m.plk_footer_brand({}, { locale: lang }), MARGIN, POSTER_HEIGHT - MARGIN, 20, {
			black: true
		}) +
		lines.map((l, i) => txt(l, POSTER_WIDTH - MARGIN, base + i * 11, 8, { anchor: 'end' })).join('')
	);
}

/** Gesamtansicht eines Wahltyps als Plakat. Gleiche Eingabe ergibt dasselbe SVG. */
export function wallPoster(input: WallPosterInput): WallPoster {
	const { data, typ, lang, fonts } = input;
	const thr = input.thr ?? DEFAULT_THRESHOLD;
	const t = TEXTE[lang];
	const wahlen = wahlenOf(typ);
	const bezirke = bezirkeAlphabetisch(data);
	const colors = colorsInOrder();
	const fills = fillsFor(colors);
	const opts = { density: DENSITY, measure: fonts.black, fills };

	const rowsTop = GRID.top + HEADER_H;
	const cellW = (GRID.right - GRID.left - NAME_W) / wahlen.length;
	const cellH = (GRID.bottom - rowsTop) / bezirke.length;
	const specs = bezirke.map((b) => wahlen.map((w) => squareSpec(b, w, typ, lang, { thr })));
	const fit = fitSquareSize(specs.flat(), cellW, cellH, opts);
	const colX = (j: number): number => GRID.left + NAME_W + j * cellW + fit.inset;

	const squares = specs.flatMap((row, i) =>
		row.map((spec, j) => placeSquare(spec, colX(j), rowsTop + i * cellH, fit.size, opts))
	);

	const header = wahlen
		.map((w, j) => txt(String(w.jahr), colX(j), GRID.top + 20, 20, { black: true }))
		.join('');
	const names = bezirke
		.map((b, i) =>
			splitName(b.name, NAME_W - 14, 13, fonts.black)
				.map((l, k) => txt(l, GRID.left, rowsTop + i * cellH + 11 + k * 16, 13, { black: true }))
				.join('')
		)
		.join('');
	const label = `${t.title}. ${t.subtitle}: ${t.typ[typ]}`;

	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}" font-family="${esc(STORY_FONT)}" role="img" aria-label="${esc(label)}">` +
		`<title>${esc(label)}</title>` +
		`<rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="${STORY_PAPER}"/>` +
		txt(t.title, MARGIN, 96, 52, { black: true }) +
		txt(t.subtitle, MARGIN, 134, 24) +
		txt(t.typLine(t.typ[typ], wahlen[0].jahr, wahlen.at(-1)!.jahr), MARGIN, 162, 15) +
		header +
		names +
		squares.map((p) => placedSquareSvg(p, colors, fonts.black)).join('') +
		sideColumn(input, thr) +
		footer(input) +
		`</svg>`;
	return { svg, squares };
}
