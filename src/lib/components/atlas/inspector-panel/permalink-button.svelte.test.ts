import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PermalinkButton from './permalink-button.svelte';

describe('permalink-button.svelte', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('rendert Button mit Label', async () => {
		render(PermalinkButton, { onCopy: async () => {} });
		await expect.element(page.getByTestId('permalink-button')).toBeInTheDocument();
	});

	it('Click ruft onCopy auf', async () => {
		const onCopy = vi.fn(async () => {});
		render(PermalinkButton, { onCopy });
		await page.getByTestId('permalink-button').click();
		expect(onCopy).toHaveBeenCalledTimes(1);
	});

	it('zeigt "URL kopiert" Status nach erfolgreichem Copy', async () => {
		render(PermalinkButton, { onCopy: async () => {} });
		await page.getByTestId('permalink-button').click();
		const status = (await page.getByTestId('permalink-status').element()) as HTMLElement;
		expect(status.textContent?.trim()).toBe('URL kopiert');
	});

	it('Status hat aria-live="polite"', async () => {
		render(PermalinkButton, { onCopy: async () => {} });
		const status = (await page.getByTestId('permalink-status').element()) as HTMLElement;
		expect(status.getAttribute('aria-live')).toBe('polite');
	});

	it('Status verschwindet nach 2s', async () => {
		render(PermalinkButton, { onCopy: async () => {} });
		await page.getByTestId('permalink-button').click();
		await vi.advanceTimersByTimeAsync(2100);
		const status = (await page.getByTestId('permalink-status').element()) as HTMLElement;
		expect(status.textContent?.trim()).toBe('');
	});

	it('Fehler in onCopy zeigt keinen Status', async () => {
		const onCopy = vi.fn(async () => {
			throw new Error('boom');
		});
		render(PermalinkButton, { onCopy });
		await page.getByTestId('permalink-button').click();
		const status = (await page.getByTestId('permalink-status').element()) as HTMLElement;
		expect(status.textContent?.trim()).toBe('');
	});
});
