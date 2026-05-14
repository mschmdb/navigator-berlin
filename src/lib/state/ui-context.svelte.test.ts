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
	type UiState
} from './ui-context.svelte.js';

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
		hiddenLayerSlugs: []
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
});
