/**
 * Motiv für OG-Karte und Übersichts-Miniatur von „Berlin in Quadraten“: ein einzelnes
 * Quadrat, Friedrichshain-Kreuzberg bei der Abgeordnetenhauswahl 2026 wie in Kapitel 1.
 * Ohne Zahlen, weil der OG-Renderer Jost im eingebetteten SVG nicht kennt.
 */
import { colorsInOrder } from './farben';
import { toElectionShares } from './eingabe';
import { derive, sharesOf } from './grau';
import { layout, SIDE } from './layout';
import { wahlenOf } from './bilddaten';
import type { StoriesWahlData } from './types';

const BEZIRK = 'friedrichshain-kreuzberg';
const f = (n: number): string => (Math.round(n * 100) / 100).toString();

/** Anteile je Block für das Motiv. */
export function vorschauShares(data: StoriesWahlData): number[] {
	const wahl = wahlenOf('agh').at(-1)!;
	const b = data.bezirke.find((x) => x.slug === BEZIRK);
	if (!b) throw new Error(`stories-wahl.json: ${BEZIRK} fehlt`);
	return sharesOf(derive(toElectionShares(b.wahlen[wahl.slug])));
}

/** Das Quadrat als SVG, füllt `size` × `size` ganz. */
export function ogKompositionSvg(data: StoriesWahlData, size: number): string {
	const colors = colorsInOrder();
	const rects = layout(vorschauShares(data))
		.map((r, k) =>
			r.w > 0 && r.h > 0
				? `<rect x="${f(r.x)}" y="${f(r.y)}" width="${f(r.w)}" height="${f(r.h)}" fill="${colors[k]}"/>`
				: ''
		)
		.join('');
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
		`<g transform="scale(${f(size / SIDE)})">${rects}</g>` +
		`</svg>`
	);
}
