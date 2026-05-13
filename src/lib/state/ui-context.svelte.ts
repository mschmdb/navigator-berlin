import { getContext, setContext } from 'svelte';
import type { LayerHit, GeocodeSuggestion, ClimateStation, ClimateData } from '$lib/data';

const KEY = Symbol('ui-state');

export type SheetSnapVh = 40 | 70 | 100;

export const RECENT_LAYERS_MAX = 5;

export interface UiState {
	inspectorOpen: boolean;
	selectedAddress: GeocodeSuggestion | null;
	selectedLayerHits: LayerHit[];
	activeLayerSlugs: string[];
	recentLayerSlugs: string[];
	sheetSnapVh: SheetSnapVh;
	paletteOpen: boolean;
	nearestStation: ClimateStation | null;
	climateSeries: ClimateData | null;
}

export function createUiState(): UiState {
	const state = $state<UiState>({
		inspectorOpen: false,
		selectedAddress: null,
		selectedLayerHits: [],
		activeLayerSlugs: [],
		recentLayerSlugs: [],
		sheetSnapVh: 40,
		paletteOpen: false,
		nearestStation: null,
		climateSeries: null
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

export function toggleLayer(state: UiState, slug: string): void {
	const activeIdx = state.activeLayerSlugs.indexOf(slug);
	if (activeIdx >= 0) {
		state.activeLayerSlugs.splice(activeIdx, 1);
	} else {
		state.activeLayerSlugs.push(slug);
	}
	const recentIdx = state.recentLayerSlugs.indexOf(slug);
	if (recentIdx >= 0) state.recentLayerSlugs.splice(recentIdx, 1);
	state.recentLayerSlugs.unshift(slug);
	if (state.recentLayerSlugs.length > RECENT_LAYERS_MAX) {
		state.recentLayerSlugs.length = RECENT_LAYERS_MAX;
	}
}

export function clearLayers(state: UiState): void {
	state.activeLayerSlugs.length = 0;
}
