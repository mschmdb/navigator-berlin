import { describe, expect, it } from 'vitest';
import * as d3Sankey from 'd3-sankey';
import {
	SANKEY_NODE_PADDING,
	SANKEY_NODE_WIDTH,
	buildSankeyInput,
	minColumnGap,
	nodeLabelAnchor,
	sankeyChartHeight,
	sankeyLabelMargin,
	sankeyLinkSort,
	sankeyNodeAlign,
	sankeyNodeId,
	sankeyNodeSort,
	showNodeLabel,
	toPositionedLinks,
	toPositionedNodes,
	type SankeyInputLink,
	type SankeyInputNode
} from './sankey-layout.js';
import type { SankeyGraph, SankeyGraphNode, SankeyGraphLink } from './sankey-graph.js';

function node(overrides: Partial<SankeyGraphNode>): SankeyGraphNode {
	return {
		id: 'partei:2016:SPD',
		column: 0,
		label: 'SPD',
		farbe: '#A50C1A',
		anzahl: 1,
		jahr: 2016,
		partei: 'SPD',
		...overrides
	};
}

function link(overrides: Partial<SankeyGraphLink>): SankeyGraphLink {
	return {
		source: 'partei:2016:SPD',
		target: 'partei:2021:SPD',
		value: 1,
		von: 'SPD',
		nach: 'SPD',
		jahr: 2021,
		...overrides
	};
}

/**
 * Spiegelt exakt die Konfiguration, die LayerCharts `<Sankey>` an d3-sankey
 * weiterreicht (`size`, `nodes`/`links`-Accessor, `structuredClone` der
 * Daten), damit die Layout-Garantien unserer Datenaufbereitung gegen den
 * echten Algorithmus geprüft werden.
 */
function layoutWithD3(graph: SankeyGraph, width = 300, height = 200) {
	const generator = d3Sankey
		.sankey<SankeyInputNode, SankeyInputLink>()
		.size([width, height])
		.nodeId(sankeyNodeId)
		.nodeAlign(sankeyNodeAlign)
		.nodeWidth(SANKEY_NODE_WIDTH)
		.nodePadding(SANKEY_NODE_PADDING)
		.nodeSort(sankeyNodeSort)
		.linkSort(sankeyLinkSort);
	const out = generator(structuredClone(buildSankeyInput(graph)));
	return { nodes: toPositionedNodes(out.nodes), links: toPositionedLinks(out.links) };
}

function zweiSpalten(nodes: SankeyGraphNode[], links: SankeyGraphLink[], total = 1): SankeyGraph {
	return {
		nodes,
		links,
		spalten: [
			{ jahr: 2016, istWiederholung: false },
			{ jahr: 2021, istWiederholung: false }
		],
		totalGebiete: total,
		gebieteMitDatenByJahr: new Map([
			[2016, total],
			[2021, total]
		])
	};
}

describe('buildSankeyInput', () => {
	it('legt ein unsichtbares Anker-Rückgrat über alle Spalten an und markiert es als virtuell', () => {
		const input = buildSankeyInput(
			zweiSpalten(
				[
					node({ id: 'partei:2016:SPD', column: 0 }),
					node({ id: 'partei:2021:SPD', column: 1, jahr: 2021 })
				],
				[link({})]
			)
		);
		const anchors = input.nodes.filter((n) => n.virtual);
		expect(anchors.map((n) => n.column)).toEqual([0, 1]);
		expect(input.links.filter((l) => l.original === null)).toHaveLength(1);
		const real = input.nodes.filter((n) => !n.virtual);
		expect(real).toHaveLength(2);
		expect(real[0].fixedValue).toBe(real[0].anzahl);
	});

	it('Ein-Spalten-Graph bekommt trotzdem zwei Anker (Spannweite mindestens 1)', () => {
		const input = buildSankeyInput({
			nodes: [node({ id: 'partei:2016:SPD', column: 0 })],
			links: [],
			spalten: [{ jahr: 2016, istWiederholung: false }],
			totalGebiete: 1,
			gebieteMitDatenByJahr: new Map([[2016, 1]])
		});
		expect(input.nodes.filter((n) => n.virtual)).toHaveLength(2);
	});

	it('ist strukturiert klonbar (LayerChart ruft structuredClone auf die Daten)', () => {
		const input = buildSankeyInput(zweiSpalten([node({ id: 'partei:2016:SPD' })], [], 1));
		expect(() => structuredClone(input)).not.toThrow();
	});

	it('leerer Graph: keine Knoten, keine Links', () => {
		const input = buildSankeyInput({
			nodes: [],
			links: [],
			spalten: [],
			totalGebiete: 0,
			gebieteMitDatenByJahr: new Map()
		});
		expect(input.nodes).toEqual([]);
		expect(input.links).toEqual([]);
	});
});

describe('Layout gegen echtes d3-sankey (LayerChart-Konfiguration)', () => {
	it('positioniert Spalte 0 links von Spalte 1 und filtert die Anker heraus', () => {
		const layout = layoutWithD3(
			zweiSpalten(
				[
					node({ id: 'partei:2016:SPD', column: 0 }),
					node({ id: 'partei:2021:SPD', column: 1, jahr: 2021 })
				],
				[link({})]
			)
		);
		const n2016 = layout.nodes.find((n) => n.id === 'partei:2016:SPD')!;
		const n2021 = layout.nodes.find((n) => n.id === 'partei:2021:SPD')!;
		expect(n2016.x0).toBeLessThan(n2021.x0);
		expect(layout.nodes).toHaveLength(2);
		expect(layout.links).toHaveLength(1);
		expect(layout.links[0].width).toBeGreaterThan(0);
	});

	it('Mittelspalten-Regression: ein Partei-Knoten OHNE eingehende Kante landet in seiner echten Spalte', () => {
		const layout = layoutWithD3(
			zweiSpalten(
				[
					node({ id: 'partei:2016:SPD', column: 0, jahr: 2016 }),
					node({ id: 'partei:2021:SPD', column: 1, jahr: 2021 }),
					node({ id: 'partei:2021:CDU', column: 1, jahr: 2021, label: 'CDU', partei: 'CDU' })
				],
				[link({})],
				2
			)
		);
		const spd2021 = layout.nodes.find((n) => n.id === 'partei:2021:SPD')!;
		const cdu2021 = layout.nodes.find((n) => n.id === 'partei:2021:CDU')!;
		const spd2016 = layout.nodes.find((n) => n.id === 'partei:2016:SPD')!;
		expect(cdu2021.x0).toBeCloseTo(spd2021.x0, 5);
		expect(cdu2021.x0).toBeGreaterThan(spd2016.x0);
	});

	it('deterministische Knoten-Sortierung: Anzahl absteigend, dann alphabetisch (de)', () => {
		const layout = layoutWithD3({
			nodes: [
				node({ id: 'partei:2016:Zebra', label: 'Zebra', partei: 'Zebra', anzahl: 2 }),
				node({ id: 'partei:2016:Apfel', label: 'Apfel', partei: 'Apfel', anzahl: 2 }),
				node({ id: 'partei:2016:SPD', label: 'SPD', partei: 'SPD', anzahl: 5 })
			],
			links: [],
			spalten: [{ jahr: 2016, istWiederholung: false }],
			totalGebiete: 0,
			gebieteMitDatenByJahr: new Map([[2016, 9]])
		});
		const sorted = [...layout.nodes].sort((a, b) => a.y0 - b.y0);
		expect(sorted.map((n) => n.label)).toEqual(['SPD', 'Apfel', 'Zebra']);
	});

	it('Band-Breiten-Verhältnis 3:1 bleibt erhalten', () => {
		const layout = layoutWithD3(
			zweiSpalten(
				[
					node({ id: 'partei:2016:SPD', anzahl: 4 }),
					node({
						id: 'partei:2021:GRÜNE',
						column: 1,
						jahr: 2021,
						label: 'GRÜNE',
						partei: 'GRÜNE',
						anzahl: 3
					}),
					node({ id: 'partei:2021:SPD', column: 1, jahr: 2021, anzahl: 1 })
				],
				[
					link({ target: 'partei:2021:GRÜNE', nach: 'GRÜNE', value: 3 }),
					link({ target: 'partei:2021:SPD', nach: 'SPD', value: 1 })
				],
				4
			)
		);
		const gruene = layout.links.find((l) => l.nach === 'GRÜNE')!;
		const spd = layout.links.find((l) => l.nach === 'SPD')!;
		expect(gruene.width / spd.width).toBeCloseTo(3, 1);
	});

	it('Ein-Spalten-Graph: endliche Koordinaten statt NaN', () => {
		const layout = layoutWithD3({
			nodes: [
				node({ id: 'partei:2016:SPD', anzahl: 2 }),
				node({ id: 'partei:2016:CDU', label: 'CDU', partei: 'CDU', anzahl: 1 })
			],
			links: [],
			spalten: [{ jahr: 2016, istWiederholung: false }],
			totalGebiete: 3,
			gebieteMitDatenByJahr: new Map([[2016, 3]])
		});
		expect(layout.nodes).toHaveLength(2);
		for (const n of layout.nodes) {
			expect([n.x0, n.x1, n.y0, n.y1].every(Number.isFinite)).toBe(true);
		}
	});

	it('Layout skaliert mit der echten Breite: doppelte Breite, doppelter Spaltenabstand', () => {
		const graph = zweiSpalten(
			[
				node({ id: 'partei:2016:SPD', column: 0 }),
				node({ id: 'partei:2021:SPD', column: 1, jahr: 2021 })
			],
			[link({})]
		);
		const schmal = layoutWithD3(graph, 200, 200);
		const breit = layoutWithD3(graph, 400, 200);
		const abstand = (l: typeof schmal) =>
			l.nodes.find((n) => n.column === 1)!.x0 - l.nodes.find((n) => n.column === 0)!.x0;
		expect(abstand(breit)).toBeGreaterThan(abstand(schmal) * 1.9);
	});
});

describe('Beschriftung und Maße', () => {
	it('erste Spalte links verankert, übrige rechts', () => {
		expect(nodeLabelAnchor(0)).toBe('end');
		expect(nodeLabelAnchor(1)).toBe('start');
		expect(nodeLabelAnchor(3)).toBe('start');
	});

	it('Label nur ab Mindesthöhe; Mittelspalten nur bei genug Spaltenabstand', () => {
		const base = { column: 0, columnCount: 3, columnGap: 200 };
		expect(showNodeLabel({ ...base, height: 4 })).toBe(false);
		expect(showNodeLabel({ ...base, height: 12 })).toBe(true);
		// Mittelspalte, enger Abstand: Label würde in die Bänder ragen.
		expect(showNodeLabel({ column: 1, columnCount: 3, columnGap: 60, height: 20 })).toBe(false);
		expect(showNodeLabel({ column: 1, columnCount: 3, columnGap: 160, height: 20 })).toBe(true);
		// Rand-Spalten haben eigenen Rand, unabhängig vom Abstand.
		expect(showNodeLabel({ column: 2, columnCount: 3, columnGap: 60, height: 20 })).toBe(true);
	});

	it('kleinster Spaltenabstand aus den positionierten Knoten', () => {
		const nodes = [
			{ column: 0, x0: 0 },
			{ column: 0, x0: 0 },
			{ column: 1, x0: 100 },
			{ column: 2, x0: 180 }
		];
		expect(minColumnGap(nodes)).toBe(80);
		expect(minColumnGap([{ column: 0, x0: 0 }])).toBe(Infinity);
	});

	it('Label-Rand schrumpft auf schmalen Containern, bleibt aber lesbar', () => {
		expect(sankeyLabelMargin(1200)).toBe(90);
		expect(sankeyLabelMargin(360)).toBeLessThan(90);
		expect(sankeyLabelMargin(360)).toBeGreaterThanOrEqual(56);
	});

	it('Diagramm-Höhe: fest auf Desktop, kompakter auf Mobil', () => {
		expect(sankeyChartHeight(1200)).toBe(384);
		expect(sankeyChartHeight(360)).toBeLessThan(384);
		expect(sankeyChartHeight(360)).toBeGreaterThanOrEqual(280);
	});
});
