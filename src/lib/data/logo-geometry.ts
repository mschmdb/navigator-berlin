/**
 * navigator.berlin Logo-Geometrie.
 *
 * Reproduzierbar via `python3 scripts/generate-logo.py`.
 * Quelle: static/layers/bezirke.*.geojson (ODIS / Senatsverwaltung, dl-de/zero-2-0)
 * Pipeline:
 *   1. unary_union der 12 Bezirks-Polygone → Berlin-Außenkontur
 *   2. Cos-Lat-Projektion (Berlin ~52.5°N) → echte Proportion
 *   3. Douglas-Peucker simplify → 32 Boundary-Punkte
 *   4. Halton-Sequenz im Inneren → 4 Vermessungs-Stützpunkte
 *   5. Delaunay-Triangulation über (Boundary + Anchors) → 41 innere Kanten
 *   6. Canvas: SVG 100×100, Y-flip, Padding 8
 *
 * DO NOT EDIT MANUALLY. Regeneriere via Script.
 */

export type Point = readonly [x: number, y: number];
export type Edge = readonly [x1: number, y1: number, x2: number, y2: number];

/** 32 Boundary-Punkte in Reihenfolge des Polygon-Umlaufs. */
export const BOUNDARY_POINTS: readonly Point[] = [
	[49.37, 76.93],
	[24.83, 67.68],
	[13.08, 74.65],
	[8.0, 69.64],
	[17.78, 49.53],
	[11.34, 47.91],
	[15.87, 36.34],
	[12.79, 33.45],
	[23.87, 33.41],
	[24.27, 25.0],
	[29.74, 25.3],
	[32.07, 18.33],
	[35.48, 19.02],
	[34.55, 25.23],
	[41.64, 26.04],
	[55.53, 20.15],
	[53.12, 17.93],
	[56.72, 15.28],
	[62.18, 21.56],
	[60.31, 32.45],
	[78.96, 45.28],
	[73.25, 57.47],
	[84.52, 57.97],
	[91.44, 62.51],
	[92.0, 64.33],
	[87.22, 64.37],
	[89.25, 70.51],
	[77.95, 84.72],
	[77.18, 76.65],
	[56.76, 72.85],
	[54.72, 67.68],
	[49.11, 69.96]
];

/** 4 Innere Vermessungs-Stützpunkte (Halton-2-3-Sequenz, im Polygon mit Mindest-Abstand zur Boundary). */
export const ANCHOR_POINTS: readonly Point[] = [
	[50.0, 38.43],
	[29.0, 61.57],
	[34.25, 41.0],
	[76.25, 64.15]
];

/** 41 Delaunay-Kanten zwischen (Boundary + Anchor)-Punkten, gefiltert auf vollständig innerhalb des Polygons, Boundary-Segmente ausgeschlossen. */
export const DELAUNAY_EDGES: readonly Edge[] = [
	[29.74, 25.3, 34.25, 41.0],
	[87.22, 64.37, 91.44, 62.51],
	[32.07, 18.33, 34.55, 25.23],
	[73.25, 57.47, 76.25, 64.15],
	[55.53, 20.15, 62.18, 21.56],
	[50.0, 38.43, 55.53, 20.15],
	[29.0, 61.57, 49.11, 69.96],
	[34.25, 41.0, 50.0, 38.43],
	[50.0, 38.43, 73.25, 57.47],
	[8.0, 69.64, 24.83, 67.68],
	[77.18, 76.65, 89.25, 70.51],
	[23.87, 33.41, 34.25, 41.0],
	[24.83, 67.68, 29.0, 61.57],
	[50.0, 38.43, 54.72, 67.68],
	[50.0, 38.43, 60.31, 32.45],
	[76.25, 64.15, 77.18, 76.65],
	[76.25, 64.15, 89.25, 70.51],
	[29.0, 61.57, 34.25, 41.0],
	[76.25, 64.15, 87.22, 64.37],
	[56.76, 72.85, 76.25, 64.15],
	[55.53, 20.15, 60.31, 32.45],
	[23.87, 33.41, 29.74, 25.3],
	[41.64, 26.04, 50.0, 38.43],
	[34.25, 41.0, 49.11, 69.96],
	[49.11, 69.96, 50.0, 38.43],
	[17.78, 49.53, 23.87, 33.41],
	[60.31, 32.45, 73.25, 57.47],
	[15.87, 36.34, 17.78, 49.53],
	[55.53, 20.15, 56.72, 15.28],
	[17.78, 49.53, 34.25, 41.0],
	[17.78, 49.53, 24.83, 67.68],
	[15.87, 36.34, 23.87, 33.41],
	[54.72, 67.68, 76.25, 64.15],
	[24.83, 67.68, 49.11, 69.96],
	[54.72, 67.68, 73.25, 57.47],
	[17.78, 49.53, 29.0, 61.57],
	[34.25, 41.0, 41.64, 26.04],
	[34.25, 41.0, 34.55, 25.23],
	[29.74, 25.3, 34.55, 25.23],
	[76.25, 64.15, 84.52, 57.97],
	[84.52, 57.97, 87.22, 64.37]
];

/** SVG-Path-d für Berlin-Außenkontur (closed). Verwendet BOUNDARY_POINTS. */
export const BOUNDARY_PATH_D = (() => {
	const [first, ...rest] = BOUNDARY_POINTS;
	const tail = rest.map(([x, y]) => `${x},${y}`).join(' ');
	return `M ${first[0]},${first[1]} ${tail} Z`;
})();

/** Indizes der 8 schärfsten Knicke für Favicon-Reduktion. */
export const FAVICON_POINT_INDICES: readonly number[] = [0, 4, 7, 15, 21, 24, 25, 27];
