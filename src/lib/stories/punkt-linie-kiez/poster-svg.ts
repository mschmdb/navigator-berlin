import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime.js';
import { compositionElements } from './composition-svg';
import { legendRows, type LegendRow } from './legend';
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
	opts: { weight?: number; anchor?: 'start' | 'end' } = {}
): string =>
	`<text x="${x}" y="${y}" font-size="${size}" font-weight="${opts.weight ?? 400}" text-anchor="${opts.anchor ?? 'start'}" fill="${STORY_INK}">${esc(value)}</text>`;

function icon(row: LegendRow, x: number, y: number): string {
	const g = (inner: string): string =>
		`<g transform="translate(${x} ${y}) scale(1.4)">${inner}</g>`;
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
	const footer = footerLines
		.map((l, i) => text(l, POSTER_WIDTH - left, 1118 + i * 14, 11, { anchor: 'end' }))
		.join('');

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}" font-family="${esc(STORY_FONT)}">` +
		`<rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="${STORY_PAPER}"/>` +
		`<rect x="20" y="20" width="${POSTER_WIDTH - 40}" height="${POSTER_HEIGHT - 40}" fill="none" stroke="${STORY_INK}" stroke-width="${THICK}"/>` +
		text(m.plk_title({}, o), left, 96, 34) +
		text(item.name.toLocaleLowerCase('de'), left, 168, 60, { weight: 700 }) +
		`<defs><clipPath id="plk-clip"><rect width="${VIEW}" height="${VIEW}"/></clipPath></defs>` +
		`<g transform="translate(${compX} ${compY}) scale(${scale})"><g clip-path="url(#plk-clip)">${compositionElements(item.kennzahlen)}</g></g>` +
		legend +
		`<line x1="${left}" y1="1085" x2="${POSTER_WIDTH - left}" y2="1085" stroke="${STORY_INK}" stroke-width="${THIN}"/>` +
		text(m.plk_footer_brand({}, o), left, 1125, 26, { weight: 700 }) +
		footer +
		`</svg>`
	);
}
