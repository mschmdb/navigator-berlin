import { geometry } from './geometry';
import { VIEW, type Kennzahlen } from './types';
import { STORY_INK, STORY_PAPER, STORY_SERIES } from '../tokens';

const COLORS = STORY_SERIES['punkt-linie-kiez'].colors;
const [THIN] = STORY_SERIES['punkt-linie-kiez'].lineWidths;
const f = (n: number): string => n.toFixed(1);

/**
 * Die Komposition als SVG-Elemente im 200er-Feld: dieselbe Geometrie und Reihenfolge
 * wie die Svelte-Komponente (Linien zuerst, kein Blend-Modus). Quelle für OG-Bild und PDF.
 */
export function compositionElements(k: Kennzahlen, hairline: number = THIN): string {
	const g = geometry(k);
	const parts: string[] = [`<rect width="${VIEW}" height="${VIEW}" fill="${STORY_PAPER}"/>`];
	for (const y of g.lines) {
		parts.push(
			`<line x1="0" y1="${f(y - 40)}" x2="${VIEW}" y2="${f(y + 40)}" stroke="${STORY_INK}" stroke-width="${hairline}"/>`
		);
	}
	if (g.circle) {
		parts.push(
			`<circle cx="${f(g.circle.cx)}" cy="${f(g.circle.cy)}" r="${f(g.circle.r)}" fill="${COLORS.kreis.hex}"/>`
		);
	}
	if (g.square) {
		parts.push(
			`<rect x="${f(g.square.x)}" y="${f(g.square.y)}" width="${f(g.square.size)}" height="${f(g.square.size)}" fill="${COLORS.quadrat.hex}"/>`
		);
	}
	if (g.triangle) {
		const t = g.triangle;
		parts.push(
			`<path d="M${f(t.x)},${f(t.y)}l${f(t.size)},0l${f(-t.size / 2)},${f(-t.size * 0.87)}Z" fill="${COLORS.dreieck.hex}" stroke="${STORY_INK}" stroke-width="${hairline}" stroke-linejoin="round"/>`
		);
	}
	if (g.donut) {
		const d = g.donut;
		parts.push(
			`<circle cx="${f(d.cx)}" cy="${f(d.cy)}" r="${f(d.r * 0.72)}" fill="none" stroke="${COLORS.donut.hex}" stroke-width="${f(d.r * 0.56)}"/>`
		);
	}
	if (g.bar) {
		const b = g.bar;
		parts.push(
			`<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${b.h}" fill="${COLORS.balken.hex}" transform="rotate(${b.rot} ${VIEW / 2} ${VIEW / 2})"/>`
		);
	}
	parts.push(
		`<rect x=".5" y=".5" width="${VIEW - 1}" height="${VIEW - 1}" fill="none" stroke="${STORY_INK}" stroke-width="${hairline}"/>`
	);
	return parts.join('');
}

/** Eigenständiges SVG, etwa als Data-URI für Satori. */
export function compositionSvg(k: Kennzahlen, size: number, hairline: number = THIN): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${VIEW} ${VIEW}">${compositionElements(k, hairline)}</svg>`;
}
