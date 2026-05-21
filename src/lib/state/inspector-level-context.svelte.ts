import { getContext, setContext } from 'svelte';
import {
	resolveSpatialLevel,
	type SpatialContext,
	type SpatialLevel
} from '$lib/data/resolve-spatial-level.js';

export type { SpatialLevel } from '$lib/data/resolve-spatial-level.js';

const KEY = Symbol('inspector-level-state');

/**
 * Globaler Inspector-Level-Context (Story 8.1, ADR-014).
 *
 * Hält den aktuellen Spatial-Level + den aufgelösten Kiez/Bezirk der aktiven
 * Adresse. Sections lesen `currentLevel` und reagieren darauf.
 *
 * Local-Override (AC #6): Eine Section darf den globalen Level lokal überschreiben,
 * indem sie einen EIGENEN lokalen `$state` hält und NICHT zurück in diesen Context
 * schreibt. Der globale Context bleibt unberührt, andere Sections sehen weiter
 * `currentLevel`. Sections ohne Override lesen einfach `currentLevel` (Default).
 */
export interface InspectorLevelState {
	currentLevel: SpatialLevel;
	kiezSlug: string | null;
	kiezName: string | null;
	bezirkSlug: string | null;
	bezirkName: string | null;
}

export function createInspectorLevelState(): InspectorLevelState {
	const state = $state<InspectorLevelState>({
		currentLevel: 'address',
		kiezSlug: null,
		kiezName: null,
		bezirkSlug: null,
		bezirkName: null
	});
	setContext(KEY, state);
	return state;
}

export function getInspectorLevelState(): InspectorLevelState {
	const ctx = getContext<InspectorLevelState | undefined>(KEY);
	if (!ctx) {
		throw new Error(
			'InspectorLevelState fehlt: createInspectorLevelState() muss in einem Ancestor laufen'
		);
	}
	return ctx;
}

export function setLevel(state: InspectorLevelState, level: SpatialLevel): void {
	state.currentLevel = level;
}

/** Pure-Mutation: schreibt einen aufgelösten SpatialContext in den State. */
export function applySpatialContext(state: InspectorLevelState, ctx: SpatialContext): void {
	state.kiezSlug = ctx.kiezSlug;
	state.kiezName = ctx.kiezName;
	state.bezirkSlug = ctx.bezirkSlug;
	state.bezirkName = ctx.bezirkName;
}

/**
 * Löst Kiez/Bezirk aus einem Punkt auf und schreibt sie in den State.
 * Fetch lebt in resolveSpatialLevel (Daten-Layer); diese Funktion verheiratet
 * Auflösung + State-Mutation für den Inspector-Composition-Root.
 */
export async function resolveSpatialContext(
	state: InspectorLevelState,
	lat: number,
	lng: number,
	fetchFn: typeof fetch = fetch
): Promise<void> {
	const ctx = await resolveSpatialLevel(lat, lng, fetchFn);
	applySpatialContext(state, ctx);
}

/** Ein Level ist auflösbar, wenn der nötige Slug vorliegt (AC #5 Toggle-Disable). */
export function canResolveLevel(state: InspectorLevelState, level: SpatialLevel): boolean {
	if (level === 'address' || level === 'berlin') return true;
	if (level === 'kiez') return state.kiezSlug !== null;
	return state.bezirkSlug !== null;
}
