import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Harness from './bookmark-dialog-harness.svelte';
import type { Bookmark } from '$lib/state/bookmark-schema.js';
import type { GeocodeSuggestion } from '$lib/data';

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
	return {
		id: '11111111-1111-4111-8111-111111111111',
		displayName: 'Wörther Str. 11, 10405 Berlin',
		lat: 52.535,
		lng: 13.418,
		bezirk: 'Pankow',
		postcode: '10405',
		createdAt: '2026-05-15T10:00:00.000Z',
		...overrides
	};
}

function makeSuggestion(overrides: Partial<GeocodeSuggestion> = {}): GeocodeSuggestion {
	return {
		id: 'osm:42',
		displayName: 'Neue Straße 7, 10115 Berlin',
		lat: 52.53,
		lng: 13.4,
		type: 'address',
		addresstype: 'building',
		bezirk: 'Mitte',
		postcode: '10115',
		...overrides
	};
}

describe('bookmark-dialog', () => {
	it('rendert empty-State wenn keine Bookmarks', async () => {
		render(Harness, { open: true });
		await expect.element(page.getByTestId('bookmark-empty')).toBeInTheDocument();
		await expect.element(page.getByTestId('bookmark-list')).not.toBeInTheDocument();
	});

	it('rendert Bookmark-Liste sortiert nach createdAt desc', async () => {
		const older = makeBookmark({
			id: '11111111-1111-4111-8111-111111111111',
			createdAt: '2026-05-10T10:00:00.000Z',
			displayName: 'Older'
		});
		const newer = makeBookmark({
			id: '22222222-2222-4222-8222-222222222222',
			createdAt: '2026-05-14T10:00:00.000Z',
			displayName: 'Newer',
			lat: 52.54,
			lng: 13.41
		});
		render(Harness, { open: true, initialBookmarks: [older, newer] });
		const rows = await page.getByTestId('bookmark-row').all();
		expect(rows).toHaveLength(2);
		const first = (await rows[0].element()) as HTMLElement;
		expect(first.getAttribute('data-bookmark-id')).toBe(newer.id);
	});

	it('zeigt Save-Action wenn selectedAddress nicht gespeichert', async () => {
		render(Harness, { open: true, selectedAddress: makeSuggestion() });
		await expect.element(page.getByTestId('bookmark-save')).toBeInTheDocument();
	});

	it('versteckt Save-Action wenn Adresse bereits Bookmark', async () => {
		const bm = makeBookmark({ lat: 52.53, lng: 13.4 });
		const sugg = makeSuggestion({ lat: 52.53, lng: 13.4 });
		render(Harness, { open: true, initialBookmarks: [bm], selectedAddress: sugg });
		await expect.element(page.getByTestId('bookmark-current-saved')).toBeInTheDocument();
		await expect.element(page.getByTestId('bookmark-save')).not.toBeInTheDocument();
	});

	it('Save-Click fügt Bookmark hinzu + Konfirmations-State', async () => {
		render(Harness, { open: true, selectedAddress: makeSuggestion() });
		await page.getByTestId('bookmark-save').click();
		await expect.element(page.getByTestId('bookmark-save-confirmation')).toBeInTheDocument();
		await expect.element(page.getByTestId('bookmark-list')).toBeInTheDocument();
	});

	it('Delete-Click triggert Inline-Confirm-State', async () => {
		const bm = makeBookmark();
		render(Harness, { open: true, initialBookmarks: [bm] });
		await page.getByTestId('bookmark-delete').click();
		await expect.element(page.getByTestId('bookmark-confirm')).toBeInTheDocument();
		await expect.element(page.getByTestId('bookmark-confirm-delete')).toBeInTheDocument();
		await expect.element(page.getByTestId('bookmark-confirm-cancel')).toBeInTheDocument();
	});

	it('Confirm-Delete entfernt Bookmark', async () => {
		const bm = makeBookmark();
		render(Harness, { open: true, initialBookmarks: [bm] });
		await page.getByTestId('bookmark-delete').click();
		await page.getByTestId('bookmark-confirm-delete').click();
		await expect.element(page.getByTestId('bookmark-empty')).toBeInTheDocument();
	});

	it('Cancel-Delete restored Bookmark', async () => {
		const bm = makeBookmark();
		render(Harness, { open: true, initialBookmarks: [bm] });
		await page.getByTestId('bookmark-delete').click();
		await page.getByTestId('bookmark-confirm-cancel').click();
		await expect.element(page.getByTestId('bookmark-row')).toBeInTheDocument();
		await expect.element(page.getByTestId('bookmark-confirm')).not.toBeInTheDocument();
	});

	it('Select-Click setzt selection.current + schließt Dialog', async () => {
		const bm = makeBookmark();
		render(Harness, { open: true, initialBookmarks: [bm] });
		await page.getByTestId('bookmark-select').click();
		const dump = (await page.getByTestId('ui-dump').element()) as HTMLElement;
		const state = JSON.parse(dump.textContent ?? '{}');
		expect(state.open).toBe(false);
		expect(state.selectedId).toBe(`bookmark:${bm.id}`);
	});

	it('Compare-Action sichtbar wenn showCompareAction=true', async () => {
		const bm = makeBookmark();
		render(Harness, {
			open: true,
			initialBookmarks: [bm],
			showCompareAction: true
		});
		await expect.element(page.getByTestId('bookmark-compare')).toBeInTheDocument();
	});

	it('Compare-Action versteckt wenn showCompareAction=false', async () => {
		const bm = makeBookmark();
		render(Harness, { open: true, initialBookmarks: [bm], showCompareAction: false });
		await expect.element(page.getByTestId('bookmark-compare')).not.toBeInTheDocument();
	});

	it('Row-Click in showCompareAction-Mode ruft onCompareSelect (Story 1.27)', async () => {
		const bm = makeBookmark();
		render(Harness, {
			open: true,
			initialBookmarks: [bm],
			showCompareAction: true
		});
		await page.getByTestId('bookmark-select').click();
		const dump = (await page.getByTestId('ui-dump').element()) as HTMLElement;
		const state = JSON.parse(dump.textContent ?? '{}');
		expect(state.comparePicks).toContain(bm.id);
		expect(state.selectedId).toBeNull();
		expect(state.open).toBe(false);
	});

	it('Counter zeigt Anzahl/MAX', async () => {
		render(Harness, { open: true, initialBookmarks: [makeBookmark()] });
		const counter = (await page.getByTestId('bookmark-counter').element()) as HTMLElement;
		expect(counter.textContent?.trim()).toBe('1/50');
	});

	it('Datenschutz-Link verweist auf /datenschutz#bookmarks', async () => {
		render(Harness, { open: true });
		const link = (await page
			.getByTestId('bookmark-privacy-link')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/datenschutz#bookmarks');
	});

	it('Dialog hat aria-modal + aria-labelledby', async () => {
		render(Harness, { open: true });
		const dialog = (await page.getByTestId('bookmark-dialog').element()) as HTMLElement;
		expect(dialog.getAttribute('role')).toBe('dialog');
		expect(dialog.getAttribute('aria-modal')).toBe('true');
		expect(dialog.getAttribute('aria-labelledby')).toBe('bookmarks-dialog-title');
	});

	it('limit-reached state versteckt Save + zeigt Hinweis', async () => {
		const many: Bookmark[] = [];
		for (let i = 0; i < 50; i++) {
			const idHex = i.toString(16).padStart(8, '0');
			many.push(
				makeBookmark({
					id: `${idHex}-1111-4111-8111-111111111111`,
					lat: 52.4 + i * 0.001,
					lng: 13.4,
					displayName: `Adresse ${i}`,
					createdAt: `2026-05-${(i % 28) + 1}T10:00:00.000Z`
				})
			);
		}
		const sugg = makeSuggestion({ lat: 52.6, lng: 13.5 });
		render(Harness, { open: true, initialBookmarks: many, selectedAddress: sugg });
		await expect.element(page.getByTestId('bookmark-limit-reached')).toBeInTheDocument();
		await expect.element(page.getByTestId('bookmark-save')).not.toBeInTheDocument();
	});

	it('Clear-All zeigt Inline-Confirm', async () => {
		const bm = makeBookmark();
		render(Harness, { open: true, initialBookmarks: [bm] });
		await page.getByTestId('bookmark-clear-all').click();
		await expect.element(page.getByTestId('bookmark-clear-all-confirm')).toBeInTheDocument();
		await expect.element(page.getByTestId('bookmark-clear-all-cancel')).toBeInTheDocument();
	});

	it('Clear-All confirm leert Liste', async () => {
		const bm1 = makeBookmark({ id: '11111111-1111-4111-8111-111111111111' });
		const bm2 = makeBookmark({
			id: '22222222-2222-4222-8222-222222222222',
			lat: 52.54,
			lng: 13.41
		});
		render(Harness, { open: true, initialBookmarks: [bm1, bm2] });
		await page.getByTestId('bookmark-clear-all').click();
		await page.getByTestId('bookmark-clear-all-confirm').click();
		await expect.element(page.getByTestId('bookmark-empty')).toBeInTheDocument();
	});
});
