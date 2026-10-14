/** Unter dieser Zahl vermieteter Wohnungen zeigt ein Gebiet "keine Angabe". */
export const MIN_WOHNUNGEN = 30;

export interface MieteAccumulator {
	/** Anzahl vermieteter Wohnungen. */
	wohnungen: number;
	/** Summe Miete (EUR/m2) x Wohnungen. */
	mieteSumme: number;
	/** Zellen ohne KLAMMERN-Flag. 0 = der Gebietswert stuetzt sich nur auf unsichere Zellen. */
	sichereZellen: number;
}

export function createAccumulator(): MieteAccumulator {
	return { wohnungen: 0, mieteSumme: 0, sichereZellen: 0 };
}

export function addCell(
	acc: MieteAccumulator,
	mieteQm: number,
	wohnungen: number,
	klammern = false
): void {
	if (wohnungen <= 0) return;
	if (!klammern) acc.sichereZellen += 1;
	acc.wohnungen += wohnungen;
	acc.mieteSumme += mieteQm * wohnungen;
}

export function mergeAccumulators(parts: readonly MieteAccumulator[]): MieteAccumulator {
	const out = createAccumulator();
	for (const p of parts) {
		out.wohnungen += p.wohnungen;
		out.mieteSumme += p.mieteSumme;
		out.sichereZellen += p.sichereZellen;
	}
	return out;
}

/**
 * Angezeigter Gebietswert (Destatis-Definition), 2 Nachkommastellen. Unter Schwelle oder
 * wenn nur KLAMMERN-Zellen beitragen: null (KLAMMERN nie als Einzelwert).
 */
export function weightedMean(acc: MieteAccumulator): number | null {
	if (acc.sichereZellen === 0) return null;
	return meanFromSums(acc.mieteSumme, acc.wohnungen);
}

/** Gleiche Regel fuer bereits aufsummierte Werte (Kiez/Bezirk-Aggregat). */
export function meanFromSums(mieteSumme: number, wohnungen: number): number | null {
	if (wohnungen < MIN_WOHNUNGEN) return null;
	return Math.round((mieteSumme / wohnungen) * 100) / 100;
}
