/**
 * Story 11 (Sankey-Rework): reines Layout-Modul für `d3-sankey` -- Typen,
 * Höhen-/Breiten-Formel und die eigentliche Layout-Berechnung. Bewusst ein
 * plain `.ts`-Modul statt `.svelte.ts` (Muster `wechsel-map-data.ts#buildNameBySlugMap`:
 * `svelte/prefer-svelte-reactivity` gilt nur für reaktiven Komponenten-State,
 * nicht für diese rein abgeleiteten `Map`-Lookups) -- der reaktive Controller
 * (`sankey-d3.svelte.ts#SankeyD3Controller`) importiert nur `computeSankeyLayoutWithModule`.
 *
 * d3-sankeys eingebaute Spalten-Erkennung (`nodeAlign`) beruht auf der
 * längsten Kanten-Kette ab kantenlosen Wurzeln (BFS-Tiefe, siehe
 * `computeNodeDepths` in node_modules/d3-sankey/src/sankey.js). Das reicht
 * NICHT für unser Modell: ein Gebiet kann seine erste effektive Wahl der
 * Reihe erst in einer MITTLEREN Spalte haben (Coverage-Grenze,
 * `sankey-graph.ts`-Test „Mittelspalten-Start"). Der Partei-Knoten dieser
 * Spalte hat dann u. U. GAR KEINE eingehende Partei-Übergangs-Kante (Tiefe
 * 0) -- die BFS-Tiefe würde ihn fälschlich in Spalte 0 statt in seine echte
 * Spalte einordnen.
 *
 * `computeNodeLayers` (dieselbe Quelldatei) platziert jeden Knoten aber über
 * `nodeAlign(node, x)`, wobei `x = max(node.depth) + 1` NUR die
 * Gesamt-Spaltenzahl liefert -- die eigentliche Platzierung übernimmt unser
 * `nodeAlign`, das ausschließlich das vorab bekannte `column`-Feld
 * zurückgibt. Es reicht also, `x` groß genug zu machen: ein unsichtbares
 * Null-Wert-Rückgrat (`__anchor__:0..C`, ein Knoten je Spalte, linear
 * verkettet) zwingt die BFS-Tiefe auf mindestens `C` -- die Anker-Knoten
 * werden vor der Rückgabe herausgefiltert.
 */
import type { SankeyGraph, SankeyGraphLink, SankeyGraphNode } from './sankey-graph.js';

export interface SankeyPositionedNode extends SankeyGraphNode {
	readonly x0: number;
	readonly x1: number;
	readonly y0: number;
	readonly y1: number;
}

export interface SankeyPositionedLink extends SankeyGraphLink {
	readonly width: number;
	readonly path: string;
}

export interface SankeyLayoutResult {
	readonly nodes: readonly SankeyPositionedNode[];
	readonly links: readonly SankeyPositionedLink[];
	readonly width: number;
	readonly height: number;
}

export interface SankeyDimensions {
	readonly width: number;
	readonly height: number;
	readonly nodeWidth: number;
	readonly nodePadding: number;
}

export type D3SankeyModule = typeof import('d3-sankey');

const HEIGHT = 360;
const MIN_WIDTH = 640;
const PX_PER_SPALTE = 130;
const NODE_WIDTH = 16;
const NODE_PADDING = 4;

/**
 * Höhen-/Breiten-Formel (REVISION 12:07: keine Gebiets-Spalte mehr, also
 * keine gebiets-abhängige Höhe): SVG-Höhe bleibt kompakt fest. Breite wächst
 * mit der Spaltenzahl (eine je Wahl der Reihe), nie unter der Mindestbreite.
 */
export function computeSankeyDimensions(columnCount = 1): SankeyDimensions {
	const width = Math.max(MIN_WIDTH, columnCount * PX_PER_SPALTE);
	return { width, height: HEIGHT, nodeWidth: NODE_WIDTH, nodePadding: NODE_PADDING };
}

interface D3Node {
	readonly id: string;
	readonly column: number;
	readonly virtual: boolean;
	readonly label: string;
	readonly anzahl: number;
	/** Erzwingt `node.value` = `anzahl` (d3-sankey `fixedValue`), statt es aus
	 * der Summe der Kanten herzuleiten -- unsere Knoten-Anzahl ist bereits die
	 * Quelle der Wahrheit (`parteiAnzahlProJahrFromRows`), unabhängig davon,
	 * ob jede Kante exakt aufsummiert (robuster als der implizite Kanten-Fit). */
	readonly fixedValue: number;
	readonly original: SankeyGraphNode | null;
}

interface D3Link {
	readonly source: string;
	readonly target: string;
	readonly value: number;
	readonly original: SankeyGraphLink | null;
}

const ANCHOR_PREFIX = '__anchor__:';

/** Unsichtbares Null-Wert-Rückgrat über alle `columnCount` Partei-Spalten
 * (siehe Datei-Kommentar) -- erzwingt eine ausreichend große von d3-sankey
 * berechnete Gesamt-Spaltenzahl, ohne echte Knoten/Kanten zu berühren. */
function buildAnchorChain(columnCount: number): { nodes: D3Node[]; links: D3Link[] } {
	const nodes: D3Node[] = [];
	const links: D3Link[] = [];
	for (let c = 0; c <= columnCount; c++) {
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

/** Reines Layout ohne Lazy-Import -- Test-Naht: das injizierte `d3-sankey`-Modul
 * kommt vom Aufrufer (`SankeyD3Controller` im Produktivpfad, direkter
 * `import * as d3Sankey from 'd3-sankey'` im Test). */
export function computeSankeyLayoutWithModule(
	mod: D3SankeyModule,
	graph: SankeyGraph,
	dimensions: SankeyDimensions
): SankeyLayoutResult {
	if (graph.nodes.length === 0) {
		return { nodes: [], links: [], width: dimensions.width, height: dimensions.height };
	}

	// Partei-Spalten sind 0-basiert (0..spalten.length-1) -- das Rückgrat muss
	// exakt diese Spannweite abdecken (`buildAnchorChain` erzeugt Anker für
	// Spalte 0..columnCount inklusive). Die Spannweite sichert zusätzlich über
	// `max(column)` ab: ein Knoten mit `column` außerhalb `0..spalten.length-1`
	// bekommt trotzdem einen ausreichend langen Anker (kein Clamping mehr
	// nötig, `nodeAlign` gibt ausschließlich das vorab bekannte Feld zurück).
	// Mindestens Spannweite 1 (zwei Anker-Knoten, eine Ketten-Kante): bei nur
	// einer Spalte wäre die von d3 intern berechnete Gesamt-Spaltenzahl `x`
	// sonst 1, `computeNodeLayers`s `kx = (w - dx) / (x - 1)` dividiert dann
	// durch 0 -- die Anker-Kette erzwingt `x >= 2` (Review Triage Log #12,
	// heute durch den `isEmpty`-Gate der Komponente verdeckt, aber die
	// Funktion ist exportiert und `?? 0` fängt NaN nicht ab).
	const maxColumn = graph.nodes.reduce(
		(max, n) => Math.max(max, n.column),
		graph.spalten.length - 1
	);
	const anchor = buildAnchorChain(Math.max(maxColumn, 1));
	const realNodes: D3Node[] = graph.nodes.map((n) => ({
		id: n.id,
		column: n.column,
		virtual: false,
		label: n.label,
		anzahl: n.anzahl,
		fixedValue: n.anzahl,
		original: n
	}));
	const realLinks: D3Link[] = graph.links.map((l) => ({
		source: l.source,
		target: l.target,
		value: l.value,
		original: l
	}));

	const generator = mod
		.sankey<D3Node, D3Link>()
		.nodeId((d) => d.id)
		.nodeWidth(dimensions.nodeWidth)
		.nodePadding(dimensions.nodePadding)
		.nodeAlign((d) => d.column)
		.nodeSort((a, b) => b.anzahl - a.anzahl || a.label.localeCompare(b.label, 'de'))
		.linkSort(
			(a, b) =>
				(a.original?.nach ?? '').localeCompare(b.original?.nach ?? '', 'de') ||
				(a.original?.von ?? '').localeCompare(b.original?.von ?? '', 'de')
		)
		.extent([
			[0, 0],
			[dimensions.width, dimensions.height]
		]);

	const { nodes: outNodes, links: outLinks } = generator({
		nodes: [...realNodes, ...anchor.nodes],
		links: [...realLinks, ...anchor.links]
	});

	const pathGenerator = mod.sankeyLinkHorizontal<D3Node, D3Link>();

	const positionedById = new Map<string, SankeyPositionedNode>();
	for (const n of outNodes) {
		if (n.virtual || !n.original) continue;
		positionedById.set(n.id, {
			...n.original,
			x0: n.x0 ?? 0,
			x1: n.x1 ?? 0,
			y0: n.y0 ?? 0,
			y1: n.y1 ?? 0
		});
	}

	const links: SankeyPositionedLink[] = [];
	for (const l of outLinks) {
		if (!l.original) continue;
		links.push({ ...l.original, width: l.width ?? 0, path: pathGenerator(l) ?? '' });
	}

	return {
		nodes: Array.from(positionedById.values()),
		links,
		width: dimensions.width,
		height: dimensions.height
	};
}
