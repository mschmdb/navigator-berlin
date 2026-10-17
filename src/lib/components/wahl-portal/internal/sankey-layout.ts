/**
 * #127 (Sankey auf LayerChart): reine Datenaufbereitung und Maße für das
 * `<Sankey>` von LayerChart. LayerChart rechnet das Layout mit d3-sankey in
 * der echten Containerbreite; dieses Modul liefert nur die Eingabe, die
 * Sortier-/Ausrichtungs-Funktionen und die Rückübersetzung der
 * d3-Ergebnisse in unsere Typen. Bewusst plain `.ts` (keine Runes), voll
 * unit-testbar.
 *
 * Spalten-Rückgrat: d3-sankeys Spalten-Erkennung beruht auf der längsten
 * Kanten-Kette ab kantenlosen Wurzeln (BFS-Tiefe, `computeNodeDepths` in
 * d3-sankey). Ein Gebiet kann seine erste effektive Wahl aber erst in einer
 * MITTLEREN Spalte haben (Coverage-Grenze, `sankey-graph.ts`-Test
 * „Mittelspalten-Start"); dessen Partei-Knoten hat dann keine eingehende
 * Kante und würde fälschlich in Spalte 0 landen. `computeNodeLayers`
 * platziert jeden Knoten über `nodeAlign(node, x)`, `x` ist nur die
 * Gesamt-Spaltenzahl. Unser `nodeAlign` gibt das vorab bekannte `column`
 * zurück; ein unsichtbares Null-Wert-Rückgrat (`__anchor__:0..C`, linear
 * verkettet) zwingt `x` auf mindestens `C + 1`. Die Anker werden nach dem
 * Layout herausgefiltert.
 */
import type { SankeyGraph, SankeyGraphLink, SankeyGraphNode } from './sankey-graph.js';

export const SANKEY_NODE_WIDTH = 16;
export const SANKEY_NODE_PADDING = 4;
/** Ab dieser Knoten-Höhe (px) passt ein Label ohne Überlapp zum Nachbarn. */
export const SANKEY_LABEL_MIN_HEIGHT = 10;
/** Unter diesem Spaltenabstand (px) ragen Mittelspalten-Labels in die Bänder. */
const MIN_COLUMN_GAP_FOR_INNER_LABELS = 110;
/** Platz unter dem Diagramm für die Jahres-Beschriftung. */
export const SANKEY_YEAR_LABEL_SPACE = 24;

const DESKTOP_LABEL_MARGIN = 90;
const MOBILE_LABEL_MARGIN = 60;
const DESKTOP_HEIGHT = 384;
const MOBILE_HEIGHT = 320;
const MOBILE_BREAKPOINT = 640;

const ANCHOR_PREFIX = '__anchor__:';

export interface SankeyInputNode {
	readonly id: string;
	readonly column: number;
	readonly virtual: boolean;
	readonly label: string;
	readonly anzahl: number;
	/** d3-sankey liest `fixedValue` als Knotenwert: unsere Knoten-Anzahl ist
	 * die Quelle der Wahrheit, nicht die Kanten-Summe. */
	readonly fixedValue: number;
	readonly original: SankeyGraphNode | null;
}

export interface SankeyInputLink {
	readonly source: string;
	readonly target: string;
	readonly value: number;
	readonly original: SankeyGraphLink | null;
}

export interface SankeyInput {
	readonly nodes: SankeyInputNode[];
	readonly links: SankeyInputLink[];
}

export interface SankeyPositionedNode extends SankeyGraphNode {
	readonly x0: number;
	readonly x1: number;
	readonly y0: number;
	readonly y1: number;
}

export interface SankeyPositionedLink extends SankeyGraphLink {
	readonly width: number;
}

/** Was d3-sankey an einem Eingabe-Knoten ergänzt. */
export interface SankeyLaidOutNode {
	readonly virtual?: boolean;
	readonly original?: SankeyGraphNode | null;
	readonly x0?: number;
	readonly x1?: number;
	readonly y0?: number;
	readonly y1?: number;
}

export interface SankeyLaidOutLink {
	readonly original?: SankeyGraphLink | null;
	readonly width?: number;
}

function anchorChain(columnSpan: number): SankeyInput {
	const nodes: SankeyInputNode[] = [];
	const links: SankeyInputLink[] = [];
	for (let c = 0; c <= columnSpan; c++) {
		nodes.push({
			id: `${ANCHOR_PREFIX}${c}`,
			column: c,
			virtual: true,
			label: '',
			anzahl: 0,
			fixedValue: 0,
			original: null
		});
		if (c > 0) {
			links.push({
				source: `${ANCHOR_PREFIX}${c - 1}`,
				target: `${ANCHOR_PREFIX}${c}`,
				value: 0,
				original: null
			});
		}
	}
	return { nodes, links };
}

/**
 * Eingabe für LayerCharts `<Sankey>`: reale Knoten/Links plus Anker-Rückgrat.
 * Nur Plain-Objekte (LayerChart ruft `structuredClone` auf die Daten). Die
 * Spannweite sichert über `max(column)` ab und ist mindestens 1, sonst teilt
 * d3 bei einer Spalte durch 0 (`kx = (w - dx) / (x - 1)`).
 */
export function buildSankeyInput(graph: SankeyGraph): SankeyInput {
	if (graph.nodes.length === 0) return { nodes: [], links: [] };
	const maxColumn = graph.nodes.reduce(
		(max, n) => Math.max(max, n.column),
		graph.spalten.length - 1
	);
	const anchor = anchorChain(Math.max(maxColumn, 1));
	const nodes: SankeyInputNode[] = graph.nodes.map((n) => ({
		id: n.id,
		column: n.column,
		virtual: false,
		label: n.label,
		anzahl: n.anzahl,
		fixedValue: n.anzahl,
		original: { ...n }
	}));
	const links: SankeyInputLink[] = graph.links.map((l) => ({
		source: l.source,
		target: l.target,
		value: l.value,
		original: { ...l }
	}));
	return { nodes: [...nodes, ...anchor.nodes], links: [...links, ...anchor.links] };
}

export function sankeyNodeId(node: Pick<SankeyInputNode, 'id'>): string {
	return node.id;
}

export function sankeyNodeAlign(node: Pick<SankeyInputNode, 'column'>): number {
	return node.column;
}

/** Anzahl absteigend, dann alphabetisch (de): deterministische Reihenfolge. */
export function sankeyNodeSort(
	a: Pick<SankeyInputNode, 'anzahl' | 'label'>,
	b: Pick<SankeyInputNode, 'anzahl' | 'label'>
): number {
	return b.anzahl - a.anzahl || a.label.localeCompare(b.label, 'de');
}

export function sankeyLinkSort(
	a: Pick<SankeyInputLink, 'original'>,
	b: Pick<SankeyInputLink, 'original'>
): number {
	return (
		(a.original?.nach ?? '').localeCompare(b.original?.nach ?? '', 'de') ||
		(a.original?.von ?? '').localeCompare(b.original?.von ?? '', 'de')
	);
}

/** Layout-Knoten zurück in unsere Typen, Anker herausgefiltert. */
export function toPositionedNodes(nodes: readonly SankeyLaidOutNode[]): SankeyPositionedNode[] {
	const out: SankeyPositionedNode[] = [];
	for (const n of nodes) {
		if (n.virtual || !n.original) continue;
		out.push({ ...n.original, x0: n.x0 ?? 0, x1: n.x1 ?? 0, y0: n.y0 ?? 0, y1: n.y1 ?? 0 });
	}
	return out;
}

/** Layout-Links zurück in unsere Typen, Anker-Kanten herausgefiltert. */
export function toPositionedLinks(links: readonly SankeyLaidOutLink[]): SankeyPositionedLink[] {
	const out: SankeyPositionedLink[] = [];
	for (const l of links) {
		if (!l.original) continue;
		out.push({ ...l.original, width: l.width ?? 0 });
	}
	return out;
}

/** Kleinster Abstand zwischen benachbarten Spalten (px, linke Knotenkanten). */
export function minColumnGap(
	nodes: readonly Pick<SankeyPositionedNode, 'column' | 'x0'>[]
): number {
	const xByColumn = new Map<number, number>();
	for (const n of nodes) {
		if (!xByColumn.has(n.column)) xByColumn.set(n.column, n.x0);
	}
	const xs = [...xByColumn.values()].sort((a, b) => a - b);
	let gap = Infinity;
	for (let i = 1; i < xs.length; i++) gap = Math.min(gap, xs[i] - xs[i - 1]);
	return gap;
}

/** Erste Spalte: Label links vom Knoten (reservierter linker Rand), übrige rechts. */
export function nodeLabelAnchor(column: number): 'start' | 'end' {
	return column === 0 ? 'end' : 'start';
}

export function showNodeLabel(args: {
	readonly height: number;
	readonly column: number;
	readonly columnCount: number;
	readonly columnGap: number;
}): boolean {
	if (args.height < SANKEY_LABEL_MIN_HEIGHT) return false;
	const isEdgeColumn = args.column === 0 || args.column === args.columnCount - 1;
	return isEdgeColumn || args.columnGap >= MIN_COLUMN_GAP_FOR_INNER_LABELS;
}

/** Seitlicher Rand für die Partei-Labels der äußeren Spalten. */
export function sankeyLabelMargin(containerWidth: number): number {
	return containerWidth < MOBILE_BREAKPOINT ? MOBILE_LABEL_MARGIN : DESKTOP_LABEL_MARGIN;
}

/** Gesamthöhe des Diagramm-Containers inkl. Jahres-Beschriftung. */
export function sankeyChartHeight(containerWidth: number): number {
	return containerWidth < MOBILE_BREAKPOINT ? MOBILE_HEIGHT : DESKTOP_HEIGHT;
}
