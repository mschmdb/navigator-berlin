import { describe, expect, it } from 'vitest';
import { buildSankeyGraph } from './sankey-graph.js';
import { computeUebergaengeFromRows } from './wechsel-data.js';
import type { WinnerApiRow } from './winner-map-data.js';

function row(overrides: Partial<WinnerApiRow>): WinnerApiRow {
	return {
		jahr: 2023,
		gebiet_slug: 'a',
		partei: 'SPD',
		farbe_hex: '#000000',
		anteil: 0.4,
		is_repeat_election: false,
		parent_slug: null,
		...overrides
	};
}

/** Prüft die Invarianten, die für jeden Graph-Aufruf gelten müssen (Story 11,
 * übernommen aus `sankey-layout.test.ts#assertInvarianten`). */
function assertInvarianten(
	graph: ReturnType<typeof buildSankeyGraph>,
	rows: readonly WinnerApiRow[]
): void {
	const gebieteProJahr = new Map<number, Set<string>>();
	for (const r of rows) {
		if (r.jahr === null) continue;
		const set = gebieteProJahr.get(r.jahr) ?? new Set<string>();
		set.add(r.gebiet_slug);
		gebieteProJahr.set(r.jahr, set);
	}
	for (const spalte of graph.spalten) {
		const summe = graph.nodes
			.filter((n) => n.jahr === spalte.jahr)
			.reduce((sum, n) => sum + n.anzahl, 0);
		expect(summe).toBe(gebieteProJahr.get(spalte.jahr)?.size ?? 0);
	}
	// Link-Anzahl-Invariante (Review Triage Log #11, aus sankey-layout.test.ts
	// übernommen): jeder Übergang, dessen BEIDE Jahre eine gültige Spalte
	// sind, landet als genau ein Link im Graph -- Übergänge auf ein Jahr ohne
	// Spalte (Silent-Link-Drop-Fall, siehe eigener Test unten) sind bewusst
	// ausgeklammert, sonst hielte die Invariante dort nicht.
	const spaltenJahre = new Set(graph.spalten.map((s) => s.jahr));
	const erwarteteLinks = computeUebergaengeFromRows(rows).filter(
		(u) => spaltenJahre.has(u.vonJahr) && spaltenJahre.has(u.nachJahr)
	);
	expect(graph.links.length).toBe(erwarteteLinks.length);
}

describe('buildSankeyGraph', () => {
	it('I/O-Matrix Sankey AGH Kiez: Partei-Spaltensummen entsprechen der Anzahl Gebiete mit Daten, 2021 fehlt als Spalte', () => {
		const rows: WinnerApiRow[] = [
			...['a', 'b', 'c'].map((slug) => row({ jahr: 2016, gebiet_slug: slug, partei: 'SPD' })),
			row({ jahr: 2016, gebiet_slug: 'd', partei: 'CDU' }),
			row({ jahr: 2016, gebiet_slug: 'e', partei: 'CDU' }),
			...['a', 'b', 'c'].map((slug) =>
				row({
					jahr: 2023,
					gebiet_slug: slug,
					partei: 'GRÜNE',
					is_repeat_election: true,
					parent_slug: '2021-agh-zweitstimme'
				})
			),
			...['d', 'e'].map((slug) =>
				row({
					jahr: 2023,
					gebiet_slug: slug,
					partei: 'CDU',
					is_repeat_election: true,
					parent_slug: '2021-agh-zweitstimme'
				})
			)
		];
		const graph = buildSankeyGraph(rows);

		expect(graph.spalten.map((s) => s.jahr)).toEqual([2016, 2023]);
		expect(graph.spalten[1].istWiederholung).toBe(true);
		expect(graph.totalGebiete).toBe(5);
		assertInvarianten(graph, rows);
	});

	it('Bündelung: ein Partei-Übergangs-Link pro Paar, nie pro Gebiet', () => {
		const rows: WinnerApiRow[] = [
			...['a', 'b', 'c'].map((slug) => row({ jahr: 2016, gebiet_slug: slug, partei: 'SPD' })),
			...['a', 'b', 'c'].map((slug) => row({ jahr: 2021, gebiet_slug: slug, partei: 'GRÜNE' })),
			row({ jahr: 2016, gebiet_slug: 'd', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'd', partei: 'SPD' })
		];
		const graph = buildSankeyGraph(rows);
		expect(graph.links).toHaveLength(2);
		expect(graph.links).toContainEqual(
			expect.objectContaining({ von: 'SPD', nach: 'GRÜNE', value: 3, jahr: 2021 })
		);
		expect(graph.links).toContainEqual(
			expect.objectContaining({ von: 'SPD', nach: 'SPD', value: 1, jahr: 2021 })
		);
		assertInvarianten(graph, rows);
	});

	it('Eltern-Jahr nie als eigene Spalte, kein Partei-Knoten für das ersetzte Jahr', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, partei: 'SPD' }),
			row({ jahr: 2021, partei: 'GRÜNE' }),
			row({
				jahr: 2023,
				partei: 'GRÜNE',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
		];
		const graph = buildSankeyGraph(rows);
		expect(graph.spalten.map((s) => s.jahr)).toEqual([2016, 2023]);
		expect(graph.nodes.some((n) => n.jahr === 2021)).toBe(false);
		assertInvarianten(graph, rows);
	});

	it('Gebiet startet in einer MITTLEREN Spalte: eigener Partei-Knoten ohne eingehenden Übergang', () => {
		// a = 2011 CDU -> 2016 SPD -> 2023 SPD; b = 2016 SPD -> 2023 GRÜNE (startet
		// erst 2016). Übernommen aus sankey-layout.test.ts (Review Triage Log #1).
		const rows: WinnerApiRow[] = [
			row({ jahr: 2011, gebiet_slug: 'a', partei: 'CDU' }),
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2023, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2016, gebiet_slug: 'b', partei: 'SPD' }),
			row({ jahr: 2023, gebiet_slug: 'b', partei: 'GRÜNE' })
		];
		const graph = buildSankeyGraph(rows);
		const spd2016 = graph.nodes.find((n) => n.jahr === 2016 && n.label === 'SPD');
		expect(spd2016?.anzahl).toBe(2);
		assertInvarianten(graph, rows);
	});

	it('Spalten sind 0-basiert indiziert', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2023, gebiet_slug: 'a', partei: 'GRÜNE' })
		];
		const graph = buildSankeyGraph(rows);
		expect(graph.nodes.find((n) => n.jahr === 2016)?.column).toBe(0);
		expect(graph.nodes.find((n) => n.jahr === 2023)?.column).toBe(1);
	});

	it('leere Eingabe: keine Knoten/Links, kein Crash (DB-los/leer)', () => {
		const graph = buildSankeyGraph([]);
		expect(graph.nodes).toEqual([]);
		expect(graph.links).toEqual([]);
		expect(graph.spalten).toEqual([]);
		expect(graph.totalGebiete).toBe(0);
	});

	it('gebieteMitDatenByJahr summiert dieselben Werte wie die Partei-Spaltensummen', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2016, gebiet_slug: 'b', partei: 'CDU' })
		];
		const graph = buildSankeyGraph(rows);
		expect(graph.gebieteMitDatenByJahr.get(2016)).toBe(2);
	});

	it('Invariante: spalten sind aufsteigend nach Jahr sortiert', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2023, gebiet_slug: 'a', partei: 'GRÜNE' }),
			row({ jahr: 2011, gebiet_slug: 'a', partei: 'CDU' }),
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' })
		];
		const graph = buildSankeyGraph(rows);
		const jahre = graph.spalten.map((s) => s.jahr);
		expect(jahre).toEqual([...jahre].sort((a, b) => a - b));
		expect(jahre).toEqual([2011, 2016, 2023]);
	});

	it('Coverage-Grenze: eine Spalte ohne ausgehende Übergänge bekommt trotzdem den vollen Knoten aus der Jahr×Partei-Zählung (übernommen aus sankey-layout.test.ts)', () => {
		// Gebiet 'b' beginnt erst 2021 (kein 2016->2021-Übergang), trägt am
		// letzten Jahr trotzdem eine eigene Partei-Zeile.
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'b', partei: 'CDU' })
		];
		const graph = buildSankeyGraph(rows);
		const spalte2021Nodes = graph.nodes.filter((n) => n.jahr === 2021);
		expect(spalte2021Nodes.map((n) => n.anzahl).sort()).toEqual([1, 1]);
		assertInvarianten(graph, rows);
	});

	it('Silent-Link-Drop bei Teil-Coverage x Wiederholungswahl: Gebiet ohne die Wiederholungs-Row verliert seinen Übergang still (Ist-Verhalten identisch Story 8, bewusst dokumentiert, NICHT gefixt -- siehe deferred-work.md Story 11)', () => {
		// Gebiet a hat die volle Reihe inkl. Wiederholungswahl 2023 (parent
		// 2021): 2021 wird global als ersetztes Eltern-Jahr aus den Spalten
		// entfernt (effectiveJahreFromRows zählt Eltern-Jahre GLOBAL über alle
		// Gebiete). Gebiet b hat nur 2016/2021 (keine Wiederholungs-Row) -- sein
		// Übergang 2016->2021 zeigt auf ein Jahr, das keine eigene Spalte mehr
		// hat, sein Ziel-Knoten wird nie gebaut, der Link wird beim Aufbau der
		// Links still verworfen (`nodeIds.has(target)` false).
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'a', partei: 'GRÜNE' }),
			row({
				jahr: 2023,
				gebiet_slug: 'a',
				partei: 'GRÜNE',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			}),
			row({ jahr: 2016, gebiet_slug: 'b', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'b', partei: 'CDU' })
		];
		const graph = buildSankeyGraph(rows);
		expect(graph.spalten.map((s) => s.jahr)).toEqual([2016, 2023]);
		// Gebiets b's Übergang 2016(SPD)->2021(CDU) landet in keinem Link, weil
		// 2021 keine Spalte mehr ist -- nur a's 2016->2023-Übergang bleibt.
		expect(graph.links).toHaveLength(1);
		expect(graph.links[0]).toMatchObject({ von: 'SPD', nach: 'GRÜNE', jahr: 2023 });
		expect(graph.links.some((l) => l.nach === 'CDU')).toBe(false);
	});
});
