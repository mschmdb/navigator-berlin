import { describe, expect, it } from 'vitest';
import * as d3Sankey from 'd3-sankey';
import { computeSankeyDimensions, computeSankeyLayoutWithModule } from './sankey-d3-layout.js';
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

const DIMENSIONS = { width: 300, height: 200, nodeWidth: 16, nodePadding: 4 };

describe('computeSankeyLayoutWithModule', () => {
	it('positioniert Spalte 0 links von Spalte 1', () => {
		const graph: SankeyGraph = {
			nodes: [
				node({ id: 'partei:2016:SPD', column: 0 }),
				node({ id: 'partei:2021:SPD', column: 1, jahr: 2021 })
			],
			links: [link({})],
			spalten: [
				{ jahr: 2016, istWiederholung: false },
				{ jahr: 2021, istWiederholung: false }
			],
			totalGebiete: 1,
			gebieteMitDatenByJahr: new Map([
				[2016, 1],
				[2021, 1]
			])
		};
		const layout = computeSankeyLayoutWithModule(d3Sankey, graph, DIMENSIONS);
		const n2016 = layout.nodes.find((n) => n.id === 'partei:2016:SPD');
		const n2021 = layout.nodes.find((n) => n.id === 'partei:2021:SPD');
		expect(n2016).toBeDefined();
		expect(n2021).toBeDefined();
		expect(n2016!.x0).toBeLessThan(n2021!.x0);
		expect(layout.links).toHaveLength(1);
		expect(layout.links[0].path).toMatch(/^M/);
		// Keine Anker-Knoten im Ergebnis (nur die zwei realen Knoten).
		expect(layout.nodes).toHaveLength(2);
	});

	it('Mittelspalten-Regression: ein Partei-Knoten OHNE eingehende Übergangs-Kante landet trotzdem in seiner echten Spalte', () => {
		// a: 2016 SPD -> 2021 SPD (Übergang SPD->SPD). b: startet ERST 2021 mit
		// CDU, hat also am Knoten 2021/CDU KEINE eingehende Kante. Ohne die
		// Anker-Rückgrat-Korrektur würde d3-sankeys BFS-Tiefe diesen Knoten in
		// Spalte 0 statt 1 einordnen (siehe Kommentar in sankey-d3-layout.ts).
		const graph: SankeyGraph = {
			nodes: [
				node({ id: 'partei:2016:SPD', column: 0, jahr: 2016 }),
				node({ id: 'partei:2021:SPD', column: 1, jahr: 2021 }),
				node({ id: 'partei:2021:CDU', column: 1, jahr: 2021, label: 'CDU', partei: 'CDU' })
			],
			links: [
				link({
					source: 'partei:2016:SPD',
					target: 'partei:2021:SPD',
					von: 'SPD',
					nach: 'SPD',
					jahr: 2021
				})
			],
			spalten: [
				{ jahr: 2016, istWiederholung: false },
				{ jahr: 2021, istWiederholung: false }
			],
			totalGebiete: 2,
			gebieteMitDatenByJahr: new Map([
				[2016, 1],
				[2021, 2]
			])
		};
		const layout = computeSankeyLayoutWithModule(d3Sankey, graph, DIMENSIONS);
		const spd2021 = layout.nodes.find((n) => n.id === 'partei:2021:SPD')!;
		const cdu2021 = layout.nodes.find((n) => n.id === 'partei:2021:CDU')!;
		const spd2016 = layout.nodes.find((n) => n.id === 'partei:2016:SPD')!;
		expect(cdu2021.x0).toBeCloseTo(spd2021.x0, 5);
		expect(cdu2021.x0).toBeGreaterThan(spd2016.x0);
	});

	it('deterministische Knoten-Sortierung: Anzahl absteigend, dann alphabetisch (de)', () => {
		const graph: SankeyGraph = {
			nodes: [
				node({ id: 'partei:2016:Zebra', column: 0, label: 'Zebra', partei: 'Zebra', anzahl: 2 }),
				node({ id: 'partei:2016:Apfel', column: 0, label: 'Apfel', partei: 'Apfel', anzahl: 2 }),
				node({ id: 'partei:2016:SPD', column: 0, label: 'SPD', partei: 'SPD', anzahl: 5 })
			],
			links: [],
			spalten: [{ jahr: 2016, istWiederholung: false }],
			totalGebiete: 0,
			gebieteMitDatenByJahr: new Map([[2016, 9]])
		};
		const layout = computeSankeyLayoutWithModule(d3Sankey, graph, DIMENSIONS);
		const sorted = [...layout.nodes].sort((a, b) => a.y0 - b.y0);
		expect(sorted.map((n) => n.label)).toEqual(['SPD', 'Apfel', 'Zebra']);
	});

	it('leerer Graph: keine Knoten/Links, kein Crash', () => {
		const graph: SankeyGraph = {
			nodes: [],
			links: [],
			spalten: [],
			totalGebiete: 0,
			gebieteMitDatenByJahr: new Map()
		};
		const layout = computeSankeyLayoutWithModule(d3Sankey, graph, DIMENSIONS);
		expect(layout.nodes).toEqual([]);
		expect(layout.links).toEqual([]);
	});

	it('Band-Breiten-Verhältnis: zwei Links mit Anzahl 3:1 ergeben Bandbreiten im selben Verhältnis, beide > 0', () => {
		const graph: SankeyGraph = {
			nodes: [
				node({ id: 'partei:2016:SPD', column: 0, anzahl: 4 }),
				node({ id: 'partei:2021:GRÜNE', column: 1, jahr: 2021, label: 'GRÜNE', partei: 'GRÜNE', anzahl: 3 }),
				node({ id: 'partei:2021:SPD', column: 1, jahr: 2021, anzahl: 1 })
			],
			links: [
				link({
					source: 'partei:2016:SPD',
					target: 'partei:2021:GRÜNE',
					von: 'SPD',
					nach: 'GRÜNE',
					value: 3
				}),
				link({ source: 'partei:2016:SPD', target: 'partei:2021:SPD', von: 'SPD', nach: 'SPD', value: 1 })
			],
			spalten: [
				{ jahr: 2016, istWiederholung: false },
				{ jahr: 2021, istWiederholung: false }
			],
			totalGebiete: 4,
			gebieteMitDatenByJahr: new Map([
				[2016, 4],
				[2021, 4]
			])
		};
		const layout = computeSankeyLayoutWithModule(d3Sankey, graph, DIMENSIONS);
		const grueneLink = layout.links.find((l) => l.nach === 'GRÜNE')!;
		const spdLink = layout.links.find((l) => l.nach === 'SPD')!;
		expect(grueneLink.width).toBeGreaterThan(0);
		expect(spdLink.width).toBeGreaterThan(0);
		expect(grueneLink.width / spdLink.width).toBeCloseTo(3, 1);
	});

	it('Ein-Spalten-Graph: liefert endliche Koordinaten statt NaN (kx=(w-dx)/(x-1) bei x=1)', () => {
		const graph: SankeyGraph = {
			nodes: [
				node({ id: 'partei:2016:SPD', column: 0, anzahl: 2 }),
				node({ id: 'partei:2016:CDU', column: 0, label: 'CDU', partei: 'CDU', anzahl: 1 })
			],
			links: [],
			spalten: [{ jahr: 2016, istWiederholung: false }],
			totalGebiete: 3,
			gebieteMitDatenByJahr: new Map([[2016, 3]])
		};
		const layout = computeSankeyLayoutWithModule(d3Sankey, graph, DIMENSIONS);
		expect(layout.nodes).toHaveLength(2);
		for (const n of layout.nodes) {
			expect(Number.isFinite(n.x0)).toBe(true);
			expect(Number.isFinite(n.x1)).toBe(true);
			expect(Number.isFinite(n.y0)).toBe(true);
			expect(Number.isFinite(n.y1)).toBe(true);
		}
	});

	it('Knoten mit column > spalten.length-1 wird nicht auf die letzte Spalte geclampt (Anker-Spannweite deckt ihn ab)', () => {
		const graph: SankeyGraph = {
			nodes: [
				node({ id: 'partei:2016:SPD', column: 0 }),
				// column 2 obwohl spalten nur 2 Einträge hat (Index 0/1) -- ein
				// Aufrufer-Fehler oder eine Übergangsphase; die Anker-Spannweite
				// muss trotzdem über `max(column)` absichern, kein Clamping mehr
				// möglich (Review Triage Log #12).
				node({ id: 'partei:weit:X', column: 2, jahr: 2099, label: 'X', partei: 'X' })
			],
			links: [],
			spalten: [
				{ jahr: 2016, istWiederholung: false },
				{ jahr: 2021, istWiederholung: false }
			],
			totalGebiete: 0,
			gebieteMitDatenByJahr: new Map()
		};
		const layout = computeSankeyLayoutWithModule(d3Sankey, graph, DIMENSIONS);
		const spd = layout.nodes.find((n) => n.id === 'partei:2016:SPD')!;
		const weit = layout.nodes.find((n) => n.id === 'partei:weit:X')!;
		expect(Number.isFinite(weit.x0)).toBe(true);
		expect(weit.x0).toBeGreaterThan(spd.x0);
	});
});

describe('computeSankeyDimensions', () => {
	it('Höhe ist fest/kompakt, unabhängig von der Spaltenzahl', () => {
		expect(computeSankeyDimensions(1).height).toBe(360);
		expect(computeSankeyDimensions(7).height).toBe(360);
	});

	it('Breite wächst mit der Spaltenzahl, nie unter der Mindestbreite', () => {
		const wenige = computeSankeyDimensions(3);
		const viele = computeSankeyDimensions(7);
		expect(viele.width).toBeGreaterThan(wenige.width);
		expect(computeSankeyDimensions(1).width).toBeGreaterThanOrEqual(640);
	});
});
