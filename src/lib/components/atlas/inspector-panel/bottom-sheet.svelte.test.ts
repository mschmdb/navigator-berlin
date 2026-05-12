import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import BottomSheet from './bottom-sheet.svelte';

const body = createRawSnippet(() => ({ render: () => '<p>SheetContent</p>' }));

describe('bottom-sheet.svelte', () => {
	it('rendert nicht, wenn open=false', async () => {
		render(BottomSheet, {
			open: false,
			snapVh: 40,
			onSnap: () => {},
			onClose: () => {},
			children: body
		});
		await expect.element(page.getByTestId('bottom-sheet')).not.toBeInTheDocument();
	});

	it('rendert mit role="dialog" wenn open=true', async () => {
		render(BottomSheet, {
			open: true,
			snapVh: 40,
			onSnap: () => {},
			onClose: () => {},
			children: body
		});
		const el = (await page.getByTestId('bottom-sheet').element()) as HTMLElement;
		expect(el.getAttribute('role')).toBe('dialog');
		expect(el.getAttribute('aria-label')).toBe('Inspektor-Panel');
	});

	it('Höhe entspricht snapVh', async () => {
		render(BottomSheet, {
			open: true,
			snapVh: 70,
			onSnap: () => {},
			onClose: () => {},
			children: body
		});
		const el = (await page.getByTestId('bottom-sheet').element()) as HTMLElement;
		expect((el.getAttribute('style') ?? '').replace(/\s+/g, '')).toContain('height:70vh');
		expect(el.getAttribute('data-snap-vh')).toBe('70');
	});

	it('Expand-Button cycled 40 → 70', async () => {
		const onSnap = vi.fn();
		render(BottomSheet, {
			open: true,
			snapVh: 40,
			onSnap,
			onClose: () => {},
			children: body
		});
		await page.getByTestId('sheet-expand').click();
		expect(onSnap).toHaveBeenCalledWith(70);
	});

	it('Expand-Button cycled 70 → 100', async () => {
		const onSnap = vi.fn();
		render(BottomSheet, {
			open: true,
			snapVh: 70,
			onSnap,
			onClose: () => {},
			children: body
		});
		await page.getByTestId('sheet-expand').click();
		expect(onSnap).toHaveBeenCalledWith(100);
	});

	it('Expand-Button wraparound 100 → 40', async () => {
		const onSnap = vi.fn();
		render(BottomSheet, {
			open: true,
			snapVh: 100,
			onSnap,
			onClose: () => {},
			children: body
		});
		await page.getByTestId('sheet-expand').click();
		expect(onSnap).toHaveBeenCalledWith(40);
	});

	it('Shrink-Button cycled 70 → 40', async () => {
		const onSnap = vi.fn();
		render(BottomSheet, {
			open: true,
			snapVh: 70,
			onSnap,
			onClose: () => {},
			children: body
		});
		await page.getByTestId('sheet-shrink').click();
		expect(onSnap).toHaveBeenCalledWith(40);
	});

	it('Escape ruft onClose', async () => {
		const onClose = vi.fn();
		render(BottomSheet, {
			open: true,
			snapVh: 40,
			onSnap: () => {},
			onClose,
			children: body
		});
		const el = (await page.getByTestId('bottom-sheet').element()) as HTMLElement;
		el.focus();
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
