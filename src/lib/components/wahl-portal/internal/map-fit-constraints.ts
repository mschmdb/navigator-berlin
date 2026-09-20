/**
 * Story 12 (Portal-Feinschliff): reine Bbox-Puffer-Arithmetik für die
 * Karten-Anschlag-Grenzen von Wechsel-/Trends-Kapitel. Nach dem initialen
 * `fitBounds` setzen beide Controller `maxBounds` auf die NACH dem Fit
 * SICHTBAREN Bounds (`map.getBounds().toArray()`) plus diesem Puffer --
 * nicht mehr auf die schmale Daten-Bbox: der Viewport ist dann nie breiter
 * als `maxBounds`, MapLibre zwingt sich also nicht mehr per Constrain-Zoom
 * hinein (Review Triage Log #1: Berlin war dadurch oben/unten beschnitten).
 */

/** MapLibre-`fitBounds`/`LngLatBounds.toArray`-Tupel: [[minLng, minLat], [maxLng, maxLat]]. */
export type FitBounds = readonly [readonly [number, number], readonly [number, number]];

/** 8% Puffer je Achse -- Basis ist jetzt der ganze sichtbare Viewport nach
 * dem Fit statt der schmalen Daten-Bbox; 8% davon sind ein spürbarer, aber
 * weiterhin begrenzter Pan-Spielraum (Review Triage Log #1). */
const BUFFER_RATIO = 0.08;

/** Mindest-Puffer in Grad, falls eine Achse der Fit-Bbox (fast) keine
 * Ausdehnung hat -- ohne diesen Boden wäre `maxBounds` bei Spannweite 0 ein
 * Punkt, die Karte liesse sich dann gar nicht mehr bewegen. */
const MIN_PAD_DEGREES = 0.01;

function padSpan(span: number): number {
	const pad = span * BUFFER_RATIO;
	return pad > MIN_PAD_DEGREES ? pad : MIN_PAD_DEGREES;
}

/** Kleinster Wert der Achse; fällt auf 0 zurück, wenn keiner der beiden
 * Werte endlich ist (Review Triage Log #2: eine leere FeatureCollection
 * liefert aus `turf.bbox` Infinity/-Infinity statt echter Koordinaten). */
function safeMin(a: number, b: number): number {
	const lo = Math.min(a, b);
	return Number.isFinite(lo) ? lo : 0;
}

/** Größter Wert der Achse, mindestens `floor` -- garantiert min <= max auch
 * wenn nur einer der beiden Eingabewerte endlich ist. */
function safeMax(a: number, b: number, floor: number): number {
	const hi = Math.max(a, b);
	return Number.isFinite(hi) ? Math.max(hi, floor) : floor;
}

/** Puffert eine Bbox (typischerweise die nach dem Fit sichtbaren
 * `map.getBounds()`) um `BUFFER_RATIO` je Achse für `map.setMaxBounds`.
 * Normalisiert vertauschte min/max und fällt bei nicht-finiten Werten auf
 * einen endlichen Mindest-Puffer zurück statt NaN/Infinity weiterzureichen. */
export function paddedMaxBounds(fitTo: FitBounds): FitBounds {
	const [[lng1, lat1], [lng2, lat2]] = fitTo;
	const minLng = safeMin(lng1, lng2);
	const maxLng = safeMax(lng1, lng2, minLng);
	const minLat = safeMin(lat1, lat2);
	const maxLat = safeMax(lat1, lat2, minLat);

	const lngPad = padSpan(maxLng - minLng);
	const latPad = padSpan(maxLat - minLat);
	return [
		[minLng - lngPad, minLat - latPad],
		[maxLng + lngPad, maxLat + latPad]
	];
}
