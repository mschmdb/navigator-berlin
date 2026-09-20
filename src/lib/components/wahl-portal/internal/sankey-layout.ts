/**
 * Story 8 (Trends/Sankey): reines Layout-Modul für den Wahljahre-Sankey.
 * Kein `d3-sankey`, kein layerchart (Boundary: Eigenbau-SVG, siehe Design
 * Notes) -- Knoten-Rechtecke + kubische Bézier-Bänder aus den bereits
 * gebündelten Übergängen (`wechsel-data.ts#computeUebergaengeFromRows`).
 * MapLibre-/Svelte-frei, kein Netzwerk-Zugriff, voll unit-testbar.
 *
 * Knoten-Höhe = Anzahl Gebiete (nie Personen), aus
 * `wechsel-data.ts#parteiAnzahlProJahrFromRows` -- gezählt je effektivem
 * Jahr × Partei aus denselben effektiven Reihen wie die Übergänge. Deckt
 * damit auch Gebiete ab, deren Datenhistorie erst in einer MITTLEREN Spalte
 * beginnt (Coverage-Grenze, z. B. BVV-Kiez ab 2016): die frühere Herleitung
 * (erste Spalte aus `von`, Rest aus `nach`) verlor solche Gebiete, weil ihr
 * ausgehendes Band dann still gegen ein fehlendes Ziel-Knoten drop -- siehe
 * Review Triage Log #1.
 */
import type { SankeySpalte, Uebergang } from './wechsel-data.js';

export interface SankeyNode {
	readonly jahr: number;
	readonly partei: string;
	readonly anzahl: number;
	readonly x: number;
	readonly y: number;
	readonly height: number;
}

export interface SankeyColumn {
	readonly jahr: number;
	readonly istWiederholung: boolean;
	readonly x: number;
	readonly nodes: readonly SankeyNode[];
}

export interface SankeyBand {
	readonly vonJahr: number;
	readonly nachJahr: number;
	readonly von: string;
	readonly nach: string;
	readonly anzahl: number;
	readonly sourceY: number;
	readonly sourceHeight: number;
	readonly targetY: number;
	readonly targetHeight: number;
	/** Fertiger SVG-`path`-`d`-String (kubische Bézier, Muster d3-sankey-Look ohne die Library). */
	readonly path: string;
}

export interface SankeyLayoutResult {
	readonly width: number;
	readonly height: number;
	readonly nodeWidth: number;
	readonly columns: readonly SankeyColumn[];
	readonly bands: readonly SankeyBand[];
}

export interface SankeyLayoutOptions {
	readonly width?: number;
	readonly height?: number;
	readonly nodeWidth?: number;
	readonly nodePadding?: number;
}

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 360;
const DEFAULT_NODE_WIDTH = 16;
const DEFAULT_NODE_PADDING = 6;

function nodeKey(jahr: number, partei: string): string {
	return `${jahr}|${partei}`;
}

/**
 * Spalten/Knoten/Band-Geometrie aus den vorab gebündelten Spalten +
 * Übergängen + der Jahr×Partei-Knoten-Zählung. Deterministische
 * Knoten-Sortierung: Anzahl absteigend, dann alphabetisch (`localeCompare('de')`)
 * -- identisch zur Haus-Regel (`wechsel-data.ts#sortWechselEntriesForDisplay`).
 */
export function computeSankeyLayout(
	spalten: readonly SankeySpalte[],
	uebergaenge: readonly Uebergang[],
	parteiAnzahlProJahr: ReadonlyMap<number, ReadonlyMap<string, number>>,
	options: SankeyLayoutOptions = {}
): SankeyLayoutResult {
	const width = options.width ?? DEFAULT_WIDTH;
	const height = options.height ?? DEFAULT_HEIGHT;
	const nodeWidth = options.nodeWidth ?? DEFAULT_NODE_WIDTH;
	const nodePadding = options.nodePadding ?? DEFAULT_NODE_PADDING;

	const sortedSpalten = [...spalten].sort((a, b) => a.jahr - b.jahr);
	const n = sortedSpalten.length;
	const xStep = n > 1 ? (width - nodeWidth) / (n - 1) : 0;

	const nodeByKey = new Map<string, SankeyNode>();

	const columns: SankeyColumn[] = sortedSpalten.map((spalte, i) => {
		const counts = parteiAnzahlProJahr.get(spalte.jahr) ?? new Map<string, number>();
		const parteien = Array.from(counts.entries())
			.map(([partei, anzahl]) => ({ partei, anzahl }))
			.sort((a, b) => b.anzahl - a.anzahl || a.partei.localeCompare(b.partei, 'de'));

		const total = parteien.reduce((sum, p) => sum + p.anzahl, 0);
		const usableHeight = Math.max(height - nodePadding * Math.max(parteien.length - 1, 0), 0);
		const unitHeight = total > 0 ? usableHeight / total : 0;
		const x = i * xStep;

		let cursor = 0;
		const nodes: SankeyNode[] = parteien.map((p) => {
			const nodeHeight = p.anzahl * unitHeight;
			const node: SankeyNode = {
				jahr: spalte.jahr,
				partei: p.partei,
				anzahl: p.anzahl,
				x,
				y: cursor,
				height: nodeHeight
			};
			cursor += nodeHeight + nodePadding;
			nodeByKey.set(nodeKey(node.jahr, node.partei), node);
			return node;
		});

		return { jahr: spalte.jahr, istWiederholung: spalte.istWiederholung, x, nodes };
	});

	// Deterministische Cursor-Zuteilung je Knoten: ausgehende Bänder sortiert
	// nach Ziel-Partei (alphabetisch de), eingehende nach Quell-Partei -- hält
	// die Sub-Segmente eines Knotens ohne Crossing-Minimierung, aber stabil
	// reproduzierbar (Boundary: reines, testbares Layout statt Heuristik).
	const sourceCursor = new Map<string, number>();
	const targetCursor = new Map<string, number>();
	const sourceOffset = new Map<Uebergang, number>();
	const targetOffset = new Map<Uebergang, number>();

	for (const u of [...uebergaenge].sort((a, b) => a.nach.localeCompare(b.nach, 'de'))) {
		const key = nodeKey(u.vonJahr, u.von);
		const node = nodeByKey.get(key);
		if (!node) continue;
		const scale = node.anzahl > 0 ? node.height / node.anzahl : 0;
		const offset = sourceCursor.get(key) ?? 0;
		sourceOffset.set(u, node.y + offset);
		sourceCursor.set(key, offset + u.anzahl * scale);
	}
	for (const u of [...uebergaenge].sort((a, b) => a.von.localeCompare(b.von, 'de'))) {
		const key = nodeKey(u.nachJahr, u.nach);
		const node = nodeByKey.get(key);
		if (!node) continue;
		const scale = node.anzahl > 0 ? node.height / node.anzahl : 0;
		const offset = targetCursor.get(key) ?? 0;
		targetOffset.set(u, node.y + offset);
		targetCursor.set(key, offset + u.anzahl * scale);
	}

	const bands: SankeyBand[] = [];
	for (const u of uebergaenge) {
		const sourceNode = nodeByKey.get(nodeKey(u.vonJahr, u.von));
		const targetNode = nodeByKey.get(nodeKey(u.nachJahr, u.nach));
		if (!sourceNode || !targetNode) continue;

		const scaleSource = sourceNode.anzahl > 0 ? sourceNode.height / sourceNode.anzahl : 0;
		const scaleTarget = targetNode.anzahl > 0 ? targetNode.height / targetNode.anzahl : 0;
		const sourceHeight = u.anzahl * scaleSource;
		const targetHeight = u.anzahl * scaleTarget;
		const sourceY = sourceOffset.get(u) ?? sourceNode.y;
		const targetY = targetOffset.get(u) ?? targetNode.y;

		const x0 = sourceNode.x + nodeWidth;
		const x1 = targetNode.x;
		const xMid = (x0 + x1) / 2;

		const path =
			`M${x0},${sourceY} ` +
			`C${xMid},${sourceY} ${xMid},${targetY} ${x1},${targetY} ` +
			`L${x1},${targetY + targetHeight} ` +
			`C${xMid},${targetY + targetHeight} ${xMid},${sourceY + sourceHeight} ${x0},${sourceY + sourceHeight} ` +
			'Z';

		bands.push({
			vonJahr: u.vonJahr,
			nachJahr: u.nachJahr,
			von: u.von,
			nach: u.nach,
			anzahl: u.anzahl,
			sourceY,
			sourceHeight,
			targetY,
			targetHeight,
			path
		});
	}

	return { width, height, nodeWidth, columns, bands };
}
