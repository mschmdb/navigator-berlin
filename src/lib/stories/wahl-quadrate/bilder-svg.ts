/**
 * Social-Bild je Bezirk und Wahltyp (1080 × 1350, Vorrat für Nachposts) und OG-Bild der
 * Handbuch-Seite (1200 × 630) als SVG. Gerastert wird auf dem Server (`raster.ts`).
 */
import { m } from '$lib/paraglide/messages.js';
import { STORY_FONT, STORY_PAPER } from '../tokens';
import { fitSquareSize, labelExtent, placeSquare, type PlacedSquare } from './anordnung';
import { bezirkeAlphabetisch, sourceLine, squareSpec, wahlenOf } from './bilddaten';
import { DEFAULT_THRESHOLD, type Lang } from './grau';
import { colorsInOrder, legendNames } from './palette';
import type { WahlTyp } from './parteien';
import { esc, n2, splitName, txt, type Fonts } from './satz';
import { fillsFor, placedSquareSvg } from './svg';
import { TEXTE } from './texte';
import type { StoriesWahlData } from './types';

export const SOCIAL_SIZE = { width: 1080, height: 1350 } as const;
export const OG_SIZE = { width: 1200, height: 630 } as const;

export interface Bild {
	svg: string;
	squares: PlacedSquare[];
}

const frame = (w: number, h: number, label: string, inner: string): string =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${esc(STORY_FONT)}" role="img" aria-label="${esc(label)}">` +
	`<title>${esc(label)}</title><rect width="${w}" height="${h}" fill="${STORY_PAPER}"/>` +
	inner +
	`</svg>`;

export interface SocialInput {
	data: StoriesWahlData;
	/** Bezirks-Slug, z. B. `friedrichshain-kreuzberg`. */
	bezirk: string;
	typ: WahlTyp;
	lang: Lang;
	fonts: Fonts;
}

const S_MARGIN = 64;
const YEAR_SIZE = 44;
const LEGEND_ROW = 38;
const COL_GAP = 36;

/** Alle Wahlen eines Typs für einen Bezirk in zwei Reihen, Jahr groß unter dem Quadrat. */
export function socialSvg(input: SocialInput): Bild {
	const { data, typ, lang, fonts } = input;
	const b = data.bezirke.find((x) => x.slug === input.bezirk);
	if (!b) throw new RangeError(`unbekannter Bezirk: ${input.bezirk}`);
	const t = TEXTE[lang];
	const { width: W, height: H } = SOCIAL_SIZE;
	const inner = W - 2 * S_MARGIN;
	const wahlen = wahlenOf(typ);
	const colors = colorsInOrder();
	const opts = { density: 1, measure: fonts.black, fills: fillsFor(colors), exportMode: true };

	const head: string[] = [txt(t.title, S_MARGIN, 104, 30)];
	let y = 104;
	for (const line of splitName(b.name, inner, 76, fonts.black)) {
		y += 80;
		head.push(txt(line, S_MARGIN, y, 76, { black: true }));
	}
	y += 46;
	head.push(txt(t.typLine(t.typ[typ], wahlen[0].jahr, wahlen.at(-1)!.jahr), S_MARGIN, y, 30));

	const names = legendNames(lang, DEFAULT_THRESHOLD);
	const legendRows = Math.ceil(names.length / 3);
	const footerY = H - 56;
	const legendTop = footerY - 60 - legendRows * LEGEND_ROW;
	const gridTop = y + 48;
	const cols = Math.ceil(wahlen.length / 2);
	const rows = Math.ceil(wahlen.length / cols);
	const cellW = inner / cols;
	const cellH = (legendTop - 48 - gridTop) / rows;

	const specs = wahlen.map((w) => squareSpec(b, w, typ, lang));
	const fit = fitSquareSize(specs, cellW - COL_GAP, cellH - YEAR_SIZE - 12, opts);
	const squares = specs.map((spec, i) =>
		placeSquare(
			spec,
			S_MARGIN + (i % cols) * cellW + fit.inset,
			gridTop + Math.floor(i / cols) * cellH,
			fit.size,
			opts
		)
	);
	// Jahre einer Reihe stehen auf einer Linie, unter der tiefsten Außenzahl der Reihe.
	const below = (row: number): number =>
		Math.max(
			0,
			...squares.filter((_, i) => Math.floor(i / cols) === row).map((q) => labelExtent(q).bottom)
		);
	const years = squares.map((q, i) =>
		txt(
			String(wahlen[i].jahr),
			q.x,
			q.y + q.size + below(Math.floor(i / cols)) + YEAR_SIZE,
			YEAR_SIZE,
			{
				black: true
			}
		)
	);

	const legend = names.map((name, i) => {
		const lx = S_MARGIN + (i % 3) * (inner / 3);
		const ly = legendTop + Math.floor(i / 3) * LEGEND_ROW;
		return (
			`<rect x="${n2(lx)}" y="${n2(ly - 20)}" width="22" height="22" fill="${colors[i]}"/>` +
			txt(name, lx + 32, ly, i === names.length - 1 ? 20 : 22)
		);
	});

	const foot =
		txt(m.plk_footer_brand({}, { locale: lang }), S_MARGIN, footerY + 20, 30, { black: true }) +
		txt(sourceLine(data, typ, lang), W - S_MARGIN, footerY + 18, 15, { anchor: 'end' });

	const svg = frame(
		W,
		H,
		`${t.title}: ${b.name}, ${t.typ[typ]}`,
		head.join('') +
			squares.map((q) => placedSquareSvg(q, colors, fonts.black, true)).join('') +
			years.join('') +
			legend.join('') +
			foot
	);
	return { svg, squares };
}

export interface OgInput {
	data: StoriesWahlData;
	lang: Lang;
	fonts: Fonts;
}

const OG_MARGIN = 60;
const OG_GAP = 14;

/** OG-Bild: Titel und die 12 Bezirke bei der jüngsten Abgeordnetenhauswahl, ohne Zahlen. */
export function ogSvg(input: OgInput): Bild {
	const { data, lang, fonts } = input;
	const t = TEXTE[lang];
	const { width: W, height: H } = OG_SIZE;
	const wahl = wahlenOf('agh').at(-1)!;
	const bezirke = bezirkeAlphabetisch(data);
	const colors = colorsInOrder();
	const opts = { density: 1, measure: fonts.black, fills: fillsFor(colors) };
	const size = Math.floor((W - 2 * OG_MARGIN - (bezirke.length - 1) * OG_GAP) / bezirke.length);
	const top = 250;
	const squares = bezirke.map((b, i) =>
		placeSquare(
			squareSpec(b, wahl, 'agh', lang, { numbers: false }),
			OG_MARGIN + i * (size + OG_GAP),
			top,
			size,
			opts
		)
	);
	const svg = frame(
		W,
		H,
		`${t.title}: ${t.subtitle}`,
		txt(t.title, OG_MARGIN, 128, 76, { black: true }) +
			txt(t.subtitle, OG_MARGIN, 182, 36) +
			squares.map((q) => placedSquareSvg(q, colors, fonts.black)).join('') +
			txt(t.ogCaption(t.typ.agh, wahl.jahr), OG_MARGIN, top + size + 44, 24) +
			txt(m.plk_footer_brand({}, { locale: lang }), OG_MARGIN, H - 52, 30, { black: true })
	);
	return { svg, squares };
}
