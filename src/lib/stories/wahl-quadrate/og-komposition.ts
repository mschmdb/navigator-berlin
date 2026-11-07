/**
 * Komposition für die OG-Karte des Beitrags „Berlin in Quadraten“ im Site-Layout
 * (`scripts/generate-og-images.ts`), wie die Komposition von „Punkt, Linie, Kiez“ auf der
 * Stories-Karte: Papier mit Rahmen, darin die zwölf Bezirke bei der Abgeordnetenhauswahl
 * 2026 als Quadrate, alphabetisch, ohne Zahlen.
 */
import { STORY_INK, STORY_PAPER } from '../tokens';
import { bezirkeAlphabetisch, wahlenOf } from './bilddaten';
import { toElectionShares } from './eingabe';
import { colorsInOrder } from './farben';
import { derive, sharesOf } from './grau';
import { layout, SIDE } from './layout';
import type { StoriesWahlData } from './types';

const COLS = 4;
const ROWS = 3;
const f = (n: number): string => (Math.round(n * 100) / 100).toString();

/** Anteile je Block für die zwölf Bezirke bei der Abgeordnetenhauswahl 2026, alphabetisch. */
export function vorschauShares(data: StoriesWahlData): number[][] {
	const wahl = wahlenOf('agh').at(-1)!;
	return bezirkeAlphabetisch(data).map((b) =>
		sharesOf(derive(toElectionShares(b.wahlen[wahl.slug])))
	);
}

export function ogKompositionSvg(data: StoriesWahlData, size: number): string {
	const colors = colorsInOrder();
	const pad = size * 0.07;
	const gap = size * 0.05;
	const sq = (size - 2 * pad - (COLS - 1) * gap) / COLS;
	const top = (size - ROWS * sq - (ROWS - 1) * gap) / 2;
	const squares = vorschauShares(data).map((shares, i) => {
		const x = pad + (i % COLS) * (sq + gap);
		const y = top + Math.floor(i / COLS) * (sq + gap);
		const blocks = layout(shares);
		const rects = blocks
			.map((r, k) =>
				r.w > 0 && r.h > 0
					? `<rect x="${f(r.x)}" y="${f(r.y)}" width="${f(r.w)}" height="${f(r.h)}" fill="${colors[k]}"/>`
					: ''
			)
			.join('');
		return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sq / SIDE)})">${rects}</g>`;
	});
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
		`<rect x="1" y="1" width="${size - 2}" height="${size - 2}" fill="${STORY_PAPER}" stroke="${STORY_INK}" stroke-width="2"/>` +
		squares.join('') +
		`</svg>`
	);
}
