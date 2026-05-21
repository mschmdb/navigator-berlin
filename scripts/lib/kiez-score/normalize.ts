export const ORDINAL_3 = { gering: 100, mittel: 50, hoch: 0 } as const;
export const ORDINAL_4 = { gering: 0, mittel: 33, hoch: 66, 'sehr hoch': 100 } as const;
export const MSS_STATUS_4 = {
	'sehr niedrig': 0,
	niedrig: 33,
	mittel: 66,
	hoch: 100
} as const;

// Story 1.22: Umweltatlas-Grünversorgung liefert wertende Roh-Kategorien (schlecht/gut/sehr gut),
// nicht die objektive 4-Stufen-Skala. Aliase abbilden, damit ordinal-4-Normalisierung greift.
const ORDINAL_4_ALIASES: Record<string, keyof typeof ORDINAL_4> = {
	'sehr schlecht': 'gering',
	'sehr niedrig': 'gering',
	schlecht: 'gering',
	niedrig: 'gering',
	gut: 'hoch',
	'sehr gut': 'sehr hoch'
};

export function normalizeOrdinal3(value: unknown): number | null {
	if (typeof value !== 'string') return null;
	if (!(value in ORDINAL_3)) return null;
	return ORDINAL_3[value as keyof typeof ORDINAL_3];
}

export function normalizeOrdinal4(value: unknown): number | null {
	if (typeof value !== 'string') return null;
	const normalized = value.toLowerCase().trim();
	const aliased = ORDINAL_4_ALIASES[normalized];
	const key = aliased ?? (normalized as keyof typeof ORDINAL_4);
	if (!(key in ORDINAL_4)) return null;
	return ORDINAL_4[key];
}

export function normalizeMssStatus4(value: unknown): number | null {
	if (typeof value !== 'string') return null;
	if (!(value in MSS_STATUS_4)) return null;
	return MSS_STATUS_4[value as keyof typeof MSS_STATUS_4];
}

export function normalizeDistance(meters: number | null, threshold: number): number | null {
	if (meters === null || !Number.isFinite(meters) || meters < 0) return null;
	if (threshold <= 0) return null;
	if (meters >= threshold) return 0;
	return Math.max(0, Math.min(100, 100 * (1 - meters / threshold)));
}

export function normalizeNumericInverted(
	value: unknown,
	bestAt: number,
	worstAt: number
): number | null {
	if (typeof value !== 'number' || !Number.isFinite(value)) return null;
	if (worstAt <= bestAt) return null;
	if (value <= bestAt) return 100;
	if (value >= worstAt) return 0;
	return Math.max(0, Math.min(100, 100 * (1 - (value - bestAt) / (worstAt - bestAt))));
}

export function normalizePresence(present: boolean): number {
	return present ? 100 : 0;
}

/**
 * Betten-Kapazität (Story 10.2). `betten_insgesamt` ist string, `betten` int.
 * Einheitlich: number oder string → number, `<= 0` / leer / nicht-numerisch → null.
 */
export function parseBettenCapacity(value: unknown): number | null {
	let n: number;
	if (typeof value === 'number') n = value;
	else if (typeof value === 'string') n = Number.parseInt(value.trim(), 10);
	else return null;
	return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Kapazitätsgewichtete POI-Distanz (Story 10.2). Distanz-Score × Kapazitäts-Faktor.
 * Faktor = 0.5 (Basis, auch ohne Kapazitätsdaten) + 0.3 × Betten-Anteil + 0.2 × Fachabteilungs-Anteil.
 * Fehlende Kapazität → Faktor 0.5 (neutral, kein Boost, kein Totalausfall).
 */
export function normalizeCapacityWeightedDistance(
	distanceM: number | null,
	threshold: number,
	betten: number | null,
	maxBetten: number,
	fachabteilungen: number | null = null,
	maxFachabteilungen = 0
): number | null {
	const distScore = normalizeDistance(distanceM, threshold);
	if (distScore === null) return null;
	const bettenFrac = betten !== null && maxBetten > 0 ? Math.min(betten / maxBetten, 1) : 0;
	const fachFrac =
		fachabteilungen !== null && maxFachabteilungen > 0
			? Math.min(fachabteilungen / maxFachabteilungen, 1)
			: 0;
	const factor = 0.5 + 0.3 * bettenFrac + 0.2 * fachFrac;
	return Math.max(0, Math.min(100, Math.round(distScore * factor * 10) / 10));
}

/**
 * Kita-Plätze pro Kind 0-6 (Story 10.1). Höher = besser. `null` (kein Nenner) bleibt null.
 * >= bestAt → 100, <= 0 → 0, linear dazwischen.
 */
export function normalizeKitaProKind(
	plaetzeProKind: number | null,
	bestAt: number
): number | null {
	if (plaetzeProKind === null || !Number.isFinite(plaetzeProKind)) return null;
	if (bestAt <= 0) return null;
	if (plaetzeProKind <= 0) return 0;
	if (plaetzeProKind >= bestAt) return 100;
	return Math.round(100 * (plaetzeProKind / bestAt) * 10) / 10;
}
