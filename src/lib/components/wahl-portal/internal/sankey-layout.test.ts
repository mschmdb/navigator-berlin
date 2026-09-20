import { describe, expect, it } from 'vitest';
import { computeSankeyLayout } from './sankey-layout.js';
import {
	computeUebergaengeFromRows,
	effectiveJahreFromRows,
	parteiAnzahlProJahrFromRows,
	type SankeySpalte,
	type Uebergang
} from './wechsel-data.js';
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

/** Prüft die Spaltensummen-/Höhen-Invarianten, die für jeden Layout-Aufruf
 * gelten müssen (Review Triage Log #1). */
function assertInvarianten(
	layout: ReturnType<typeof computeSankeyLayout>,
	rows: readonly WinnerApiRow[],
	uebergaenge: readonly Uebergang[]
): void {
	const gebieteProJahr = new Map<number, Set<string>>();
	for (const r of rows) {
		if (r.jahr === null) continue;
		const set = gebieteProJahr.get(r.jahr) ?? new Set<string>();
		set.add(r.gebiet_slug);
		gebieteProJahr.set(r.jahr, set);
	}
	for (const column of layout.columns) {
		const summe = column.nodes.reduce((sum, n) => sum + n.anzahl, 0);
		expect(summe).toBe(gebieteProJahr.get(column.jahr)?.size ?? 0);
	}
	expect(layout.bands.length).toBe(uebergaenge.length);
	for (const band of layout.bands) {
		expect(band.sourceY + band.sourceHeight).toBeLessThanOrEqual(layout.height + 0.001);
		expect(band.targetY + band.targetHeight).toBeLessThanOrEqual(layout.height + 0.001);
	}
}

describe('computeSankeyLayout', () => {
	it('I/O-Matrix Sankey AGH Kiez: Spaltensummen entsprechen der Anzahl Gebiete mit Daten, 2021 fehlt als Spalte', () => {
		const spalten: SankeySpalte[] = [
			{ jahr: 2016, istWiederholung: false },
			{ jahr: 2023, istWiederholung: true }
		];
		const uebergaenge: Uebergang[] = [
			{ vonJahr: 2016, nachJahr: 2023, von: 'SPD', nach: 'GRÜNE', anzahl: 3 },
			{ vonJahr: 2016, nachJahr: 2023, von: 'CDU', nach: 'CDU', anzahl: 2 }
		];
		const parteiAnzahlProJahr = new Map<number, Map<string, number>>([
			[2016, new Map([['SPD', 3], ['CDU', 2]])],
			[2023, new Map([['GRÜNE', 3], ['CDU', 2]])]
		]);
		const layout = computeSankeyLayout(spalten, uebergaenge, parteiAnzahlProJahr);

		expect(layout.columns.map((c) => c.jahr)).toEqual([2016, 2023]);
		expect(layout.columns[1].istWiederholung).toBe(true);
		expect(layout.columns[0].istWiederholung).toBe(false);

		const summeSpalte0 = layout.columns[0].nodes.reduce((sum, n) => sum + n.anzahl, 0);
		const summeSpalte1 = layout.columns[1].nodes.reduce((sum, n) => sum + n.anzahl, 0);
		expect(summeSpalte0).toBe(5);
		expect(summeSpalte1).toBe(5);
	});

	it('deterministische Knoten-Sortierung: Anzahl absteigend, dann alphabetisch (de)', () => {
		const spalten: SankeySpalte[] = [
			{ jahr: 2016, istWiederholung: false },
			{ jahr: 2021, istWiederholung: false }
		];
		const uebergaenge: Uebergang[] = [
			{ vonJahr: 2016, nachJahr: 2021, von: 'Zebra', nach: 'GRÜNE', anzahl: 2 },
			{ vonJahr: 2016, nachJahr: 2021, von: 'Apfel', nach: 'GRÜNE', anzahl: 2 },
			{ vonJahr: 2016, nachJahr: 2021, von: 'SPD', nach: 'SPD', anzahl: 5 }
		];
		const parteiAnzahlProJahr = new Map<number, Map<string, number>>([
			[2016, new Map([['Zebra', 2], ['Apfel', 2], ['SPD', 5]])],
			[2021, new Map([['GRÜNE', 4], ['SPD', 5]])]
		]);
		const layout = computeSankeyLayout(spalten, uebergaenge, parteiAnzahlProJahr);
		expect(layout.columns[0].nodes.map((n) => n.partei)).toEqual(['SPD', 'Apfel', 'Zebra']);
	});

	it('Bündelung: ein Band pro Partei-Paar, Bandbreite = Anzahl Gebiete', () => {
		const spalten: SankeySpalte[] = [
			{ jahr: 2016, istWiederholung: false },
			{ jahr: 2021, istWiederholung: false }
		];
		const uebergaenge: Uebergang[] = [
			{ vonJahr: 2016, nachJahr: 2021, von: 'SPD', nach: 'GRÜNE', anzahl: 3 },
			{ vonJahr: 2016, nachJahr: 2021, von: 'SPD', nach: 'SPD', anzahl: 1 }
		];
		const parteiAnzahlProJahr = new Map<number, Map<string, number>>([
			[2016, new Map([['SPD', 4]])],
			[2021, new Map([['GRÜNE', 3], ['SPD', 1]])]
		]);
		const layout = computeSankeyLayout(spalten, uebergaenge, parteiAnzahlProJahr, {
			width: 100,
			height: 100,
			nodeWidth: 10,
			nodePadding: 0
		});
		expect(layout.bands).toHaveLength(2);
		const grueneBand = layout.bands.find((b) => b.nach === 'GRÜNE');
		const spdBand = layout.bands.find((b) => b.nach === 'SPD');
		expect(grueneBand?.anzahl).toBe(3);
		expect(spdBand?.anzahl).toBe(1);
		// SPD-Knoten (2016) hat Anzahl 4 -> Höhe 100; die zwei Bänder teilen sich
		// die Höhe proportional zu ihrer Anzahl (3:1 = 75:25).
		expect(grueneBand?.sourceHeight).toBeCloseTo(75, 5);
		expect(spdBand?.sourceHeight).toBeCloseTo(25, 5);
		expect(grueneBand?.path).toMatch(/^M10,/);
	});

	it('Gebiet startet in einer MITTLEREN Spalte: eigener Knoten, kein still gedropptes Band, Invarianten halten', () => {
		// a = 2011 CDU -> 2016 SPD -> 2023 SPD; b = 2016 SPD -> 2023 GRÜNE.
		// Vorher: Knoten 2016/SPD bekam seine Anzahl NUR aus eingehenden
		// Übergängen (2 aus 2011->2016), verlor also b (startet erst 2016) --
		// das ausgehende Band SPD->GRÜNE lief dadurch über volle Knotenhöhe
		// hinaus (Review Triage Log #1).
		const rows: WinnerApiRow[] = [
			row({ jahr: 2011, gebiet_slug: 'a', partei: 'CDU' }),
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2023, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2016, gebiet_slug: 'b', partei: 'SPD' }),
			row({ jahr: 2023, gebiet_slug: 'b', partei: 'GRÜNE' })
		];
		const spalten = effectiveJahreFromRows(rows);
		const uebergaenge = computeUebergaengeFromRows(rows);
		const parteiAnzahlProJahr = parteiAnzahlProJahrFromRows(rows);
		const layout = computeSankeyLayout(spalten, uebergaenge, parteiAnzahlProJahr);

		const spd2016 = layout.columns.find((c) => c.jahr === 2016)?.nodes.find((n) => n.partei === 'SPD');
		expect(spd2016?.anzahl).toBe(2);
		assertInvarianten(layout, rows, uebergaenge);
	});

	it('Coverage-Grenze: eine Spalte ohne ausgehende Übergänge bekommt trotzdem den vollen Knoten aus der Jahr×Partei-Zählung', () => {
		// Gebiet 'b' beginnt erst 2021 (kein 2016->2021-Übergang), trägt am
		// letzten Jahr trotzdem eine eigene Partei-Zeile -- die Knoten-Zählung
		// kommt jetzt direkt aus `parteiAnzahlProJahrFromRows`, nicht mehr aus
		// den eingehenden Übergängen (Review Triage Log #1: der alte Test-Name
		// suggerierte ein Soll, das nur bei genau einem zweiten Gebiet zufällig
		// aufging).
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'b', partei: 'CDU' })
		];
		const spalten = effectiveJahreFromRows(rows);
		const uebergaenge = computeUebergaengeFromRows(rows);
		const parteiAnzahlProJahr = parteiAnzahlProJahrFromRows(rows);
		const layout = computeSankeyLayout(spalten, uebergaenge, parteiAnzahlProJahr);

		const spalte2021 = layout.columns.find((c) => c.jahr === 2021);
		expect(spalte2021?.nodes.map((n) => n.anzahl).sort()).toEqual([1, 1]);
		assertInvarianten(layout, rows, uebergaenge);
	});

	it('leere Übergänge: keine Knoten, kein Crash (DB-los/leer)', () => {
		const layout = computeSankeyLayout([{ jahr: 2016, istWiederholung: false }], [], new Map());
		expect(layout.columns[0].nodes).toEqual([]);
		expect(layout.bands).toEqual([]);
	});

	it('3 Spalten: Bänder verbinden nur benachbarte Spalten, x-Koordinaten steigen mit dem Jahr', () => {
		const spalten: SankeySpalte[] = [
			{ jahr: 2011, istWiederholung: false },
			{ jahr: 2016, istWiederholung: false },
			{ jahr: 2023, istWiederholung: true }
		];
		const uebergaenge: Uebergang[] = [
			{ vonJahr: 2011, nachJahr: 2016, von: 'CDU', nach: 'CDU', anzahl: 2 },
			{ vonJahr: 2016, nachJahr: 2023, von: 'CDU', nach: 'SPD', anzahl: 2 }
		];
		const parteiAnzahlProJahr = new Map<number, Map<string, number>>([
			[2011, new Map([['CDU', 2]])],
			[2016, new Map([['CDU', 2]])],
			[2023, new Map([['SPD', 2]])]
		]);
		const layout = computeSankeyLayout(spalten, uebergaenge, parteiAnzahlProJahr);
		expect(layout.columns[0].x).toBeLessThan(layout.columns[1].x);
		expect(layout.columns[1].x).toBeLessThan(layout.columns[2].x);
		expect(layout.bands).toHaveLength(2);
	});
});
