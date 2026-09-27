import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { m } from '$lib/paraglide/messages.js';
import MapLibreCanvas from './map-libre-canvas.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
	vi.useRealTimers();
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

	// i18n Block C1: loadError-Block (Timeout-/Unbekannter-Fehler-Text +
	// Reload-Button) folgt jetzt der Seiten-Locale statt hart Deutsch zu sein.
	describe('loadError-Block Messages (i18n Block C1)', () => {
		it('DE-Texte für Timeout, unbekannten Fehler und Reload-Button', () => {
			expect(m.map_load_error_timeout({}, { locale: 'de' })).toBe(
				'Karte konnte nicht geladen werden. Bitte Seite neu laden.'
			);
			expect(m.map_load_error_unknown({}, { locale: 'de' })).toBe('Unbekannter Karten-Fehler');
			expect(m.map_load_error_reload_button({}, { locale: 'de' })).toBe('Neu laden');
		});

		it('EN-Texte für Timeout, unbekannten Fehler und Reload-Button', () => {
			expect(m.map_load_error_timeout({}, { locale: 'en' })).toBe(
				'Map could not be loaded. Please reload the page.'
			);
			expect(m.map_load_error_unknown({}, { locale: 'en' })).toBe('Unknown map error');
			expect(m.map_load_error_reload_button({}, { locale: 'en' })).toBe('Reload');
		});
	});

	// Review-Fund (i18n Block C1): den Timeout-Pfad tatsaechlich rendern statt
	// nur die Message-Auflösung isoliert zu pruefen. Ein absichtlich
	// nicht-existenter `styleUrl` laesst MapLibres `load`-Event nie feuern
	// (deterministisch, unabhaengig von echten Netzwerk-/WebGL-Timings) --
	// `isReady` bleibt fuer immer `false`, der Timeout-Pfad greift garantiert.
	// `document.hidden` wird explizit auf `false` gestubbt (der Timeout-
	// Handler ueberspringt die Fehlermeldung sonst in einem versteckten Tab,
	// siehe Komponenten-Kommentar), Fake-Timer ueberspringen die echten 5s.
	describe('loadError-Block gerendert (i18n Block C1)', () => {
		const UNREACHABLE_STYLE_URL = '/this-style-does-not-exist.json';

		function stubDocumentVisible(): () => void {
			const original = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
			Object.defineProperty(document, 'hidden', { value: false, configurable: true });
			return () => {
				if (original) Object.defineProperty(Document.prototype, 'hidden', original);
				else delete (document as unknown as Record<string, unknown>).hidden;
			};
		}

		it('DE: Timeout-Alert + Reload-Button deutsch', async () => {
			const restore = stubDocumentVisible();
			vi.useFakeTimers();
			render(MapLibreCanvas, { styleUrl: UNREACHABLE_STYLE_URL });
			await vi.advanceTimersByTimeAsync(5000);
			vi.useRealTimers();
			const alert = page.getByRole('alert');
			await expect.element(alert).toBeInTheDocument();
			await expect
				.element(alert)
				.toHaveTextContent('Karte konnte nicht geladen werden. Bitte Seite neu laden.');
			await expect.element(page.getByRole('button', { name: 'Neu laden' })).toBeInTheDocument();
			restore();
		});

		it('EN: Timeout-Alert + Reload-Button englisch', async () => {
			overwriteGetLocale(() => 'en');
			const restore = stubDocumentVisible();
			vi.useFakeTimers();
			render(MapLibreCanvas, { styleUrl: UNREACHABLE_STYLE_URL });
			await vi.advanceTimersByTimeAsync(5000);
			vi.useRealTimers();
			const alert = page.getByRole('alert');
			await expect.element(alert).toBeInTheDocument();
			await expect
				.element(alert)
				.toHaveTextContent('Map could not be loaded. Please reload the page.');
			await expect.element(page.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
			restore();
		});
	});
});
