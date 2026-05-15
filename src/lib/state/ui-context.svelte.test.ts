import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { mount, unmount } from 'svelte';
import UiContextProbe from './ui-context-probe.svelte';
import MissingProvider from './ui-context-missing-provider.svelte';
import {
	createUiState,
	getUiState,
	toggleLayer,
	clearLayers,
	addBookmark,
	removeBookmark,
	clearBookmarks,
	toggleCompareMode,
	setComparisonAddress,
	exitCompareMode,
	type UiState
} from './ui-context.svelte.js';
import type {
	GeocodeSuggestion,
	LayerHit,
	ClimateStation,
	ClimateData
} from '$lib/data';
import type { Bookmark } from './bookmark-schema.js';

function makeState(): UiState {
	return {
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
		comparisonKiezScore: null
	};
}

function makeAddress(overrides: Partial<GeocodeSuggestion> = {}): GeocodeSuggestion {
	return {
		id: 'addr-b',
		displayName: 'Karl-Marx-Allee 1, Berlin',
		lat: 52.519,
		lng: 13.422,
		type: 'address',
		addresstype: 'building',
		...overrides
	};
}

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
	return {
		id: '11111111-1111-4111-8111-111111111111',
		displayName: 'Test-Adresse',
		lat: 52.5,
		lng: 13.4,
		createdAt: '2026-05-15T10:00:00.000Z',
		...overrides
	};
}

describe('ui-context', () => {
	it('createUiState initialisiert Default-State', async () => {
		const screen = render(UiContextProbe);
		const dump = (await screen.getByTestId('dump').element()) as HTMLElement;
		const state = JSON.parse(dump.textContent ?? '{}');
		expect(state.inspectorOpen).toBe(false);
		expect(state.selectedAddress).toBeNull();
		expect(state.selectedLayerHits).toEqual([]);
		expect(state.activeLayerSlugs).toEqual([]);
		expect(state.recentLayerSlugs).toEqual([]);
		expect(state.sheetSnapVh).toBe(40);
		expect(state.paletteOpen).toBe(false);
		expect(state.nearestStation).toBeNull();
		expect(state.climateSeries).toBeNull();
		expect(state.scrollToLayerSlug).toBeNull();
		expect(state.oepnvStopIndex).toBeNull();
	});

	it('createUiState reagiert auf Mutation reaktiv', async () => {
		const screen = render(UiContextProbe);
		await screen.getByTestId('open-inspector').click();
		const dump = (await screen.getByTestId('dump').element()) as HTMLElement;
		const state = JSON.parse(dump.textContent ?? '{}');
		expect(state.inspectorOpen).toBe(true);
	});

	it('getUiState wirft, wenn kein Provider in Context', () => {
		const host = document.createElement('div');
		expect(() => {
			const cmp = mount(MissingProvider, { target: host });
			unmount(cmp);
		}).toThrow(/UiState fehlt/);
	});

	it('exporte createUiState + getUiState sind Funktionen', () => {
		expect(typeof createUiState).toBe('function');
		expect(typeof getUiState).toBe('function');
	});

	describe('toggleLayer', () => {
		it('fügt unbekannten Slug zu activeLayerSlugs hinzu', () => {
			const s = makeState();
			toggleLayer(s, 'bezirke');
			expect(s.activeLayerSlugs).toEqual(['bezirke']);
		});

		it('entfernt bekannten Slug aus activeLayerSlugs', () => {
			const s = makeState();
			s.activeLayerSlugs = ['bezirke', 'plz'];
			toggleLayer(s, 'bezirke');
			expect(s.activeLayerSlugs).toEqual(['plz']);
		});

		it('aktualisiert recentLayerSlugs als LRU (most-recent first)', () => {
			const s = makeState();
			toggleLayer(s, 'bezirke');
			toggleLayer(s, 'plz');
			toggleLayer(s, 'mietspiegel-wohnlage');
			expect(s.recentLayerSlugs).toEqual(['mietspiegel-wohnlage', 'plz', 'bezirke']);
		});

		it('LRU dedupliziert bei wiederholtem Toggle', () => {
			const s = makeState();
			toggleLayer(s, 'bezirke');
			toggleLayer(s, 'plz');
			toggleLayer(s, 'bezirke');
			expect(s.recentLayerSlugs).toEqual(['bezirke', 'plz']);
		});

		it('LRU kappt bei max 5 Einträgen', () => {
			const s = makeState();
			['a', 'b', 'c', 'd', 'e', 'f'].forEach((slug) => toggleLayer(s, slug));
			expect(s.recentLayerSlugs).toHaveLength(5);
			expect(s.recentLayerSlugs[0]).toBe('f');
			expect(s.recentLayerSlugs).not.toContain('a');
		});
	});

	describe('scrollToLayerSlug (Story 1.15 Pin-Click)', () => {
		it('Initialwert ist null', () => {
			const s = makeState();
			expect(s.scrollToLayerSlug).toBeNull();
		});

		it('kann gesetzt werden um Inspector-Scroll-Target zu signalisieren', () => {
			const s = makeState();
			s.scrollToLayerSlug = 'stolpersteine';
			expect(s.scrollToLayerSlug).toBe('stolpersteine');
		});
	});

	describe('clearLayers', () => {
		it('leert activeLayerSlugs, lässt recentLayerSlugs unangetastet', () => {
			const s = makeState();
			s.activeLayerSlugs = ['bezirke', 'plz'];
			s.recentLayerSlugs = ['plz', 'bezirke'];
			clearLayers(s);
			expect(s.activeLayerSlugs).toEqual([]);
			expect(s.recentLayerSlugs).toEqual(['plz', 'bezirke']);
		});
	});

	describe('bookmarks (Story 1.26)', () => {
		it('initial: leeres bookmarks-Array + Dialog zu', () => {
			const s = makeState();
			expect(s.bookmarks).toEqual([]);
			expect(s.bookmarksDialogOpen).toBe(false);
		});

		it('addBookmark fügt Bookmark hinzu, returns true', () => {
			const s = makeState();
			const ok = addBookmark(s, makeBookmark());
			expect(ok).toBe(true);
			expect(s.bookmarks).toHaveLength(1);
		});

		it('addBookmark Dedup (gleiche lat/lng): returns false, kein Add', () => {
			const s = makeState();
			addBookmark(s, makeBookmark({ id: '11111111-1111-4111-8111-111111111111' }));
			const ok = addBookmark(
				s,
				makeBookmark({ id: '22222222-2222-4222-8222-222222222222', lat: 52.5, lng: 13.4 })
			);
			expect(ok).toBe(false);
			expect(s.bookmarks).toHaveLength(1);
		});

		it('addBookmark Quota (>50): returns false', () => {
			const s = makeState();
			for (let i = 0; i < 50; i++) {
				const id = `${i.toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`;
				addBookmark(s, makeBookmark({ id, lat: 52.5 + i * 0.001, lng: 13.4 }));
			}
			const ok = addBookmark(
				s,
				makeBookmark({ id: 'ffffffff-1111-4111-8111-111111111111', lat: 52.6, lng: 13.5 })
			);
			expect(ok).toBe(false);
			expect(s.bookmarks).toHaveLength(50);
		});

		it('removeBookmark entfernt nach ID', () => {
			const s = makeState();
			const bm = makeBookmark();
			addBookmark(s, bm);
			removeBookmark(s, bm.id);
			expect(s.bookmarks).toHaveLength(0);
		});

		it('clearBookmarks leert Liste', () => {
			const s = makeState();
			addBookmark(s, makeBookmark());
			clearBookmarks(s);
			expect(s.bookmarks).toEqual([]);
		});
	});

	describe('compare-mode (Story 1.27)', () => {
		it('initial: compareMode=false, alle Compare-Felder leer/null', () => {
			const s = makeState();
			expect(s.compareMode).toBe(false);
			expect(s.comparisonAddress).toBeNull();
			expect(s.comparisonLayerHits).toEqual([]);
			expect(s.comparisonClimateStation).toBeNull();
			expect(s.comparisonClimateSeries).toBeNull();
			expect(s.comparisonLoading).toBe(false);
		});

		it('toggleCompareMode aktiviert Modus (false → true)', () => {
			const s = makeState();
			toggleCompareMode(s);
			expect(s.compareMode).toBe(true);
		});

		it('toggleCompareMode deaktiviert Modus und clearant alle Compare-Felder', () => {
			const s = makeState();
			s.compareMode = true;
			s.comparisonAddress = makeAddress();
			s.comparisonLayerHits = [
				{ layer: 'bezirke', value: 'Mitte', source: 'x', updatedAt: '2024-01-01', license: 'CC BY 4.0' } as LayerHit
			];
			s.comparisonClimateStation = { id: 's1', name: 'Dahlem', coordinates: [13.3, 52.5], firstYear: 1950 } as ClimateStation;
			s.comparisonClimateSeries = { stationId: 's1' } as unknown as ClimateData;
			s.comparisonLoading = true;
			toggleCompareMode(s);
			expect(s.compareMode).toBe(false);
			expect(s.comparisonAddress).toBeNull();
			expect(s.comparisonLayerHits).toEqual([]);
			expect(s.comparisonClimateStation).toBeNull();
			expect(s.comparisonClimateSeries).toBeNull();
			expect(s.comparisonLoading).toBe(false);
		});

		it('setComparisonAddress(addr) setzt Adresse', () => {
			const s = makeState();
			const addr = makeAddress();
			setComparisonAddress(s, addr);
			expect(s.comparisonAddress).toBe(addr);
		});

		it('setComparisonAddress(null) leert Adresse + abhängige Daten', () => {
			const s = makeState();
			s.comparisonAddress = makeAddress();
			s.comparisonLayerHits = [
				{ layer: 'bezirke', value: 'Mitte', source: 'x', updatedAt: '2024-01-01', license: 'CC BY 4.0' } as LayerHit
			];
			s.comparisonClimateStation = { id: 's1', name: 'Dahlem', coordinates: [13.3, 52.5], firstYear: 1950 } as ClimateStation;
			s.comparisonClimateSeries = { stationId: 's1' } as unknown as ClimateData;
			setComparisonAddress(s, null);
			expect(s.comparisonAddress).toBeNull();
			expect(s.comparisonLayerHits).toEqual([]);
			expect(s.comparisonClimateStation).toBeNull();
			expect(s.comparisonClimateSeries).toBeNull();
		});

		it('setComparisonAddress(neuAddr) ersetzt Adresse und leert Layer-Hits/Klima (Re-Fetch-Trigger)', () => {
			const s = makeState();
			const addrA = makeAddress({ id: 'a', displayName: 'A' });
			const addrB = makeAddress({ id: 'b', displayName: 'B' });
			setComparisonAddress(s, addrA);
			s.comparisonLayerHits = [
				{ layer: 'bezirke', value: 'Mitte', source: 'x', updatedAt: '2024-01-01', license: 'CC BY 4.0' } as LayerHit
			];
			setComparisonAddress(s, addrB);
			expect(s.comparisonAddress).toBe(addrB);
			expect(s.comparisonLayerHits).toEqual([]);
		});

		it('exitCompareMode setzt compareMode=false und clearant alle Compare-Felder', () => {
			const s = makeState();
			s.compareMode = true;
			s.comparisonAddress = makeAddress();
			s.comparisonLayerHits = [
				{ layer: 'bezirke', value: 'Mitte', source: 'x', updatedAt: '2024-01-01', license: 'CC BY 4.0' } as LayerHit
			];
			s.comparisonLoading = true;
			exitCompareMode(s);
			expect(s.compareMode).toBe(false);
			expect(s.comparisonAddress).toBeNull();
			expect(s.comparisonLayerHits).toEqual([]);
			expect(s.comparisonLoading).toBe(false);
		});

		it('comparisonLoading kann manuell toggled werden für Skeleton-State', () => {
			const s = makeState();
			s.comparisonLoading = true;
			expect(s.comparisonLoading).toBe(true);
			s.comparisonLoading = false;
			expect(s.comparisonLoading).toBe(false);
		});
	});
});
