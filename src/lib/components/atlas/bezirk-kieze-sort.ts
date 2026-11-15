import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';

export type KiezSortKey = 'score' | 'name';
export type KiezSortDirection = 'asc' | 'desc';

export interface KiezSortState {
	readonly key: KiezSortKey;
	readonly direction: KiezSortDirection;
}

const DEFAULT_DIRECTION: Record<KiezSortKey, KiezSortDirection> = {
	score: 'desc',
	name: 'asc'
};

/** Klick auf eine Spalte: aktive Spalte kehrt um, neue Spalte startet mit ihrer Standardrichtung. */
export function nextSortState(current: KiezSortState, key: KiezSortKey): KiezSortState {
	if (current.key === key) {
		return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
	}
	return { key, direction: DEFAULT_DIRECTION[key] };
}

export function initialSortState(hasScores: boolean): KiezSortState {
	const key: KiezSortKey = hasScores ? 'score' : 'name';
	return { key, direction: DEFAULT_DIRECTION[key] };
}

const byName = (a: KiezListEntry, b: KiezListEntry): number => a.name.localeCompare(b.name, 'de');

/**
 * Der angezeigte Score ist gerundet. Bei gleichem Score entscheidet der Rang aus dem
 * ungerundeten Wert (kleiner = besser), Kieze ohne Rang stehen dahinter.
 */
function byRang(a: KiezListEntry, b: KiezListEntry, sign: number): number {
	if (a.rang === null && b.rang === null) return 0;
	if (a.rang === null) return 1;
	if (b.rang === null) return -1;
	return -sign * (a.rang - b.rang);
}

/** Sortiert eine Kopie. Kieze ohne Score stehen bei Score-Sortierung immer am Ende. */
export function sortKiezEntries(
	entries: readonly KiezListEntry[],
	state: KiezSortState
): KiezListEntry[] {
	const sign = state.direction === 'asc' ? 1 : -1;
	return [...entries].sort((a, b) => {
		if (state.key === 'name') return sign * byName(a, b);
		if (a.composite === null && b.composite === null) return byName(a, b);
		if (a.composite === null) return 1;
		if (b.composite === null) return -1;
		return sign * (a.composite - b.composite) || byRang(a, b, sign) || byName(a, b);
	});
}

export function ariaSortFor(
	state: KiezSortState,
	key: KiezSortKey
): 'ascending' | 'descending' | 'none' {
	if (state.key !== key) return 'none';
	return state.direction === 'asc' ? 'ascending' : 'descending';
}
