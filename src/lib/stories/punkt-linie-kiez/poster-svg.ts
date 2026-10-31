import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime.js';
import { compositionElements } from './composition-svg';
import { legendRows, legendShapes, type LegendShape } from './legend';
import { STORY_FONT, STORY_INK, STORY_PAPER, STORY_SERIES } from '../tokens';
import { VIEW, type BezirkItem, type KennzahlenQuelle } from './types';

export const POSTER_WIDTH = 1000;
export const POSTER_HEIGHT = 1250;

const [THIN, THICK] = STORY_SERIES['punkt-linie-kiez'].lineWidths;
const AVG_CHAR = 0.5;

const esc = (s: string): string =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Grobe Zeilenumbrüche an Wortgrenzen, weil SVG-Text nicht selbst umbricht. */
export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
	const perLine = Math.max(1, Math.floor(maxWidth / (fontSize * AVG_CHAR)));
	const lines: string[] = [];
	let line = '';
	for (const word of text.split(/\s+/)) {
		const next = line ? `${line} ${word}` : word;
		if (next.length > perLine && line) {
			lines.push(line);
			line = word;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines;
}

const text = (
	value: string,
	x: number,
	y: number,
	size: number,
	opts: { weight?: number; anchor?: 'start' | 'middle' | 'end' } = {}
): string =>
	`<text x="${x}" y="${y}" font-size="${size}" font-weight="${opts.weight ?? 400}" text-anchor="${opts.anchor ?? 'start'}" fill="${STORY_INK}">${esc(value)}</text>`;

function icon(row: LegendShape, x: number, y: number, scale = 1.4): string {
	const g = (inner: string): string =>
		`<g transform="translate(${x} ${y}) scale(${scale})">${inner}</g>`;
	switch (row.key) {
		case 'circle':
			return g(`<circle cx="13" cy="13" r="12" fill="${row.color}"/>`);
		case 'square':
			return g(`<rect x="2" y="2" width="22" height="22" fill="${row.color}"/>`);
		case 'triangle':
			return g(
				`<path d="M1,25l24,0l-12,-22Z" fill="${row.color}" stroke="${STORY_INK}" stroke-width="${THIN}" stroke-linejoin="round"/>`
			);
		case 'bar':
			return g(`<rect x="0" y="9" width="26" height="7" fill="${row.color}"/>`);
		case 'lines':
			return g(
				`<path d="M0,4l26,11M0,12l26,11" fill="none" stroke="${row.color}" stroke-width="${THIN}"/>`
			);
		default:
			return g(
				`<circle cx="13" cy="13" r="8.5" fill="none" stroke="${row.color}" stroke-width="6.5"/>`
			);
	}
}

const CLIP_ID = 'plk-clip';

const clipDefs = (): string =>
	`<defs><clipPath id="${CLIP_ID}"><rect width="${VIEW}" height="${VIEW}"/></clipPath></defs>`;

/** Papier und Rahmen, gemeinsam für Einzel- und Gesamtplakat. */
const posterFrame = (inner: string): string =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}" font-family="${esc(STORY_FONT)}">` +
	`<rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="${STORY_PAPER}"/>` +
	`<rect x="20" y="20" width="${POSTER_WIDTH - 40}" height="${POSTER_HEIGHT - 40}" fill="none" stroke="${STORY_INK}" stroke-width="${THICK}"/>` +
	inner +
	`</svg>`;

/** Satzrand innerhalb des Rahmens und Grundlinie der letzten Fußzeile (Rahmen innen bei 1230). */
const MARGIN = 50;
const INNER = POSTER_WIDTH - 2 * MARGIN;
const BOTTOM = 1210;

/**
 * Fußlinie, Marke, Quellen mit Stand, OSM-Hinweis und Lizenz. Sitzt unten am Rahmen, damit
 * das Motiv den Platz bekommt. Quellen in 7,5 Einheiten, bei 400 mm Breite rund 3 mm (8,5 pt),
 * über der Druckgrenze aus docs/DESIGN.md. Gibt die Oberkante zurück.
 */
function posterFooter(
	sources: readonly KennzahlenQuelle[],
	lang: Locale
): { readonly svg: string; readonly top: number } {
	const o = { locale: lang };
	const size = 7.5;
	const lineHeight = 9.5;
	const width = INNER - 200;
	const sourceLine = `${m.plk_sources_label({}, o)}: ${[
		...new Map(sources.map((s) => [s.name, s])).values()
	]
		.map((s) => (s.stand ? `${s.name} (${s.stand})` : s.name))
		.join('; ')}.`;
	const lines = [
		...wrapText(sourceLine, width, size),
		m.plk_osm({}, o),
		...wrapText(m.plk_pdf_license({}, o), width, size)
	];
	const firstBaseline = BOTTOM - (lines.length - 1) * lineHeight;
	const top = firstBaseline - 18;
	return {
		top,
		svg:
			`<line x1="${MARGIN}" y1="${top}" x2="${POSTER_WIDTH - MARGIN}" y2="${top}" stroke="${STORY_INK}" stroke-width="${THIN}"/>` +
			text(m.plk_footer_brand({}, o), MARGIN, BOTTOM, 20, { weight: 700 }) +
			lines
				.map((l, i) =>
					text(l, POSTER_WIDTH - MARGIN, firstBaseline + i * lineHeight, size, { anchor: 'end' })
				)
				.join('')
	};
}

const LEGEND_ROW = 26;
const LEGEND_GAP = 16;

/**
 * Kompakte Legende, gleich für Einzel- und Gesamtplakat: drei Spalten, je Zeile Zeichen,
 * Bezeichnung und beim Einzelplakat der Wert fett dahinter. Endet `LEGEND_GAP` über `bottom`.
 */
function legendBlock(
	rows: readonly (LegendShape & { readonly value?: string })[],
	bottom: number,
	columns: number
): { readonly svg: string; readonly top: number } {
	const pitch = INNER / columns;
	const lineCount = Math.ceil(rows.length / columns);
	const top = bottom - LEGEND_GAP - lineCount * LEGEND_ROW;
	const svg = rows
		.map((row, i) => {
			const x = MARGIN + (i % columns) * pitch;
			const y = top + Math.floor(i / columns) * LEGEND_ROW;
			const value = row.value ? `<tspan font-weight="700" dx="6">${esc(row.value)}</tspan>` : '';
			return (
				icon(row, x, y, 0.75) +
				`<text x="${x + 28}" y="${y + 15}" font-size="15" fill="${STORY_INK}">${esc(row.label)}${value}</text>`
			);
		})
		.join('');
	return { svg, top };
}

const TITLE_Y = 70;
const HEADLINE_Y = 124;
const MOTIF_TOP = 146;

/**
 * Poster 4:5 als SVG-String: Titel, Bezirk, die Komposition so groß wie möglich, kompakte
 * Legende mit Werten, Fußzeile am unteren Rahmen. Die Komposition kommt aus derselben Quelle
 * wie Komponente und OG-Bild. Die Sprache ist ein Argument, damit der Build beide Fassungen erzeugt.
 */
export function posterSvg(
	item: BezirkItem,
	sources: readonly KennzahlenQuelle[],
	lang: Locale
): string {
	const o = { locale: lang };
	const footer = posterFooter(sources, lang);
	// Zwei Spalten, damit lange Werte wie „99,5 % der Menschen“ nicht in die Nachbarspalte laufen.
	const legend = legendBlock(legendRows(item.kennzahlen, lang), footer.top, 2);
	const size = Math.min(INNER, legend.top - LEGEND_GAP - MOTIF_TOP);
	const compX = MARGIN + (INNER - size) / 2;
	const scale = size / VIEW;

	return posterFrame(
		text(m.plk_title({}, o), MARGIN, TITLE_Y, 22) +
			text(item.name.toLocaleLowerCase('de'), MARGIN, HEADLINE_Y, 48, { weight: 700 }) +
			clipDefs() +
			`<g transform="translate(${compX} ${MOTIF_TOP}) scale(${scale})"><g clip-path="url(#${CLIP_ID})">${compositionElements(item.kennzahlen)}</g></g>` +
			legend.svg +
			footer.svg
	);
}

/**
 * Gesamtplakat: alle Bezirke alphabetisch im Raster (4 × 3) über die volle Breite, darunter
 * je der Name, dann eine kompakte Legende ohne Werte. Die Kompositionen sind die große
 * Geometrie, verkleinert.
 */
export function overviewPosterSvg(
	bezirke: readonly BezirkItem[],
	sources: readonly KennzahlenQuelle[],
	lang: Locale
): string {
	const o = { locale: lang };
	const footer = posterFooter(sources, lang);
	const legend = legendBlock(legendShapes(lang), footer.top, 3);
	const columns = 4;
	const rowsCount = Math.ceil(bezirke.length / columns);
	const gutter = 20;
	const labelGap = 22;
	const size = (INNER - (columns - 1) * gutter) / columns;
	// Die Breite begrenzt die Kachelgröße. Die Zeilen stehen kompakt, der Block sitzt
	// senkrecht mittig zwischen Überschrift und Legende.
	const rowGap = 40;
	const pitchY = size + labelGap + rowGap;
	const gridHeight = rowsCount * pitchY - rowGap;
	const gridTop = MOTIF_TOP + (legend.top - LEGEND_GAP - MOTIF_TOP - gridHeight) / 2;
	const scale = size / VIEW;

	const cells = [...bezirke]
		.sort((a, b) => a.name.localeCompare(b.name, 'de'))
		.map((b, i) => {
			const x = MARGIN + (i % columns) * (size + gutter);
			const y = gridTop + Math.floor(i / columns) * pitchY;
			return (
				`<g transform="translate(${x} ${y}) scale(${scale})"><g clip-path="url(#${CLIP_ID})">${compositionElements(b.kennzahlen)}</g></g>` +
				text(b.name.toLocaleLowerCase('de'), x, y + size + labelGap, 17)
			);
		})
		.join('');

	return posterFrame(
		text(m.plk_title({}, o), MARGIN, TITLE_Y, 22) +
			text(m.plk_sub({}, o), MARGIN, HEADLINE_Y, 40, { weight: 700 }) +
			clipDefs() +
			cells +
			legend.svg +
			footer.svg
	);
}
