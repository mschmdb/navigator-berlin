import { readFileSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import {
	overviewPosterSvg,
	posterSvg,
	POSTER_WIDTH
} from '$lib/stories/punkt-linie-kiez/poster-svg.js';
import type { BezirkItem, KennzahlenQuelle } from '$lib/stories/punkt-linie-kiez/types.js';
import type { Locale } from '$lib/paraglide/runtime.js';

/** Poster 400 x 500 mm. 1 mm = 72 / 25,4 pt. */
const MM = 72 / 25.4;
export const PAGE_WIDTH_PT = 400 * MM;
export const PAGE_HEIGHT_PT = 500 * MM;

const FONT_DIR = path.join(process.cwd(), 'node_modules/@fontsource/jost/files');

/** Jost, selbst gehostet über @fontsource (OFL 1.1), als statische woff-Schnitte eingebettet. */
function font(weight: 400 | 700): Buffer {
	return readFileSync(path.join(FONT_DIR, `jost-latin-${weight}-normal.woff`));
}

/** Rendert ein Poster-SVG (1000 x 1250) als Vektor-PDF. Kein Raster: Formen und Text bleiben Pfade und Schrift. */
function renderSvgPdf(
	svg: string,
	info: { Title: string; Subject: string; Keywords: string }
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
		doc.registerFont('Jost-Bold', font(700));
		// Das SVG misst 1000 x 1250 Einheiten, die Seite 400 x 500 mm.
		doc.scale(PAGE_WIDTH_PT / POSTER_WIDTH);
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
