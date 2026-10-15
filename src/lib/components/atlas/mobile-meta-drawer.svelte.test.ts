import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import MobileMetaDrawer from './mobile-meta-drawer.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('mobile-meta-drawer.svelte', () => {
	it('rendert geschlossen nichts', async () => {
		render(MobileMetaDrawer, { open: false, onClose: () => {} });
		await expect.element(page.getByTestId('mobile-meta-drawer')).not.toBeInTheDocument();
	});

	it('DE: Ueberschrift, Meta-Navigation-Landmark und Kontakt-Link', async () => {
		render(MobileMetaDrawer, { open: true, onClose: () => {} });
		await expect.element(page.getByTestId('mobile-meta-drawer')).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Menü' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('navigation', { name: 'Meta-Navigation' }))
			.toBeInTheDocument();
		const kontakt = page.getByRole('link', { name: 'Kontakt' });
		const el = (await kontakt.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toMatch(/^mailto:/);
	});

	// i18n Block B2, Entscheidung 1A: Shell (Drawer) ist auf jeder /en-Seite
	// englisch, auch auf nicht uebersetzten.
	it('EN: Ueberschrift, Navigation-Label, Links und Kontakt sind englisch/lokalisiert', async () => {
		overwriteGetLocale(() => 'en');
		render(MobileMetaDrawer, { open: true, onClose: () => {} });
		await expect.element(page.getByRole('heading', { name: 'Menu' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('navigation', { name: 'Meta navigation' }))
			.toBeInTheDocument();
		const methodik = page.getByRole('link', { name: 'Methodology' });
		const el = (await methodik.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('/en/methodik');
		const kontakt = page.getByRole('link', { name: 'Contact' });
		const kontaktEl = (await kontakt.element()) as HTMLAnchorElement;
		expect(kontaktEl.getAttribute('href')).toMatch(/^mailto:/);
	});

	it('EN: Close-Button hat englisches aria-label', async () => {
		overwriteGetLocale(() => 'en');
		render(MobileMetaDrawer, { open: true, onClose: () => {} });
		const close = (await page.getByTestId('mobile-meta-drawer-close').element()) as HTMLElement;
		expect(close.getAttribute('aria-label')).toBe('Close menu');
	});

	it('S7: zeigt die drei Übersichtsseiten, DE und EN', async () => {
		render(MobileMetaDrawer, { open: true, onClose: () => {} });
		for (const [name, href] of [
			['Alle Kieze', '/kieze'],
			['Alle Bezirke', '/bezirke'],
			['Daten-Layer', '/daten']
		] as const) {
			const el = (await page.getByRole('link', { name }).element()) as HTMLAnchorElement;
			expect(el.getAttribute('href')).toBe(href);
		}
	});

	it('S7: EN-Drawer führt die Übersichtsseiten unter /en', async () => {
		overwriteGetLocale(() => 'en');
		render(MobileMetaDrawer, { open: true, onClose: () => {} });
		for (const [name, href] of [
			['All Kieze', '/en/kieze'],
			['All Bezirke', '/en/bezirke'],
			['Data layers', '/en/daten']
		] as const) {
			const el = (await page.getByRole('link', { name }).element()) as HTMLAnchorElement;
			expect(el.getAttribute('href')).toBe(href);
		}
	});
});
