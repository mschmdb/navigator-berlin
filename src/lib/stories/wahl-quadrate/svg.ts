import { STORY_FONT, STORY_INK, STORY_PAPER } from '../tokens';
import type { PlacedSquare } from './anordnung';
import type { Block } from './layout';
import { placeLabels, type Measure } from './labels';
import { mixHex } from './kontrast';
import { ORDER, REST_INDEX, type PartyKey } from './parteien';

export interface FillOptions {
	/** Diese Partei bleibt farbig, alle anderen blassen zu 80 % Richtung Papier ab. */
	highlight?: PartyKey | null;
	/** Grau-Block verbergen (Fläche bleibt, Füllung entfällt). */
	hideGrey?: boolean;
}

/** Gezeichnete Füllung je Block in `ORDER`. `null` = verborgen. */
export function fillsFor(colors: readonly string[], opts: FillOptions = {}): (string | null)[] {
	if (colors.length !== ORDER.length)
		throw new RangeError(`erwarte ${ORDER.length} Farben, bekam ${colors.length}`);
	return colors.map((c, i) => {
		if (opts.hideGrey && i === REST_INDEX) return null;
		if (opts.highlight && ORDER[i] !== opts.highlight) return mixHex(c, STORY_PAPER, 0.8);
		return c;
	});
}

export interface SquareSvgInput extends FillOptions {
	blocks: readonly Block[];
	/** Parteifarbe je Block in `ORDER`. */
	colors: readonly string[];
	/** Zugänglicher Name, z. B. aus der Caption. */
	title: string;
	/** Nichtwähler-Variante: Eckmarken zeigen das ganze Quadrat. */
	paper?: boolean;
	/** Zahlen je Block, siehe `shareTexts`. Ohne: keine Zahlen. */
	texts?: readonly (string | null)[] | null;
	/** Pixel pro viewBox-Einheit im Zielmedium. Pflicht mit `texts`. */
	scale?: number;
	/** Schriftmessung für Jost 900. Pflicht mit `texts`. */
	measure?: Measure;
	insideOnly?: boolean;
	exportMode?: boolean;
	/** Rand in viewBox-Einheiten, damit Außenbeschriftung nicht abgeschnitten wird. */
	margin?: { top: number; right: number; bottom: number; left: number };
}

const f3 = (n: number): string => n.toFixed(3);
const esc = (s: string): string =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const CORNERS = 'M0 4V0H4M96 0H100V4M100 96V100H96M4 100H0V96';

/** Innere SVG-Elemente eines Quadrats im 100er-Raster. */
export function squareElements(input: SquareSvgInput): string {
	const fills = fillsFor(input.colors, input);
	const parts: string[] = input.blocks.map((r, i) => {
		const geo = `x="${f3(r.x)}" y="${f3(r.y)}" width="${f3(Math.max(0, r.w))}" height="${f3(Math.max(0, r.h))}"`;
		const fill = fills[i];
		return fill == null
			? `<rect ${geo} fill="none" stroke="${STORY_INK}" stroke-opacity="0.45" stroke-width="1" vector-effect="non-scaling-stroke"/>`
			: `<rect ${geo} fill="${fill}"/>`;
	});
	if (input.paper)
		parts.push(`<path d="${CORNERS}" fill="none" stroke="${STORY_INK}" stroke-width="0.35"/>`);

	if (input.texts) {
		if (input.measure == null || input.scale == null)
			throw new TypeError('Zahlen brauchen measure und scale');
		const labels = placeLabels(input.blocks, input.texts, {
			scale: input.scale,
			measure: input.measure,
			fills,
			insideOnly: input.insideOnly,
			exportMode: input.exportMode
		});
		const font = `font-family="${esc(STORY_FONT)}" font-weight="900" aria-hidden="true"`;
		for (const l of labels.inside) {
			const rot = l.rotate ? ` rotate(${l.rotate})` : '';
			parts.push(
				`<text ${font} fill="${l.fill}" font-size="${f3(l.fontSize)}" transform="translate(${f3(l.x)} ${f3(l.y)})${rot}">${esc(l.text)}</text>`
			);
		}
		for (const l of labels.outside) {
			const { x1, y1, x2, y2 } = l.line;
			parts.push(
				`<path d="M${f3(x1)} ${f3(y1)}L${f3(x2)} ${f3(y2)}" stroke="${STORY_INK}" stroke-width="1" fill="none" vector-effect="non-scaling-stroke"/>`,
				`<text ${font} fill="${STORY_INK}" font-size="${f3(l.fontSize)}" text-anchor="${l.anchor}" x="${f3(l.x)}" y="${f3(l.y)}">${esc(l.text)}</text>`
			);
		}
	}
	return parts.join('');
}

/** Ein Quadrat als eigenständiges SVG, für Plakat und OG-Bild. */
export function squareSvg(input: SquareSvgInput): string {
	const m = input.margin ?? { top: 0, right: 0, bottom: 0, left: 0 };
	const vb = [-m.left, -m.top, 100 + m.left + m.right, 100 + m.top + m.bottom]
		.map((n) => String(n))
		.join(' ');
	return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(input.title)}" viewBox="${vb}" shape-rendering="crispEdges">${squareElements(input)}</svg>`;
}

/** Ein platziertes Quadrat (`placeSquare`) als Gruppe im Seiten-SVG. */
export function placedSquareSvg(
	p: PlacedSquare,
	colors: readonly string[],
	measure: Measure,
	exportMode = false
): string {
	return (
		`<g transform="translate(${f3(p.x)} ${f3(p.y)}) scale(${p.size / 100})">` +
		squareElements({
			blocks: p.blocks,
			colors,
			title: p.title,
			texts: p.texts,
			scale: p.scale,
			measure,
			exportMode,
			insideOnly: p.insideOnly
		}) +
		`</g>`
	);
}
