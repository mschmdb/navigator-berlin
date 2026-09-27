import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import BookmarkRow from './bookmark-row.svelte';
import type { Bookmark } from '$lib/state/bookmark-schema.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

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

describe('bookmark-row', () => {
	it('rendert Primary-Name + Subtext', async () => {
		render(BookmarkRow, {
			bookmark: makeBookmark(),
			onSelect: vi.fn(),
			onConfirmDelete: vi.fn()
		});
		const row = (await page.getByTestId('bookmark-row').element()) as HTMLElement;
		expect(row.textContent).toContain('Pankow');
		expect(row.textContent).toContain('10405');
	});

	it('Select-Click ruft onSelect', async () => {
		const onSelect = vi.fn();
		render(BookmarkRow, { bookmark: makeBookmark(), onSelect, onConfirmDelete: vi.fn() });
		await page.getByTestId('bookmark-select').click();
		expect(onSelect).toHaveBeenCalledTimes(1);
	});

	it('Delete-Click zeigt Inline-Confirm, Confirm ruft onConfirmDelete', async () => {
		const onConfirmDelete = vi.fn();
		const bm = makeBookmark();
		render(BookmarkRow, { bookmark: bm, onSelect: vi.fn(), onConfirmDelete });
		await page.getByTestId('bookmark-delete').click();
		await expect.element(page.getByTestId('bookmark-confirm')).toBeInTheDocument();
		await page.getByTestId('bookmark-confirm-delete').click();
		expect(onConfirmDelete).toHaveBeenCalledWith(bm.id);
	});

	it('Cancel-Click verwirft den Confirm-State', async () => {
		render(BookmarkRow, { bookmark: makeBookmark(), onSelect: vi.fn(), onConfirmDelete: vi.fn() });
		await page.getByTestId('bookmark-delete').click();
		await page.getByTestId('bookmark-confirm-cancel').click();
		await expect.element(page.getByTestId('bookmark-confirm')).not.toBeInTheDocument();
	});

	it('Compare-Action nur sichtbar mit showCompareAction + onAddToCompare', async () => {
		const onAddToCompare = vi.fn();
		render(BookmarkRow, {
			bookmark: makeBookmark(),
			onSelect: vi.fn(),
			onConfirmDelete: vi.fn(),
			showCompareAction: true,
			onAddToCompare
		});
		await page.getByTestId('bookmark-compare').click();
		expect(onAddToCompare).toHaveBeenCalledTimes(1);
	});

	// i18n Block B3c: EN-Locale übersetzt Confirm-Frage, Buttons und Aria-Labels.
	describe('i18n Block B3c (EN)', () => {
		it('Confirm-Frage + Buttons englisch', async () => {
			overwriteGetLocale(() => 'en');
			render(BookmarkRow, {
				bookmark: makeBookmark(),
				onSelect: vi.fn(),
				onConfirmDelete: vi.fn()
			});
			await page.getByTestId('bookmark-delete').click();
			const confirm = (await page.getByTestId('bookmark-confirm').element()) as HTMLElement;
			expect(confirm.textContent).toContain('Delete this bookmark?');
			expect(confirm.getAttribute('aria-label')).toBe('Confirm bookmark deletion');
			const cancelBtn = (await page
				.getByTestId('bookmark-confirm-cancel')
				.element()) as HTMLElement;
			expect(cancelBtn.textContent?.trim()).toBe('Cancel');
			const deleteBtn = (await page
				.getByTestId('bookmark-confirm-delete')
				.element()) as HTMLElement;
			expect(deleteBtn.textContent?.trim()).toBe('Delete');
		});

		it('Aria-Labels für Delete + Compare englisch', async () => {
			overwriteGetLocale(() => 'en');
			const bm = makeBookmark({ displayName: 'Wörther Str. 11, 10405 Berlin' });
			render(BookmarkRow, {
				bookmark: bm,
				onSelect: vi.fn(),
				onConfirmDelete: vi.fn(),
				showCompareAction: true,
				onAddToCompare: vi.fn()
			});
			const deleteBtn = (await page.getByTestId('bookmark-delete').element()) as HTMLElement;
			expect(deleteBtn.getAttribute('aria-label')).toBe('Delete "Wörther Str. 11"');
			const compareBtn = (await page.getByTestId('bookmark-compare').element()) as HTMLElement;
			expect(compareBtn.getAttribute('aria-label')).toBe('Add "Wörther Str. 11" to comparison');
		});
	});
});
