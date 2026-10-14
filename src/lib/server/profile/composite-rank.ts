export interface CompositeRank {
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
}

interface RankRow {
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number | null;
}

/** Composite-Rang aus der Rang-Map der DB; ohne Zeile `rang: null`, `total: 0`. */
export function toCompositeRank(
	rank: ReadonlyMap<string, RankRow> | null | undefined
): CompositeRank {
	const row = rank?.get('composite');
	return {
		rang: row?.rang ?? null,
		quartil: row?.quartil ?? null,
		total: row?.total ?? 0
	};
}
