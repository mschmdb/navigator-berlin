import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MapLibreCanvas from './map-libre-canvas.svelte';

describe('map-libre-canvas.svelte', () => {
	it('rendert Container mit role=application + tabindex=0 + aria-describedby', async () => {
		render(MapLibreCanvas, {});
		const app = page.getByRole('application');
		await expect.element(app).toBeInTheDocument();
		const el = (await app.element()) as HTMLDivElement;
		expect(el.getAttribute('tabindex')).toBe('0');
		expect(el.getAttribute('aria-describedby')).toBe('map-help');
	});

	it('rendert Skeleton-Fallback initial bevor map loaded', async () => {
		render(MapLibreCanvas, {});
		await expect.element(page.getByTestId('map-skeleton')).toBeInTheDocument();
	});

	it('rendert sr-only map-help + map-status A11y-Hooks', async () => {
		render(MapLibreCanvas, {});
		const help = page.getByText(/Pfeiltasten zum Verschieben/);
		await expect.element(help).toBeInTheDocument();
		const helpEl = (await help.element()) as HTMLElement;
		expect(helpEl.id).toBe('map-help');
		expect(helpEl.className).toMatch(/sr-only/);
		const status = (await page.getByTestId('map-status').element()) as HTMLElement;
		expect(status.getAttribute('aria-live')).toBe('polite');
	});
});
