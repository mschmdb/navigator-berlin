/**
 * Story 11 (Sankey-Rework): reines Daten-Modul für den Wahljahre-Sankey.
 * Baut Nodes/Links aus der bereits geladenen Bulk-Winners-Response, BEVOR
 * `d3-sankey` läuft (Boundary: „d3-sankey macht ausschließlich das
 * Layout"). Ersetzt `sankey-layout.ts` (Story 8, entfernt).
 *
 * Spalten-Modell (Matze-Direktive 20.09., REVIDIERT 12:07): je Wahl der
 * Reihe eine Spalte, Knoten = Parteien untereinander (Wiederholungs-Merge-
 * Regel gilt), Bänder = gebündelte Partei→Partei-Übergänge (ein Band je
 * Paar, Bandbreite = Anzahl Gebiete). KEINE Gebiets-Spalte, keine
 * Einzel-Bänder pro Gebiet -- 143 Einzel-Bänder machten die Kiez-Ansicht im
 * Live-Test unlesbar (Spec Change Log 12:07). Nutzt dieselbe
 * Wiederholungswahl-Merge-Logik aus `wechsel-data.ts`, KEINE zweite
 * Implementierung.
 *
 * MapLibre-/d3-frei, kein Netzwerk-Zugriff, voll unit-testbar.
 */
import { parteiColor } from '$lib/data/partei-farben.js';
import {
	computeUebergaengeFromRows,
	effectiveJahreFromRows,
	parteiAnzahlProJahrFromRows,
	type SankeySpalte
} from './wechsel-data.js';
import type { WinnerApiRow } from './winner-map-data.js';

export interface SankeyGraphNode {
	readonly id: string;
	/** 0-basierter Index in `spalten`. */
	readonly column: number;
	/** Partei-Kurzname. */
	readonly label: string;
	readonly farbe: string;
	/** Anzahl Gebiete, in denen diese Partei in diesem Jahr stärkste Kraft war. */
	readonly anzahl: number;
	readonly jahr: number;
	readonly partei: string;
}

export interface SankeyGraphLink {
	readonly source: string;
	readonly target: string;
	readonly value: number;
	readonly von: string;
	readonly nach: string;
	readonly jahr: number;
}

export interface SankeyGraph {
	readonly nodes: readonly SankeyGraphNode[];
	readonly links: readonly SankeyGraphLink[];
	/** Effektive Jahre der Reihe, eine Spalte je Wahl. */
	readonly spalten: readonly SankeySpalte[];
	/** Anzahl distinkter Gebiete mit Daten (Grundlage des Takeaway-Satzes). */
	readonly totalGebiete: number;
	/** Summe der Partei-Knoten-Anzahl je Jahr -- Grundlage des Knoten-Tooltips
	 * („stärkste Kraft in N von M Gebieten") und der Spaltensummen-Invariante. */
	readonly gebieteMitDatenByJahr: ReadonlyMap<number, number>;
}

function parteiNodeId(jahr: number, partei: string): string {
	return `partei:${jahr}:${partei}`;
}

/** Baut den Sankey-Graphen aus der Bulk-Winners-Response. */
export function buildSankeyGraph(rows: readonly WinnerApiRow[]): SankeyGraph {
	const spalten = effectiveJahreFromRows(rows);
	const uebergaenge = computeUebergaengeFromRows(rows);
	const parteiAnzahlProJahr = parteiAnzahlProJahrFromRows(rows);

	const jahrToColumn = new Map<number, number>(spalten.map((s, i) => [s.jahr, i]));

	const nodes: SankeyGraphNode[] = [];
	const nodeIds = new Set<string>();
	const gebieteMitDatenByJahr = new Map<number, number>();
	const gebieteInsgesamt = new Set<string>();
	for (const r of rows) {
		if (r.jahr !== null) gebieteInsgesamt.add(r.gebiet_slug);
	}

	for (const [jahr, byPartei] of parteiAnzahlProJahr) {
		const column = jahrToColumn.get(jahr);
		if (column === undefined) continue; // Eltern-Jahr bereits gefiltert (nie eigene Spalte).
		let summe = 0;
		for (const [partei, anzahl] of byPartei) {
			const id = parteiNodeId(jahr, partei);
			nodes.push({
				id,
				column,
				label: partei,
				farbe: parteiColor(partei),
				anzahl,
				jahr,
				partei
			});
			nodeIds.add(id);
			summe += anzahl;
		}
		gebieteMitDatenByJahr.set(jahr, summe);
	}

	const links: SankeyGraphLink[] = [];
	for (const u of uebergaenge) {
		const source = parteiNodeId(u.vonJahr, u.von);
		const target = parteiNodeId(u.nachJahr, u.nach);
		if (!nodeIds.has(source) || !nodeIds.has(target)) continue;
		links.push({
			source,
			target,
			value: u.anzahl,
			von: u.von,
			nach: u.nach,
			jahr: u.nachJahr
		});
	}

	return {
		nodes,
		links,
		spalten,
		totalGebiete: gebieteInsgesamt.size,
		gebieteMitDatenByJahr
	};
}
