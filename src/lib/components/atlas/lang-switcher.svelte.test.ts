import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import LangSwitcher from './lang-switcher.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('LangSwitcher', () => {
	it('marks the current locale as aria-current text (not a link)', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, { props: { currentPath: '/kiez/mitte' } });
		const current = container.querySelector('[data-testid="lang-switcher-current"]');
		expect(current).not.toBeNull();
		expect(current?.getAttribute('aria-current')).toBe('true');
		expect(current?.getAttribute('lang')).toBe('de');
	});

	it('renders every other locale as a full-reload link to the same path', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, { props: { currentPath: '/kiez/mitte' } });
		const links = Array.from(
			container.querySelectorAll('[data-testid="lang-switcher-link"]')
		) as HTMLAnchorElement[];
		expect(links).toHaveLength(1);
		const enLink = links[0];
		expect(enLink.getAttribute('data-locale')).toBe('en');
		expect(enLink.getAttribute('lang')).toBe('en');
		expect(enLink.getAttribute('href')).toBe('/en/kiez/mitte');
		expect(enLink.hasAttribute('data-sveltekit-reload')).toBe(true);
	});

	it('link text is in the target language (Intl.DisplayNames)', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, { props: { currentPath: '/' } });
		const enLink = container.querySelector('[data-testid="lang-switcher-link"]');
		expect(enLink?.textContent?.trim()).toBe('English');
	});

	it('flips current/link when the active locale is en', async () => {
		overwriteGetLocale(() => 'en');
		const { container } = render(LangSwitcher, { props: { currentPath: '/en/kiez/mitte' } });
		const current = container.querySelector('[data-testid="lang-switcher-current"]');
		expect(current?.getAttribute('lang')).toBe('en');
		const link = container.querySelector(
			'[data-testid="lang-switcher-link"]'
		) as HTMLAnchorElement | null;
		expect(link?.getAttribute('data-locale')).toBe('de');
		expect(link?.getAttribute('href')).toBe('/kiez/mitte');
	});

	it('the current-locale item carries an sr-only "current language" hint (Paraglide message)', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, { props: { currentPath: '/kiez/mitte' } });
		const current = container.querySelector('[data-testid="lang-switcher-current"]');
		expect(current?.textContent).toContain('Aktuelle Sprache');
	});

	it('the sr-only hint is localized (en → "Current language")', async () => {
		overwriteGetLocale(() => 'en');
		const { container } = render(LangSwitcher, { props: { currentPath: '/en/kiez/mitte' } });
		const current = container.querySelector('[data-testid="lang-switcher-current"]');
		expect(current?.textContent).toContain('Current language');
	});

	// WCAG code review (2026-09-26): header/drawer and footer would otherwise
	// both render an identically-named <nav>, duplicating the landmark.
	describe('landmark prop', () => {
		it('default (true): renders a <nav> with a localized aria-label ("Sprache")', async () => {
			overwriteGetLocale(() => 'de');
			const { container } = render(LangSwitcher, { props: { currentPath: '/' } });
			const nav = container.querySelector('nav[data-testid="lang-switcher"]');
			expect(nav).not.toBeNull();
			expect(nav?.getAttribute('aria-label')).toBe('Sprache');
		});

		it('aria-label is localized to en ("Language")', async () => {
			overwriteGetLocale(() => 'en');
			const { container } = render(LangSwitcher, { props: { currentPath: '/en' } });
			const nav = container.querySelector('nav[data-testid="lang-switcher"]');
			expect(nav?.getAttribute('aria-label')).toBe('Language');
		});

		it('landmark=false: renders a plain <div>, no nav landmark, no aria-label', async () => {
			overwriteGetLocale(() => 'de');
			const { container } = render(LangSwitcher, {
				props: { currentPath: '/', landmark: false }
			});
			expect(container.querySelector('nav')).toBeNull();
			const wrapper = container.querySelector('[data-testid="lang-switcher"]');
			expect(wrapper?.tagName).toBe('DIV');
			expect(wrapper?.hasAttribute('aria-label')).toBe(false);
			// Links/current-item still render normally inside the non-landmark wrapper.
			expect(wrapper?.querySelector('[data-testid="lang-switcher-link"]')).not.toBeNull();
		});
	});

	// Security: a "//"-prefixed currentPath must never make the link resolve
	// against a foreign origin (code review, 2026-09-26).
	it('collapses a "//"-prefixed currentPath so the href never becomes protocol-relative', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, {
			props: { currentPath: '//evil.example' }
		});
		const link = container.querySelector(
			'[data-testid="lang-switcher-link"]'
		) as HTMLAnchorElement | null;
		const href = link?.getAttribute('href') ?? '';
		expect(href.startsWith('//')).toBe(false);
		expect(href.startsWith('/')).toBe(true);
	});

	// spec-lang-switcher-dropdown.md: neue `variant="dropdown"` (gilt im
	// Header), `variant="list"` bleibt Default und unverändert (siehe Tests
	// oben, die weiterhin ohne `variant`-Prop laufen).
	describe('variant="dropdown"', () => {
		it('rendert einen Trigger-Button mit Sprach-Icon + Locale-Kürzel ("DE")', async () => {
			overwriteGetLocale(() => 'de');
			render(LangSwitcher, { props: { currentPath: '/kiez/mitte', variant: 'dropdown' } });
			const trigger = page.getByTestId('lang-switcher-trigger');
			await expect.element(trigger).toBeInTheDocument();
			const el = (await trigger.element()) as HTMLButtonElement;
			expect(el.textContent).toContain('DE');
		});

		// WCAG 2.5.3 (Label in Name): der zugängliche Name muss den sichtbaren
		// Text ("DE") enthalten, nicht nur den ausgeschriebenen Sprachnamen --
		// Präfix-Check statt exaktem String, damit die Wortstellung im Satz
		// (Sprachname zuerst oder zuletzt) den Test nicht koppelt.
		it('Trigger hat einen zugänglichen Namen, der den sichtbaren Text "DE" enthält (WCAG 2.5.3)', async () => {
			overwriteGetLocale(() => 'de');
			render(LangSwitcher, { props: { currentPath: '/kiez/mitte', variant: 'dropdown' } });
			const trigger = (await page
				.getByTestId('lang-switcher-trigger')
				.element()) as HTMLButtonElement;
			const label = trigger.getAttribute('aria-label') ?? '';
			expect(label).toContain('DE');
			expect(label).toContain('Deutsch');
			// Sichtbarer Text steht am Anfang (empfohlen für Label-in-Name).
			expect(label.startsWith('DE')).toBe(true);
		});

		it('EN: Trigger-Kürzel "EN", zugänglicher Name enthält "EN" am Anfang + "English"', async () => {
			overwriteGetLocale(() => 'en');
			render(LangSwitcher, { props: { currentPath: '/en/kiez/mitte', variant: 'dropdown' } });
			const trigger = (await page
				.getByTestId('lang-switcher-trigger')
				.element()) as HTMLButtonElement;
			expect(trigger.textContent).toContain('EN');
			const label = trigger.getAttribute('aria-label') ?? '';
			expect(label).toContain('EN');
			expect(label).toContain('English');
			expect(label.startsWith('EN')).toBe(true);
		});

		it('öffnet per Klick: aktive Sprache erscheint mit aria-current + Häkchen, ist kein Link, aber ein role=menuitem (disabled)', async () => {
			overwriteGetLocale(() => 'de');
			render(LangSwitcher, { props: { currentPath: '/kiez/mitte', variant: 'dropdown' } });
			await userEvent.click(page.getByTestId('lang-switcher-trigger'));
			const current = (await page.getByTestId('lang-switcher-current').element()) as HTMLElement;
			expect(current.tagName).not.toBe('A');
			expect(current.getAttribute('aria-current')).toBe('true');
			expect(current.getAttribute('lang')).toBe('de');
			expect(current.textContent).toContain('Aktuelle Sprache');
			// Code-review fix: gültiges role="menu"-Kind statt nacktem <div> --
			// bits-ui `DropdownMenu.Item disabled` liefert role=menuitem +
			// aria-disabled, und überspringt es bei der Pfeiltasten-Navigation.
			expect(current.getAttribute('role')).toBe('menuitem');
			expect(current.getAttribute('aria-disabled')).toBe('true');
		});

		// Code-review fix: jedes direkte Kind von role="menu" muss selbst ein
		// gültiges ARIA-Menu-Kind sein (role=menuitem/menuitemcheckbox/…) --
		// kein nackter <div>/<span> ohne Rolle.
		it('jedes Kind des geöffneten Menüs trägt eine gültige menuitem-Rolle', async () => {
			overwriteGetLocale(() => 'de');
			render(LangSwitcher, { props: { currentPath: '/kiez/mitte', variant: 'dropdown' } });
			await userEvent.click(page.getByTestId('lang-switcher-trigger'));
			const menu = (await page.getByRole('menu').element()) as HTMLElement;
			const children = Array.from(menu.children) as HTMLElement[];
			expect(children.length).toBeGreaterThan(0);
			for (const child of children) {
				expect(child.getAttribute('role')).toMatch(/^menuitem/);
			}
		});

		it('öffnet per Klick: andere Sprache ist ein echter Link mit lang/hreflang/data-sveltekit-reload', async () => {
			overwriteGetLocale(() => 'de');
			render(LangSwitcher, { props: { currentPath: '/kiez/mitte', variant: 'dropdown' } });
			await userEvent.click(page.getByTestId('lang-switcher-trigger'));
			const link = (await page.getByTestId('lang-switcher-link').element()) as HTMLAnchorElement;
			expect(link.tagName).toBe('A');
			expect(link.getAttribute('href')).toBe('/en/kiez/mitte');
			expect(link.getAttribute('lang')).toBe('en');
			expect(link.getAttribute('hreflang')).toBe('en');
			expect(link.hasAttribute('data-sveltekit-reload')).toBe(true);
			expect(link.textContent?.trim()).toBe('English');
		});

		it('Tastatur: Enter öffnet, Escape schließt und gibt den Fokus an den Trigger zurück', async () => {
			overwriteGetLocale(() => 'de');
			render(LangSwitcher, { props: { currentPath: '/kiez/mitte', variant: 'dropdown' } });
			const trigger = page.getByTestId('lang-switcher-trigger');
			((await trigger.element()) as HTMLButtonElement).focus();
			await userEvent.keyboard('{Enter}');
			const link = page.getByTestId('lang-switcher-link');
			await expect.element(link).toBeInTheDocument();
			// bits-ui verschiebt den DOM-Fokus beim Öffnen asynchron auf das
			// erste (nicht-disabled) Item -- Escape muss diesen Übergang
			// abwarten, sonst flakt der Fokus-Rücksprung auf den Trigger
			// gelegentlich (derselbe Effekt wie im e2e-Test dokumentiert).
			await expect.element(link).toHaveFocus();
			await userEvent.keyboard('{Escape}');
			await expect.element(page.getByTestId('lang-switcher-link')).not.toBeInTheDocument();
			expect(document.activeElement).toBe(await trigger.element());
		});

		// Der `<noscript>`-Fallback selbst ist im JS-aktiven Testbrowser nicht
		// strukturell prüfbar: laut HTML-Spec parst ein Browser mit aktiver
		// Scripting-Flag den Inhalt von `<noscript>` grundsätzlich NICHT als
		// echte Kind-Elemente (auch nicht bei Svelte-Templates, die intern über
		// `<template>`/`innerHTML` gebaut werden) -- genau das macht ihn im
		// echten Einsatz als No-JS-Fallback korrekt inert. Hier daher nur die
		// Existenz des Elements; der funktionale Beweis kommt aus dem e2e-Test
		// mit `javaScriptEnabled: false` (`tests/e2e/i18n-routing.e2e.ts`).
		it('bietet einen no-JS-Fallback: ein <noscript>-Element ist vorhanden', async () => {
			overwriteGetLocale(() => 'de');
			const { container } = render(LangSwitcher, {
				props: { currentPath: '/kiez/mitte', variant: 'dropdown' }
			});
			expect(container.querySelector('noscript')).not.toBeNull();
		});

		// landmark=false gilt genauso für die dropdown-Variante wie für `list`
		// (siehe `describe('landmark prop')` oben) -- eigener Test, weil der
		// dropdown-Zweig einen separaten `{#if variant === 'dropdown'}`-Ast hat.
		it('landmark=false: rendert ein <div> statt <nav>, Trigger bleibt erreichbar', async () => {
			overwriteGetLocale(() => 'de');
			const { container } = render(LangSwitcher, {
				props: { currentPath: '/kiez/mitte', variant: 'dropdown', landmark: false }
			});
			expect(container.querySelector('nav')).toBeNull();
			const wrapper = container.querySelector('[data-testid="lang-switcher"]');
			expect(wrapper?.tagName).toBe('DIV');
			expect(wrapper?.hasAttribute('aria-label')).toBe(false);
			await expect.element(page.getByTestId('lang-switcher-trigger')).toBeInTheDocument();
		});
	});
});
