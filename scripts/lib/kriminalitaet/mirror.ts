/**
 * Story 14.0 · BR→PLR-Spiegelung.
 *
 * Der Kriminalitätsatlas liefert Werte nur auf Bezirksregions-Ebene (6-stelliger
 * LOR-Schlüssel). Für die flächen-gewichtete Aggregation (ADR-013) erbt jeder
 * Planungsraum den Wert seiner BR (`BZR_ID = PLR_ID[:6]`, 0 Mismatches auf
 * ODIS-2021, Story 2.9a). Der Index ist damit konstant innerhalb einer BR.
 */

import type { BrIndexRecord } from './aggregate.js';

export interface PlrKriminalitaetRecord {
	readonly plrId: string;
	/** Abgeleitete Bezirksregion (`PLR_ID[:6]`). */
	readonly bzrId: string;
	/** Gespiegelter BR-Index; `null` wenn BR fehlt oder selbst null ist. */
	readonly index: number | null;
	/** Gespiegelte Roh-HZ der BR (leer, wenn keine BR zuordenbar). */
	readonly delikteHz: Record<string, number | null>;
}

/**
 * Spiegelt den BR-Index auf jeden Planungsraum. PLR ohne zuordenbare BR
 * erhalten `index: null` und leere Roh-HZ (Missing-Data, kein Crash). Output
 * ist nach `plrId` sortiert.
 */
export function mirrorBrToPlr(
	brIndex: readonly BrIndexRecord[],
	plrIds: readonly string[]
): PlrKriminalitaetRecord[] {
	const byBzr = new Map<string, BrIndexRecord>();
	for (const br of brIndex) byBzr.set(br.bzrId, br);

	return plrIds
		.map((plrId): PlrKriminalitaetRecord => {
			const bzrId = plrId.slice(0, 6);
			const br = byBzr.get(bzrId);
			return {
				plrId,
				bzrId,
				index: br ? br.index : null,
				delikteHz: br ? { ...br.delikteHz } : {}
			};
		})
		.sort((a, b) => a.plrId.localeCompare(b.plrId));
}
