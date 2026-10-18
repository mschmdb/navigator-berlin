import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import SiteMenu from './site-menu.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const OCT = new Date(2026, 9, 17);
const JUL = new Date(2026, 6, 10);

describe('site-menu.svelte', () => {
	it('rendert geschlossen nichts', async () => {
		render(SiteMenu, { open: false, onClose: () => {}, now: OCT, currentPath: '/' });
		await expect.element(page.getByTestId('site-menu')).not.toBeInTheDocument();
	});

	it('ist ein modaler Dialog mit Überschrift „Menü“', async () => {
		render(SiteMenu, { open: true, onClose: () => {}, now: OCT, currentPath: '/' });
		const dialog = page.getByRole('dialog', { name: 'Menü' });
		await expect.element(dialog).toBeInTheDocument();
		const el = (await dialog.element()) as HTMLElement;
		expect(el.getAttribute('aria-modal')).toBe('true');
	});

	it('zeigt die vier Gruppen', async () => {
		render(SiteMenu, { open: true, onClose: () => {}, now: OCT, currentPath: '/' });
		for (const name of ['Entdecken', 'Vergleichen', 'Saison', 'Daten und Projekt']) {
			await expect.element(page.getByRole('heading', { name, exact: true })).toBeInTheDocument();
		}
	});

	it('Einträge tragen die abgenommenen Kurztexte', async () => {
		render(SiteMenu, { open: true, onClose: () => {}, now: OCT, currentPath: '/' });
		const finder = page.getByRole('link', { name: /Kiez-Finder/ });
		const el = (await finder.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('/explore?finder=1');
		expect(el.textContent).toContain(
			'Du suchst einen leisen Kiez mit viel Grün in Berlin? Hier findest du ihn.'
		);
		await expect
			.element(page.getByText('Alle offenen Daten zu jedem Punkt in Berlin'))
			.toBeInTheDocument();
	});

	it('Saison-Reihenfolge: im Oktober Kälte vor Hitze, im Juli umgekehrt', async () => {
		const { unmount } = render(SiteMenu, {
			open: true,
			onClose: () => {},
			now: OCT,
			currentPath: '/'
		});
		let links = (await page.getByTestId('site-menu-group-saison').element()).querySelectorAll('a');
		expect(links[0].getAttribute('href')).toBe('/kaelte');
		unmount();
		render(SiteMenu, { open: true, onClose: () => {}, now: JUL, currentPath: '/' });
		links = (await page.getByTestId('site-menu-group-saison').element()).querySelectorAll('a');
		expect(links[0].getAttribute('href')).toBe('/hitze');
	});

	it('markiert den aktuellen Bereich mit aria-current', async () => {
		render(SiteMenu, { open: true, onClose: () => {}, now: OCT, currentPath: '/methodik' });
		const el = (await page.getByRole('link', { name: 'Methodik' }).element()) as HTMLElement;
		expect(el.getAttribute('aria-current')).toBe('page');
		const karte = (await page.getByRole('link', { name: /^Karte/ }).element()) as HTMLElement;
		expect(karte.getAttribute('aria-current')).toBeNull();
	});

	it('Escape schließt das Menü', async () => {
		let closed = 0;
		render(SiteMenu, { open: true, onClose: () => closed++, now: OCT, currentPath: '/' });
		await userEvent.keyboard('{Escape}');
		expect(closed).toBe(1);
	});

	it('Klick auf das Overlay schließt das Menü', async () => {
		let closed = 0;
		render(SiteMenu, { open: true, onClose: () => closed++, now: OCT, currentPath: '/' });
		const overlay = (await page.getByTestId('site-menu-backdrop').element()) as HTMLElement;
		overlay.click();
		expect(closed).toBe(1);
	});

	it('Fokus landet beim Öffnen im Panel und bleibt darin (Tab am Ende springt zum Anfang)', async () => {
		render(SiteMenu, { open: true, onClose: () => {}, now: OCT, currentPath: '/' });
		const panel = (await page.getByTestId('site-menu').element()) as HTMLElement;
		await expect.poll(() => panel.contains(document.activeElement)).toBe(true);
		const focusables = panel.querySelectorAll<HTMLElement>('a[href], button');
		focusables[focusables.length - 1].focus();
		await userEvent.keyboard('{Tab}');
		expect(document.activeElement).toBe(focusables[0]);
		await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
		expect(document.activeElement).toBe(focusables[focusables.length - 1]);
	});

	it('hält Rechtliches und Kontakt erreichbar', async () => {
		render(SiteMenu, { open: true, onClose: () => {}, now: OCT, currentPath: '/' });
		for (const name of ['Impressum', 'Datenschutz', 'Lizenzen']) {
			await expect.element(page.getByRole('link', { name, exact: true })).toBeInTheDocument();
		}
		const kontakt = (await page.getByRole('link', { name: 'Kontakt' }).element()) as HTMLElement;
		expect(kontakt.getAttribute('href')).toMatch(/^mailto:/);
	});

	it('Navigation und Rechtliches scrollen gemeinsam (Reflow bei geringer Höhe)', async () => {
		render(SiteMenu, { open: true, onClose: () => {}, now: OCT, currentPath: '/' });
		const scroll = (await page.getByTestId('site-menu-scroll').element()) as HTMLElement;
		expect(scroll.className).toMatch(/overflow-y-auto/);
		const impressum = (await page
			.getByRole('link', { name: 'Impressum', exact: true })
			.element()) as HTMLElement;
		expect(scroll.contains(impressum)).toBe(true);
	});

	it('EN: englische Texte und /en-Links', async () => {
		overwriteGetLocale(() => 'en');
		render(SiteMenu, { open: true, onClose: () => {}, now: OCT, currentPath: '/en' });
		await expect.element(page.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
		const el = (await page.getByRole('link', { name: /^Map/ }).element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('/en/explore');
		const close = (await page.getByTestId('site-menu-close').element()) as HTMLElement;
		expect(close.getAttribute('aria-label')).toBe('Close menu');
	});
});
