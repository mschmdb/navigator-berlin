/**
 * Quadrate auf einer Seite (Plakat, Social-Bild): Größe finden, bei der alle Außenzahlen in
 * ihre Zelle passen, und jedes Quadrat mit seinen Zahlen an eine Stelle setzen. Seiten-
 * einheiten sind die Einheiten des umgebenden SVG, ein Quadrat misst dort `size`.
 */
import { layout, SIDE, type Block } from './layout';
import { placeLabels, type Labels, type Measure } from './labels';

export interface SquareSpec {
	/** Anteil je Block in `ORDER`. */
	shares: readonly number[];
	/** Zahl je Block, `null` = keine Zahlen. */
	texts: readonly (string | null)[] | null;
	/** Zugänglicher Name des Quadrats. */
	title: string;
}

export interface PlaceOptions {
	/** Pixel pro Seiteneinheit im Zielmedium. Bestimmt Mindest- und Außengröße der Zahlen. */
	density: number;
	measure: Measure;
	/** Gezeichnete Füllung je Block, siehe `fillsFor`. */
	fills: readonly (string | null)[];
	exportMode?: boolean;
	/** Jede Zahl im Block, keine Außenbeschriftung. */
	insideOnly?: boolean;
}

export interface PlacedSquare extends SquareSpec {
	x: number;
	y: number;
	size: number;
	/** Pixel pro viewBox-Einheit, Eingabe für `placeLabels` und `squareElements`. */
	scale: number;
	blocks: Block[];
	fills: readonly (string | null)[];
	labels: Labels | null;
}

export interface Extent {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export function placeSquare(
	spec: SquareSpec,
	x: number,
	y: number,
	size: number,
	opts: PlaceOptions
): PlacedSquare {
	const blocks = layout(spec.shares);
	const scale = (size / SIDE) * opts.density;
	const labels = spec.texts
		? placeLabels(blocks, spec.texts, {
				scale,
				measure: opts.measure,
				fills: opts.fills,
				exportMode: opts.exportMode,
				insideOnly: opts.insideOnly
			})
		: null;
	return { ...spec, x, y, size, scale, blocks, fills: opts.fills, labels };
}

/** Wie weit die Außenzahlen samt Linien über das Quadrat hinausragen, in Seiteneinheiten. */
export function labelExtent(p: PlacedSquare): Extent {
	let minX = 0,
		minY = 0,
		maxX = SIDE,
		maxY = SIDE;
	for (const l of p.labels?.outside ?? []) {
		minX = Math.min(minX, l.box.x, l.line.x2);
		minY = Math.min(minY, l.box.y, l.line.y2);
		maxX = Math.max(maxX, l.box.x + l.box.w, l.line.x2);
		maxY = Math.max(maxY, l.box.y + l.box.h, l.line.y2);
	}
	const f = p.size / SIDE;
	return {
		left: Math.max(0, -minX * f),
		top: Math.max(0, -minY * f),
		right: (maxX - SIDE) * f,
		bottom: (maxY - SIDE) * f
	};
}

export interface Fit {
	size: number;
	/** Abstand des Quadrats vom linken Zellrand, Platz für Zahlen, die links überstehen. */
	inset: number;
}

/**
 * Größte ganzzahlige Kantenlänge, bei der jedes Quadrat samt Außenzahlen in eine Zelle
 * `cellW` × `cellH` passt. Das Quadrat steht oben in der Zelle, um `inset` eingerückt.
 */
export function fitSquareSize(
	specs: readonly SquareSpec[],
	cellW: number,
	cellH: number,
	opts: PlaceOptions
): Fit {
	for (let s = Math.floor(Math.min(cellW, cellH)); s >= 1; s--) {
		const ext = specs.map((spec) => labelExtent(placeSquare(spec, 0, 0, s, opts)));
		const inset = Math.max(0, ...ext.map((e) => e.left));
		const fits = ext.every(
			(e) => e.top <= 0 && inset + s + e.right <= cellW && s + e.bottom <= cellH
		);
		if (fits) return { size: s, inset };
	}
	throw new RangeError(`keine Quadratgröße passt in ${cellW} × ${cellH}`);
}
