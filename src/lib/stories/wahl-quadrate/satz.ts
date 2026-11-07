/** Satz-Helfer für die Bilder: Text als SVG, Umbruch nach gemessener Breite. */
import { STORY_INK } from '../tokens';
import type { Measure } from './labels';

export interface Fonts {
	black: Measure;
	regular: Measure;
}

export const esc = (s: string): string =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const n2 = (v: number): string => String(Math.round(v * 100) / 100);

export interface TextOptions {
	black?: boolean;
	anchor?: 'start' | 'middle' | 'end';
	fill?: string;
	attrs?: string;
}

/** Ein Textelement. Jost 900 für Titel, Jahre, Namen und Zahlen, sonst Jost 400. */
export function txt(
	value: string,
	x: number,
	y: number,
	size: number,
	o: TextOptions = {}
): string {
	const anchor = o.anchor && o.anchor !== 'start' ? ` text-anchor="${o.anchor}"` : '';
	const attrs = o.attrs ? ` ${o.attrs}` : '';
	return `<text x="${n2(x)}" y="${n2(y)}" font-size="${n2(size)}" font-weight="${o.black ? 900 : 400}" fill="${o.fill ?? STORY_INK}"${anchor}${attrs}>${esc(value)}</text>`;
}

/** Bricht an Wortgrenzen um, sobald die Vorschubbreite `width` übersteigt. */
export function wrap(text: string, width: number, size: number, measure: Measure): string[] {
	const lines: string[] = [];
	let line = '';
	for (const word of text.split(/\s+/).filter(Boolean)) {
		const next = line ? `${line} ${word}` : word;
		if (line && measure(next).adv * size > width) {
			lines.push(line);
			line = word;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines;
}

/** Bezirksnamen: zu lange Doppelnamen brechen nach dem Bindestrich, der Strich bleibt oben. */
export function splitName(name: string, width: number, size: number, measure: Measure): string[] {
	if (measure(name).adv * size <= width || !name.includes('-')) return [name];
	const i = name.indexOf('-') + 1;
	return [name.slice(0, i), name.slice(i)];
}
