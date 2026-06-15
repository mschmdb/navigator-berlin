import { getContext, setContext } from 'svelte';
import type {
	LayerHit,
	GeocodeSuggestion,
	ClimateStation,
	ClimateData,
	OepnvStopIndex,
	KiezScore
} from '$lib/data';
import type { WahlResultsAtPoint } from '$lib/data/get-wahl-results-at-point.js';
import type { DemografieScope } from '$lib/components/atlas/inspector-panel/internal/demografie-types.js';
import type { Bookmark } from './bookmark-schema.js';
import {
	saveBookmark,
	removeBookmark as removeBookmarkFromStore,
	isBookmarked,
	MAX_BOOKMARKS
} from './bookmark-store.js';

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
	/** Story 1.15 AC-3: nach Pin-Click Inspector zur passenden Layer-Hit-Row scrollen. */
	scrollToLayerSlug: string | null;
	/** Story 1.14: per-Layer Soft-Hide aus MapLegend (Eye-Toggle). */
	hiddenLayerSlugs: string[];
	/** Story 1.19: ÖPNV-Stop-Index für Nearest-Stop-Berechnung im Inspector. */
	oepnvStopIndex: OepnvStopIndex | null;
	/** Story 1.26: lokale Adress-Bookmarks (LocalStorage-Mirror, siehe ADR-004). */
	bookmarks: Bookmark[];
	bookmarksDialogOpen: boolean;
	/** Story 1.27: Side-by-Side-Compare-Modus. */
	compareMode: boolean;
	comparisonAddress: GeocodeSuggestion | null;
	comparisonLayerHits: LayerHit[];
	comparisonClimateStation: ClimateStation | null;
	comparisonClimateSeries: ClimateData | null;
	comparisonLoading: boolean;
	/** Story 1.28: Kiez-Score (5 Dimensionen pro LOR-Planungsraum). */
	kiezScore: KiezScore | null;
	/** Story 1.28 + 1.27: Kiez-Score für Vergleichs-Adresse B. */
	comparisonKiezScore: KiezScore | null;
	/** Story 6.3: Wahl-Ergebnisse Multi-Level für aktuelle Adresse. */
	wahlResults: WahlResultsAtPoint | null;
	/** Story 6.3d: Wahl-Ergebnisse für Vergleichs-Adresse B (Compare-Mode). */
	comparisonWahlResults: WahlResultsAtPoint | null;
	/** Story 10.5: aktiver räumlicher Bezug des Bevölkerungsprofils (steuert Karten-Outline). */
	demografieScope: DemografieScope;
	/** Story 10.6b: Lärm-dB-Kiez-Mittel (L_DEN) für aktuelle Adresse. */
	kiezLaermDb: number | null;
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
		climateSeries: null,
		scrollToLayerSlug: null,
		hiddenLayerSlugs: [],
		oepnvStopIndex: null,
		bookmarks: [],
		bookmarksDialogOpen: false,
		compareMode: false,
		comparisonAddress: null,
		comparisonLayerHits: [],
		comparisonClimateStation: null,
		comparisonClimateSeries: null,
		comparisonLoading: false,
		kiezScore: null,
		comparisonKiezScore: null,
		wahlResults: null,
		comparisonWahlResults: null,
		demografieScope: 'standort',
		kiezLaermDb: null
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
	state.hiddenLayerSlugs.length = 0;
}

export function toggleLayerHidden(state: UiState, slug: string): void {
	const idx = state.hiddenLayerSlugs.indexOf(slug);
	if (idx >= 0) state.hiddenLayerSlugs.splice(idx, 1);
	else state.hiddenLayerSlugs.push(slug);
}

export function removeLayer(state: UiState, slug: string): void {
	const activeIdx = state.activeLayerSlugs.indexOf(slug);
	if (activeIdx >= 0) state.activeLayerSlugs.splice(activeIdx, 1);
	const hiddenIdx = state.hiddenLayerSlugs.indexOf(slug);
	if (hiddenIdx >= 0) state.hiddenLayerSlugs.splice(hiddenIdx, 1);
}

export function addBookmark(state: UiState, bookmark: Bookmark): boolean {
	const storeShape = { schemaVersion: 1 as const, bookmarks: state.bookmarks };
	if (isBookmarked(storeShape, bookmark.lat, bookmark.lng)) return false;
	if (state.bookmarks.length >= MAX_BOOKMARKS) return false;
	const next = saveBookmark(storeShape, bookmark);
	state.bookmarks = next.bookmarks;
	return true;
}

export function removeBookmark(state: UiState, id: string): void {
	const next = removeBookmarkFromStore({ schemaVersion: 1, bookmarks: state.bookmarks }, id);
	state.bookmarks = next.bookmarks;
}

export function clearBookmarks(state: UiState): void {
	state.bookmarks = [];
}

function clearComparisonData(state: UiState): void {
	state.comparisonLayerHits = [];
	state.comparisonClimateStation = null;
	state.comparisonClimateSeries = null;
	state.comparisonKiezScore = null;
}

export function toggleCompareMode(state: UiState): void {
	state.compareMode = !state.compareMode;
	if (!state.compareMode) {
		state.comparisonAddress = null;
		clearComparisonData(state);
		state.comparisonLoading = false;
	}
}

export function setComparisonAddress(state: UiState, address: GeocodeSuggestion | null): void {
	state.comparisonAddress = address;
	clearComparisonData(state);
}

export function exitCompareMode(state: UiState): void {
	state.compareMode = false;
	state.comparisonAddress = null;
	clearComparisonData(state);
	state.comparisonLoading = false;
}

/**
 * GH-Issue #10: Overlay-Mutex.
 * Layer-Palette und Bookmark-Dialog sind beide BottomSheet-Overlays mit
 * Focus-Trap. Gleichzeitig offen führt zu Focus-Trap-Konflikt, doppeltem
 * Mount und unklarer ESC/Backdrop-Semantik. Diese Setter erzwingen
 * gegenseitigen Ausschluss by-design.
 */
export function openPalette(state: UiState): void {
	state.bookmarksDialogOpen = false;
	state.paletteOpen = true;
}

export function openBookmarksDialog(state: UiState): void {
	state.paletteOpen = false;
	state.bookmarksDialogOpen = true;
}

export function closeOverlays(state: UiState): void {
	state.paletteOpen = false;
	state.bookmarksDialogOpen = false;
}
