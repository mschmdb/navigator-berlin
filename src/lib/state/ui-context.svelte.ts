import { getContext, setContext } from 'svelte';
import type { LayerHit, GeocodeSuggestion } from '$lib/data';

const KEY = Symbol('ui-state');

export type SheetSnapVh = 40 | 70 | 100;

export interface UiState {
	inspectorOpen: boolean;
	selectedAddress: GeocodeSuggestion | null;
	selectedLayerHits: LayerHit[];
	activeLayerSlugs: string[];
	sheetSnapVh: SheetSnapVh;
}

export function createUiState(): UiState {
	const state = $state<UiState>({
		inspectorOpen: false,
		selectedAddress: null,
		selectedLayerHits: [],
		activeLayerSlugs: [],
		sheetSnapVh: 40
	});
	setContext(KEY, state);
	return state;
}

export function getUiState(): UiState {
	const ctx = getContext<UiState | undefined>(KEY);
	if (!ctx) {
		throw new Error(
			'UiState fehlt: createUiState() muss in einem Ancestor (z.B. +layout.svelte) laufen'
		);
	}
	return ctx;
}
