import { describe, expect, it } from 'vitest';
import { buildUebergangsGruppen } from './sankey-liste.js';
import type { SankeyGraph } from './sankey-graph.js';

const GRAPH: SankeyGraph = {
	nodes: [],
	links: [
		{
			source: 'partei:2016:SPD',
			target: 'partei:2021:SPD',
			value: 1,
			von: 'SPD',
			nach: 'SPD',
			jahr: 2021
		},
		{
			source: 'partei:2016:SPD',
			target: 'partei:2021:GRÜNE',
			value: 3,
			von: 'SPD',
			nach: 'GRÜNE',
			jahr: 2021
		},
		{
			source: 'partei:2021:GRÜNE',
			target: 'partei:2023:CDU',
			value: 2,
			von: 'GRÜNE',
			nach: 'CDU',
			jahr: 2023
		}
	],
	spalten: [
		{ jahr: 2016, istWiederholung: false },
		{ jahr: 2021, istWiederholung: false },
		{ jahr: 2023, istWiederholung: true }
	],
	totalGebiete: 4,
	gebieteMitDatenByJahr: new Map([
		[2016, 4],
		[2021, 4],
		[2023, 4]
	])
};

describe('buildUebergangsGruppen', () => {
	it('gruppiert je Spaltenpaar, in Reihenfolge der Spalten', () => {
		const gruppen = buildUebergangsGruppen(GRAPH);
		expect(gruppen.map((g) => [g.vonJahr, g.nachJahr])).toEqual([
			[2016, 2021],
			[2021, 2023]
		]);
	});

	it('sortiert Einträge nach Gebieten absteigend und berechnet den Anteil', () => {
		const [erste] = buildUebergangsGruppen(GRAPH);
		expect(erste.eintraege.map((e) => e.nach)).toEqual(['GRÜNE', 'SPD']);
		expect(erste.eintraege[0].anteil).toBeCloseTo(0.75, 5);
	});

	it('Schlüssel entspricht dem Band-Schlüssel der Grafik (source->target)', () => {
		const [erste] = buildUebergangsGruppen(GRAPH);
		expect(erste.eintraege[0].key).toBe('partei:2016:SPD->partei:2021:GRÜNE');
	});

	it('überspringt Spaltenpaare ohne Übergänge', () => {
		const gruppen = buildUebergangsGruppen({ ...GRAPH, links: [GRAPH.links[2]] });
		expect(gruppen).toHaveLength(1);
		expect(gruppen[0].nachJahr).toBe(2023);
	});

	it('Datenlücke: Übergang über eine übersprungene Spalte trägt sein echtes Ausgangsjahr', () => {
		const graph: SankeyGraph = {
			...GRAPH,
			nodes: [
				{
					id: 'partei:2011:SPD',
					column: 0,
					label: 'SPD',
					farbe: '#000',
					anzahl: 1,
					jahr: 2011,
					partei: 'SPD'
				},
				{
					id: 'partei:2023:CDU',
					column: 2,
					label: 'CDU',
					farbe: '#000',
					anzahl: 1,
					jahr: 2023,
					partei: 'CDU'
				}
			],
			links: [
				{
					source: 'partei:2011:SPD',
					target: 'partei:2023:CDU',
					value: 1,
					von: 'SPD',
					nach: 'CDU',
					jahr: 2023
				}
			],
			spalten: [
				{ jahr: 2011, istWiederholung: false },
				{ jahr: 2016, istWiederholung: false },
				{ jahr: 2023, istWiederholung: false }
			]
		};
		const gruppen = buildUebergangsGruppen(graph);
		expect(gruppen.map((g) => [g.vonJahr, g.nachJahr])).toEqual([[2011, 2023]]);
	});

	it('Anteil fällt auf die Gesamtzahl zurück, wenn das Jahr fehlt', () => {
		const gruppen = buildUebergangsGruppen({
			...GRAPH,
			gebieteMitDatenByJahr: new Map()
		});
		expect(gruppen[0].eintraege[0].anteil).toBeCloseTo(0.75, 5);
	});
});
