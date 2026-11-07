/**
 * Plakat „Berlin in Quadraten: Alle Bezirke, alle Wahlen“ (#192) als SVG, 1000 × 1250
 * Einheiten für 400 × 500 mm. Das Raster aus 12 Bezirken × allen Wahlen eines Typs ist das
 * Bild und nimmt die ganze Breite. Legende, Lesehilfe und Grau stehen klein in der Fußzeile.
 * Die Quadrate sind so groß, wie 12 Zeilen in der Höhe zulassen. Jede Zahl steht im Block,
 * damit nichts in die Nachbarzeile ragt.
 */
import { m } from '$lib/paraglide/messages.js';
import { STORY_FONT, STORY_INK, STORY_PAPER } from '../tokens';
import { placeSquare, type PlacedSquare } from './anordnung';
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

/** Rand rundum, 64 Einheiten = 25,6 mm. */
export const MARGIN = 64;
/** Pixel pro Plakateinheit für die Zahlenregeln aus `labels.ts`. */
const DENSITY = 1.6;
const NAME_W = 132;
const YEAR_Y = 160;
const ROWS_TOP = 174;
/** Abstand zwischen zwei Zeilen und zwei Spalten von Quadraten. */
const ROW_GAP = 11;
const COL_GAP = 24;
const FOOTER_TOP = 1078;

/** Rasterfläche: Quadrate stehen darin, die Fußzeile beginnt darunter. */
export const GRID = {
	left: MARGIN,
	top: ROWS_TOP,
	right: POSTER_WIDTH - MARGIN,
	bottom: FOOTER_TOP - 26
} as const;

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

/** Fußzeile: Legende in einer Zeile, Lesehilfe, Grau als Satz und berlinweit, Quellen. */
function footer(input: WallPosterInput, thr: number): string {
	const { data, typ, lang, fonts } = input;
	const t = TEXTE[lang];
	const colors = colorsInOrder();
	const out: string[] = [
		`<line x1="${MARGIN}" y1="${FOOTER_TOP}" x2="${POSTER_WIDTH - MARGIN}" y2="${FOOTER_TOP}" stroke="${STORY_INK}" stroke-width="0.75"/>`
	];

	let x = MARGIN;
	const legendY = FOOTER_TOP + 26;
	legendNames(lang, thr).forEach((name, i) => {
		out.push(
			`<rect x="${n2(x)}" y="${n2(legendY - 8)}" width="9" height="9" fill="${colors[i]}"/>`,
			txt(name, x + 14, legendY, 10)
		);
		x += 14 + fonts.regular(name).adv * 10 + 18;
	});

	const werte = greyRows(data, typ, lang, thr)
		.map((r) => `${r.jahr} ${lang === 'de' ? `${r.percent} %` : `${r.percent}%`}`)
		.join(', ');
	out.push(
		txt(t.reading, MARGIN, FOOTER_TOP + 46, 9),
		txt(t.greyHead(Math.round(thr * 100)), MARGIN, FOOTER_TOP + 61, 9),
		txt(`${t.greyCaption(t.typ[typ])}: ${werte}.`, MARGIN, FOOTER_TOP + 76, 9)
	);

	const width = POSTER_WIDTH - 2 * MARGIN - 220;
	const lines = [
		...wrap(sourceLine(data, typ, lang), width, 7, fonts.regular),
		...wrap(m.plk_pdf_license({}, { locale: lang }), width, 7, fonts.regular)
	];
	const bottom = POSTER_HEIGHT - MARGIN;
	const base = bottom - (lines.length - 1) * 10;
	out.push(
		txt(m.plk_footer_brand({}, { locale: lang }), MARGIN, bottom, 16, { black: true }),
		...lines.map((l, i) => txt(l, POSTER_WIDTH - MARGIN, base + i * 10, 7, { anchor: 'end' }))
	);
	return out.join('');
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
	const opts = { density: DENSITY, measure: fonts.black, fills, insideOnly: true };
	const pitch = (GRID.bottom - GRID.top + ROW_GAP) / bezirke.length;
	const colW = (GRID.right - GRID.left - NAME_W + COL_GAP) / wahlen.length;
	const size = Math.floor(Math.min(pitch - ROW_GAP, colW - COL_GAP));
	const colX = (j: number): number => GRID.left + NAME_W + j * colW;
	const rowY = (i: number): number => GRID.top + i * pitch;

	const squares = bezirke.flatMap((b, i) =>
		wahlen.map((w, j) =>
			placeSquare(squareSpec(b, w, typ, lang, { thr }), colX(j), rowY(i), size, opts)
		)
	);

	const header = wahlen
		.map((w, j) => txt(String(w.jahr), colX(j), YEAR_Y, 14, { black: true }))
		.join('');
	const names = bezirke
		.map((b, i) =>
			splitName(b.name, NAME_W - 16, 12, fonts.black)
				.map((l, k) => txt(l, GRID.left, rowY(i) + 10 + k * 14, 12, { black: true }))
				.join('')
		)
		.join('');
	const label = `${t.title}. ${t.subtitle}: ${t.typ[typ]}`;

	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}" font-family="${esc(STORY_FONT)}" role="img" aria-label="${esc(label)}">` +
		`<title>${esc(label)}</title>` +
		`<rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="${STORY_PAPER}"/>` +
		txt(t.title, MARGIN, 98, 40, { black: true }) +
		txt(
			`${t.subtitle}. ${t.typLine(t.typ[typ], wahlen[0].jahr, wahlen.at(-1)!.jahr)}`,
			MARGIN,
			124,
			14
		) +
		header +
		names +
		squares.map((p) => placedSquareSvg(p, colors, fonts.black)).join('') +
		footer(input, thr) +
		`</svg>`;
	return { svg, squares };
}
