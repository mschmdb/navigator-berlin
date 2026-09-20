import { describe, expect, it } from 'vitest';
import * as d3Sankey from 'd3-sankey';
import { SankeyD3Controller } from './sankey-d3.svelte.js';
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

describe('SankeyD3Controller', () => {
	it('leerer Graph: setzt sofort ein leeres Layout, ohne die Factory zu laden', async () => {
		let factoryCalls = 0;
		const controller = new SankeyD3Controller({
			d3SankeyFactory: async () => {
				factoryCalls++;
				return d3Sankey;
			}
		});
		await controller.compute(
			{ nodes: [], links: [], spalten: [], totalGebiete: 0, gebieteMitDatenByJahr: new Map() },
			DIMENSIONS
		);
		expect(controller.layout).toEqual({ nodes: [], links: [], width: 300, height: 200 });
		expect(factoryCalls).toBe(0);
	});

	it('lädt die injizierte Factory und setzt das berechnete Layout', async () => {
		const controller = new SankeyD3Controller({ d3SankeyFactory: async () => d3Sankey });
		const graph: SankeyGraph = {
			nodes: [node({}), node({ id: 'partei:2021:SPD', column: 1, jahr: 2021 })],
			links: [link({})],
			spalten: [{ jahr: 2016, istWiederholung: false }],
			totalGebiete: 1,
			gebieteMitDatenByJahr: new Map([[2016, 1]])
		};
		await controller.compute(graph, DIMENSIONS);
		expect(controller.layout?.nodes).toHaveLength(2);
		expect(controller.layout?.links).toHaveLength(1);
	});

	it('ein späterer compute()-Aufruf überschreibt einen noch laufenden älteren (Stale-Guard)', async () => {
		let resolveFactory: ((mod: typeof d3Sankey) => void) | undefined;
		const pendingFactory = new Promise<typeof d3Sankey>((resolve) => {
			resolveFactory = resolve;
		});
		const controller = new SankeyD3Controller({
			d3SankeyFactory: () => pendingFactory
		});
		const graphA: SankeyGraph = {
			nodes: [node({ id: 'partei:2016:SPD', anzahl: 1 })],
			links: [],
			spalten: [{ jahr: 2016, istWiederholung: false }],
			totalGebiete: 0,
			gebieteMitDatenByJahr: new Map([[2016, 1]])
		};
		const firstCall = controller.compute(graphA, DIMENSIONS);
		// Zweiter Aufruf mit leerem Graph läuft synchron durch (kein Factory-Await).
		await controller.compute(
			{ nodes: [], links: [], spalten: [], totalGebiete: 0, gebieteMitDatenByJahr: new Map() },
			DIMENSIONS
		);
		expect(controller.layout?.nodes).toEqual([]);
		resolveFactory?.(d3Sankey);
		await firstCall;
		// Der erste (ältere) Aufruf darf das leere Ergebnis des zweiten NICHT überschreiben.
		expect(controller.layout?.nodes).toEqual([]);
	});

	it('verschärfter Stale-Guard: beide Aufrufe nicht-leer, die Factory des ersten hängt, der zweite resolved zuerst', async () => {
		let resolveFirst: ((mod: typeof d3Sankey) => void) | undefined;
		const pendingFirst = new Promise<typeof d3Sankey>((resolve) => {
			resolveFirst = resolve;
		});
		let factoryCall = 0;
		const controller = new SankeyD3Controller({
			d3SankeyFactory: () => {
				factoryCall++;
				return factoryCall === 1 ? pendingFirst : Promise.resolve(d3Sankey);
			}
		});
		const graphA: SankeyGraph = {
			nodes: [node({ id: 'partei:2016:SPD' }), node({ id: 'partei:2021:SPD', column: 1, jahr: 2021 })],
			links: [link({})],
			spalten: [
				{ jahr: 2016, istWiederholung: false },
				{ jahr: 2021, istWiederholung: false }
			],
			totalGebiete: 1,
			gebieteMitDatenByJahr: new Map([[2016, 1]])
		};
		const graphB: SankeyGraph = {
			nodes: [
				node({ id: 'partei:2016:CDU', label: 'CDU', partei: 'CDU' }),
				node({ id: 'partei:2021:CDU', column: 1, jahr: 2021, label: 'CDU', partei: 'CDU' })
			],
			links: [link({ source: 'partei:2016:CDU', target: 'partei:2021:CDU', von: 'CDU', nach: 'CDU' })],
			spalten: graphA.spalten,
			totalGebiete: 1,
			gebieteMitDatenByJahr: new Map([[2016, 1]])
		};
		const firstCall = controller.compute(graphA, DIMENSIONS);
		await controller.compute(graphB, DIMENSIONS);
		expect(controller.layoutFor).toBe(graphB);
		expect(controller.layout?.nodes.some((n) => n.partei === 'CDU')).toBe(true);
		resolveFirst?.(d3Sankey);
		await firstCall;
		// Der ältere (erste) Aufruf darf graphB's Ergebnis NICHT überschreiben.
		expect(controller.layoutFor).toBe(graphB);
		expect(controller.layout?.nodes.every((n) => n.partei === 'CDU')).toBe(true);
	});
});

describe('SankeyD3Controller#layoutFor', () => {
	it('bindet das Layout an seinen Graph: leerer Pfad setzt layoutFor atomar mit layout', async () => {
		const controller = new SankeyD3Controller({ d3SankeyFactory: async () => d3Sankey });
		const emptyGraph: SankeyGraph = {
			nodes: [],
			links: [],
			spalten: [],
			totalGebiete: 0,
			gebieteMitDatenByJahr: new Map()
		};
		await controller.compute(emptyGraph, DIMENSIONS);
		expect(controller.layoutFor).toBe(emptyGraph);
	});

	it('zwei nicht-leere Graphen nacheinander: der zweite gewinnt, layoutFor zeigt nie auf den alten Graph', async () => {
		const controller = new SankeyD3Controller({ d3SankeyFactory: async () => d3Sankey });
		const graphA: SankeyGraph = {
			nodes: [node({ id: 'partei:2016:SPD' }), node({ id: 'partei:2021:SPD', column: 1, jahr: 2021 })],
			links: [link({})],
			spalten: [
				{ jahr: 2016, istWiederholung: false },
				{ jahr: 2021, istWiederholung: false }
			],
			totalGebiete: 1,
			gebieteMitDatenByJahr: new Map([[2016, 1]])
		};
		await controller.compute(graphA, DIMENSIONS);
		expect(controller.layoutFor).toBe(graphA);

		const graphB: SankeyGraph = {
			nodes: [
				node({ id: 'partei:2016:CDU', label: 'CDU', partei: 'CDU' }),
				node({ id: 'partei:2021:CDU', column: 1, jahr: 2021, label: 'CDU', partei: 'CDU' })
			],
			links: [link({ source: 'partei:2016:CDU', target: 'partei:2021:CDU', von: 'CDU', nach: 'CDU' })],
			spalten: graphA.spalten,
			totalGebiete: 1,
			gebieteMitDatenByJahr: new Map([[2016, 1]])
		};
		await controller.compute(graphB, DIMENSIONS);
		expect(controller.layoutFor).toBe(graphB);
		expect(controller.layoutFor).not.toBe(graphA);
	});
});

describe('SankeyD3Controller#error', () => {
	it('rejectende Factory: layout bleibt null, error wird true, kein Throw nach außen', async () => {
		const controller = new SankeyD3Controller({
			d3SankeyFactory: async () => {
				throw new Error('Chunk-404');
			}
		});
		const graph: SankeyGraph = {
			nodes: [node({})],
			links: [],
			spalten: [{ jahr: 2016, istWiederholung: false }],
			totalGebiete: 1,
			gebieteMitDatenByJahr: new Map([[2016, 1]])
		};
		await expect(controller.compute(graph, DIMENSIONS)).resolves.toBeUndefined();
		expect(controller.layout).toBeNull();
		expect(controller.error).toBe(true);
	});

	it('error wird bei jedem compute-Start zurückgesetzt', async () => {
		let shouldFail = true;
		const controller = new SankeyD3Controller({
			d3SankeyFactory: async () => {
				if (shouldFail) throw new Error('Chunk-404');
				return d3Sankey;
			}
		});
		const graph: SankeyGraph = {
			nodes: [node({})],
			links: [],
			spalten: [{ jahr: 2016, istWiederholung: false }],
			totalGebiete: 1,
			gebieteMitDatenByJahr: new Map([[2016, 1]])
		};
		await controller.compute(graph, DIMENSIONS);
		expect(controller.error).toBe(true);

		shouldFail = false;
		await controller.compute(
			{ nodes: [], links: [], spalten: [], totalGebiete: 0, gebieteMitDatenByJahr: new Map() },
			DIMENSIONS
		);
		expect(controller.error).toBe(false);
	});
});
