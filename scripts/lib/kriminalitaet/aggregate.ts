/**
 * Story 14.0 · 3-Jahres-Mittel + Kriminalitäts-Index.
 *
 * Aus den HZ-Jahrgängen (zuletzt drei) wird je Bezirksregion und Delikt das
 * Mittel gebildet (dämpft die Volatilität kleiner Fallzahlen, Methodik-Caveat 4)
 * und über die Delikt-Gewichte zu EINEM Index je BR kombiniert.
 *
 * Polarität: höher = mehr erfasste Kriminalität. KEINE Invertierung zu
 * „Sicherheit" (Stigma-Schutz, ADR-019). Die Normalisierung 0–100 und die
 * finalen Gewichte setzt Story 14.1; hier Schnittstelle + gleichgewichteter
 * Default.
 */

import type { BrHzRow, DeliktSpec } from './parse-xlsx.js';

export type DeliktWeights = Record<string, number>;

export interface BrMeanRow {
	readonly bzrId: string;
	readonly name: string;
	readonly meanHz: Record<string, number | null>;
}

export interface BrIndexRecord {
	readonly bzrId: string;
	readonly name: string;
	/** Kombinierter Index (gewichteter HZ-Mittelwert); `null` wenn keine Daten. */
	readonly index: number | null;
	/** 3-Jahres-Mittel je Delikt-Key (Transparenz/Inspector). */
	readonly delikteHz: Record<string, number | null>;
}

/** Gleichgewichteter Default über das Default-Delikt-Set (Summe 1.0). */
export const DEFAULT_DELIKT_WEIGHTS: DeliktWeights = {
	kieztaten: 0.2,
	wohnraumeinbruch: 0.2,
	sachbeschaedigung: 0.2,
	strassenraub: 0.2,
	fahrraddiebstahl: 0.2
};

/** Mittel über die vorhandenen (nicht-null) Werte; `null` wenn alle fehlen. */
export function threeYearMean(values: readonly (number | null)[]): number | null {
	const present = values.filter((v): v is number => typeof v === 'number');
	if (present.length === 0) return null;
	return present.reduce((a, b) => a + b, 0) / present.length;
}

/**
 * Gewichteter Mittelwert über die Delikte. Fehlende (null) Delikte werden
 * übersprungen, die Gewichte über die vorhandenen renormalisiert. `null` wenn
 * kein Delikt vorhanden ist.
 */
export function combineIndex(
	meanHz: Record<string, number | null>,
	weights: DeliktWeights
): number | null {
	let weightedSum = 0;
	let weightTotal = 0;
	for (const [key, weight] of Object.entries(weights)) {
		const value = meanHz[key];
		if (typeof value !== 'number') continue;
		weightedSum += value * weight;
		weightTotal += weight;
	}
	if (weightTotal === 0) return null;
	return weightedSum / weightTotal;
}

/**
 * Mittelt jede Delikt-Spalte je BR über die Jahrgänge. Erwartet pro Jahrgang
 * eine Zeilenliste; gruppiert nach `bzrId`.
 */
export function meanByDelikt(rowsPerYear: readonly BrHzRow[][]): BrMeanRow[] {
	// bzrId -> { name, perDelikt: key -> Wertliste über Jahre }
	const acc = new Map<string, { name: string; perDelikt: Map<string, (number | null)[]> }>();
	for (const yearRows of rowsPerYear) {
		for (const row of yearRows) {
			let entry = acc.get(row.bzrId);
			if (!entry) {
				entry = { name: row.name, perDelikt: new Map() };
				acc.set(row.bzrId, entry);
			}
			for (const [key, value] of Object.entries(row.hz)) {
				const list = entry.perDelikt.get(key) ?? [];
				list.push(value);
				entry.perDelikt.set(key, list);
			}
		}
	}

	const out: BrMeanRow[] = [];
	for (const [bzrId, entry] of acc) {
		const meanHz: Record<string, number | null> = {};
		for (const [key, values] of entry.perDelikt) {
			meanHz[key] = threeYearMean(values);
		}
		out.push({ bzrId, name: entry.name, meanHz });
	}
	return out;
}

/** Baut pro BR den kombinierten Index + die Roh-Mittel. */
export function buildBrIndex(
	rowsPerYear: readonly BrHzRow[][],
	delikte: readonly DeliktSpec[],
	weights: DeliktWeights
): BrIndexRecord[] {
	const means = meanByDelikt(rowsPerYear);
	return means.map((m) => {
		// Nur das ausgewählte Delikt-Set in den Output übernehmen.
		const delikteHz: Record<string, number | null> = {};
		for (const spec of delikte) {
			delikteHz[spec.key] = m.meanHz[spec.key] ?? null;
		}
		return {
			bzrId: m.bzrId,
			name: m.name,
			index: combineIndex(delikteHz, weights),
			delikteHz
		};
	});
}
