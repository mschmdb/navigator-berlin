import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import MapLibreCanvas from './map-libre-canvas.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

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

	it('rendert sr-only map-help A11y-Hook', async () => {
		render(MapLibreCanvas, {});
		const help = page.getByText(/Pfeiltasten zum Verschieben/);
		await expect.element(help).toBeInTheDocument();
		const helpEl = (await help.element()) as HTMLElement;
		expect(helpEl.id).toBe('map-help');
		expect(helpEl.className).toMatch(/sr-only/);
	});

	it('rendert KEIN lokales map-status div (globale Live-Region in +layout.svelte)', async () => {
		render(MapLibreCanvas, {});
		await expect.element(page.getByTestId('map-status')).not.toBeInTheDocument();
	});

	it('Help-Text deckt Home + Tab + Enter + Escape + Layer-Hinweis ab', async () => {
		render(MapLibreCanvas, {});
		const helpEl = (await page.getByText(/Pfeiltasten zum Verschieben/).element()) as HTMLElement;
		const txt = helpEl.textContent ?? '';
		expect(txt).toMatch(/Home/);
		expect(txt).toMatch(/Tab/);
		expect(txt).toMatch(/Enter/);
		expect(txt).toMatch(/Escape/);
		expect(txt).toMatch(/Bezirke|Stolperstein|Lärm/);
	});

	// i18n Block B3c: EN-Locale übersetzt die sr-only-Kartenbeschreibung.
	it('EN: sr-only-Beschreibung englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(MapLibreCanvas, {});
		const help = page.getByText(/Arrow keys to pan/);
		await expect.element(help).toBeInTheDocument();
		const helpEl = (await help.element()) as HTMLElement;
		expect(helpEl.id).toBe('map-help');
		expect(helpEl.textContent).toMatch(/Home|Tab|Enter|Escape/);
	});
});
