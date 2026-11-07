import { readFileSync } from 'node:fs';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import {
	overviewPosterSvg,
	posterSvg,
	POSTER_WIDTH
} from '$lib/stories/punkt-linie-kiez/poster-svg.js';
import type { BezirkItem, KennzahlenQuelle } from '$lib/stories/punkt-linie-kiez/types.js';
import type { Locale } from '$lib/paraglide/runtime.js';
import { POSTER_WIDTH as WALL_WIDTH, wallPoster } from '$lib/stories/wahl-quadrate/poster-svg.js';
import { TEXTE } from '$lib/stories/wahl-quadrate/texte.js';
import type { WahlTyp } from '$lib/stories/wahl-quadrate/parteien.js';
import { jostFile, jostMeasure, type JostWeight } from './jost.js';
import { loadStoriesWahl } from './wahl-daten.js';

/** Poster 400 x 500 mm. 1 mm = 72 / 25,4 pt. */
const MM = 72 / 25.4;
export const PAGE_WIDTH_PT = 400 * MM;
export const PAGE_HEIGHT_PT = 500 * MM;

/** Jost, selbst gehostet über @fontsource (OFL 1.1), als statische woff-Schnitte eingebettet. */
function font(weight: JostWeight): Buffer {
	return readFileSync(jostFile(weight));
}

/**
 * Rendert ein Poster-SVG (1000 x 1250) als Vektor-PDF. Kein Raster: Formen und Text bleiben
 * Pfade und Schrift. svg-to-pdfkit kennt nur fett oder normal, `bold` legt den fetten Schnitt fest.
 */
function renderSvgPdf(
	svg: string,
	info: { Title: string; Subject: string; Keywords: string },
	bold: JostWeight = 700,
	width: number = POSTER_WIDTH
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({
			size: [PAGE_WIDTH_PT, PAGE_HEIGHT_PT],
			margin: 0,
			info: { ...info, Author: 'navigator.berlin' }
		});
		const chunks: Buffer[] = [];
		doc.on('data', (c: Buffer) => chunks.push(c));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);
		doc.registerFont('Jost', font(400));
		doc.registerFont('Jost-Bold', font(bold));
		// Das SVG misst 1000 x 1250 Einheiten, die Seite 400 x 500 mm.
		doc.scale(PAGE_WIDTH_PT / width);
		SVGtoPDF(doc, svg, 0, 0, {
			assumePt: true,
			fontCallback: (_family: string, bold: boolean) => (bold ? 'Jost-Bold' : 'Jost')
		});
		doc.end();
	});
}

export function renderPosterPdf(
	item: BezirkItem,
	sources: readonly KennzahlenQuelle[],
	lang: Locale
): Promise<Buffer> {
	return renderSvgPdf(posterSvg(item, sources, lang), {
		Title: `punkt, linie, kiez: ${item.name}`,
		Subject: item.slug,
		Keywords: item.name
	});
}

/** Gesamtplakat mit allen Bezirken im Raster. */
export function renderOverviewPdf(
	bezirke: readonly BezirkItem[],
	sources: readonly KennzahlenQuelle[],
	lang: Locale
): Promise<Buffer> {
	return renderSvgPdf(overviewPosterSvg(bezirke, sources, lang), {
		Title: 'punkt, linie, kiez: alle bezirke',
		Subject: 'alle-bezirke',
		Keywords: bezirke.map((b) => b.name).join(', ')
	});
}

/** „Berlin in Quadraten“: alle Bezirke und Wahlen eines Typs, Zahlen in Jost 900. */
export function renderWallPosterPdf(typ: WahlTyp, lang: Locale): Promise<Buffer> {
	const t = TEXTE[lang];
	const { svg } = wallPoster({
		data: loadStoriesWahl(),
		typ,
		lang,
		fonts: { black: jostMeasure(900), regular: jostMeasure(400) }
	});
	return renderSvgPdf(
		svg,
		{ Title: `${t.title}: ${t.subtitle}`, Subject: t.typ[typ], Keywords: t.typ[typ] },
		900,
		WALL_WIDTH
	);
}
