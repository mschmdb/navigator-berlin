import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { mount, unmount } from 'svelte';
import UiContextProbe from './ui-context-probe.svelte';
import MissingProvider from './ui-context-missing-provider.svelte';
import { createUiState, getUiState } from './ui-context.svelte.js';

describe('ui-context', () => {
	it('createUiState initialisiert Default-State', async () => {
		const screen = render(UiContextProbe);
		const dump = (await screen.getByTestId('dump').element()) as HTMLElement;
		const state = JSON.parse(dump.textContent ?? '{}');
		expect(state.inspectorOpen).toBe(false);
		expect(state.selectedAddress).toBeNull();
		expect(state.selectedLayerHits).toEqual([]);
		expect(state.activeLayerSlugs).toEqual([]);
		expect(state.sheetSnapVh).toBe(40);
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
});
