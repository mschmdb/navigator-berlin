import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime.js';
import { compositionElements } from './composition-svg';
import { legendRows, legendShapes, type LegendShape } from './legend';
import { STORY_FONT, STORY_INK, STORY_PAPER, STORY_SERIES } from '../tokens';
import { VIEW, type BezirkItem, type KennzahlenQuelle } from './types';

export const POSTER_WIDTH = 1000;
export const POSTER_HEIGHT = 1250;

const [THIN, THICK] = STORY_SERIES['punkt-linie-kiez'].lineWidths;
const COMPOSITION = 640;
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

/** Fußlinie, Marke, Quellen mit Stand, OSM-Hinweis und Lizenz. */
function posterFooter(sources: readonly KennzahlenQuelle[], lang: Locale): string {
	const o = { locale: lang };
	const left = 60;
	const sourceLine = `${m.plk_sources_label({}, o)}: ${[
		...new Map(sources.map((s) => [s.name, s])).values()
	]
		.map((s) => (s.stand ? `${s.name} (${m.plk_stand({}, o)} ${s.stand})` : s.name))
		.join('; ')}.`;
	const footerLines = [
		...wrapText(sourceLine, POSTER_WIDTH - 2 * left - 240, 11),
		m.plk_osm({}, o),
		...wrapText(m.plk_pdf_license({}, o), POSTER_WIDTH - 2 * left - 240, 11)
	];
	return (
		`<line x1="${left}" y1="1085" x2="${POSTER_WIDTH - left}" y2="1085" stroke="${STORY_INK}" stroke-width="${THIN}"/>` +
		text(m.plk_footer_brand({}, o), left, 1125, 26, { weight: 700 }) +
		footerLines
			.map((l, i) => text(l, POSTER_WIDTH - left, 1118 + i * 14, 11, { anchor: 'end' }))
			.join('')
	);
}

/**
 * Poster 4:5 als SVG-String: Papier, Rahmen, Titel, Bezirk, die große Komposition,
 * Legende mit Werten und Fußzeile. Die Komposition kommt aus derselben Quelle wie Komponente
 * und OG-Bild. Die Sprache ist ein Argument, damit der Build beide Fassungen erzeugt.
 */
export function posterSvg(
	item: BezirkItem,
	sources: readonly KennzahlenQuelle[],
	lang: Locale
): string {
	const o = { locale: lang };
	const left = 60;
	const compX = (POSTER_WIDTH - COMPOSITION) / 2;
	const compY = 190;
	const scale = COMPOSITION / VIEW;
	const rows = legendRows(item.kennzahlen, lang);

	const legendTop = compY + COMPOSITION + 45;
	const colWidth = (POSTER_WIDTH - 2 * left) / 2;
	const legend = rows
		.map((row, i) => {
			const x = left + (i % 2) * colWidth;
			const y = legendTop + Math.floor(i / 2) * 72;
			return (
				icon(row, x, y) +
				text(row.label, x + 56, y + 14, 20) +
				text(row.value, x + 56, y + 46, 30, { weight: 700 })
			);
		})
		.join('');

	return posterFrame(
		text(m.plk_title({}, o), left, 96, 34) +
			text(item.name.toLocaleLowerCase('de'), left, 168, 60, { weight: 700 }) +
			clipDefs() +
			`<g transform="translate(${compX} ${compY}) scale(${scale})"><g clip-path="url(#${CLIP_ID})">${compositionElements(item.kennzahlen)}</g></g>` +
			legend +
			posterFooter(sources, lang)
	);
}

/**
 * Gesamtplakat: alle Bezirke alphabetisch im Raster (3 Spalten), darunter je der
 * Name, und eine gemeinsame Legende ohne Werte. Die Kompositionen sind die große Geometrie,
 * verkleinert.
 */
export function overviewPosterSvg(
	bezirke: readonly BezirkItem[],
	sources: readonly KennzahlenQuelle[],
	lang: Locale
): string {
	const o = { locale: lang };
	const left = 60;
	const columns = 3;
	const size = 176;
	const pitchX = (POSTER_WIDTH - 2 * left) / columns;
	const pitchY = 208;
	const gridTop = 125;
	const scale = size / VIEW;

	const cells = [...bezirke]
		.sort((a, b) => a.name.localeCompare(b.name, 'de'))
		.map((b, i) => {
			const x = left + (i % columns) * pitchX + (pitchX - size) / 2;
			const y = gridTop + Math.floor(i / columns) * pitchY;
			return (
				`<g transform="translate(${x} ${y}) scale(${scale})"><g clip-path="url(#${CLIP_ID})">${compositionElements(b.kennzahlen)}</g></g>` +
				text(b.name.toLocaleLowerCase('de'), x + size / 2, y + size + 26, 20, { anchor: 'middle' })
			);
		})
		.join('');

	const legend = legendShapes(lang)
		.map((row, i) => {
			const x = left + (i % columns) * pitchX;
			const y = 1002 + Math.floor(i / columns) * 38;
			return icon(row, x, y, 1) + text(row.label, x + 38, y + 20, 17);
		})
		.join('');

	return posterFrame(
		text(m.plk_title({}, o), left, 80, 34) +
			clipDefs() +
			cells +
			legend +
			posterFooter(sources, lang)
	);
}
