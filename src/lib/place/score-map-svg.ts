/**
 * Umriss-Karte als eigenständige SVG-Datei (NAV-105): Die Kiez- und Bezirksseiten binden sie
 * als Bild ein. So stehen die Pfade weder im HTML noch in den Seitendaten, und der Browser
 * cacht die Karte getrennt.
 */
import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
import { placeMapFill } from './map-classes';

const INK = '#141414';
const MUTED = '#e2dfd3';
const GAP = '#ffffff';

export interface ScoreMapInput {
	readonly outline: RegionOutline;
	readonly scores: ReadonlyMap<
		string,
		{ readonly name: string; readonly composite: number | null }
	>;
	readonly ownSlug: string | null;
	/** Ohne Score-Farben: alle Gebiete hell, nur der eigene dunkel (Lage-Kärtchen). */
	readonly plain?: boolean;
}

function esc(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function renderScoreMapSvg({
	outline,
	scores,
	ownSlug,
	plain = false
}: ScoreMapInput): string {
	const paths = [...outline.paths].sort(
		(a, b) => Number(a.id === ownSlug) - Number(b.id === ownSlug)
	);
	const body = paths
		.map((p) => {
			const own = p.id === ownSlug;
			const s = scores.get(p.id);
			const fill = plain ? (own ? INK : MUTED) : placeMapFill(s?.composite ?? null);
			const title =
				!plain && s?.composite != null
					? `${s.name}: ${Math.round(s.composite)}`
					: (s?.name ?? p.id);
			return `<path d="${p.d}" fill="${fill}" stroke="${own ? INK : GAP}" stroke-width="${own ? 4 : 1.2}" stroke-linejoin="round" fill-rule="evenodd"><title>${esc(title)}</title></path>`;
		})
		.join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${outline.viewBox}" width="${outline.width}" height="${outline.height}">${body}</svg>`;
}
