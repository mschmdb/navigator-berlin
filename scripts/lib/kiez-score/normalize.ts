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
