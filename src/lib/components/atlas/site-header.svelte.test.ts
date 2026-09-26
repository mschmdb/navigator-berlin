import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import SiteHeader from './site-header.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('site-header.svelte', () => {
	it('rendert Logo-Link mit aria-label', async () => {
		render(SiteHeader, { geocode: async () => [] });
		const link = page.getByRole('link', { name: 'navigator.berlin' });
		await expect.element(link).toBeInTheDocument();
		const el = (await link.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('/');
	});

	it('rendert Wortmarke "navigator.berlin" mit Plex-Sans-Light + tracking-wide', async () => {
		render(SiteHeader, { geocode: async () => [] });
		// Erstes Match ist <title>-Element im SVG-Logo (a11y-aria); zweites die Wortmarke.
		const mark = page.getByText('navigator.berlin').nth(1);
		await expect.element(mark).toBeInTheDocument();
		const el = (await mark.element()) as HTMLSpanElement;
		expect(el.className).toMatch(/font-sans/);
		expect(el.className).toMatch(/font-light/);
		expect(el.className).toMatch(/tracking-wide/);
	});

	it('rendert AddressSearch (Combobox)', async () => {
		render(SiteHeader, { geocode: async () => [] });
		await expect.element(page.getByRole('combobox')).toBeInTheDocument();
	});

	it('rendert langSwitcher snippet wenn uebergeben', async () => {
		const langSwitcher = createRawSnippet(() => ({
			render: () => '<span data-testid="lang-switch">DE | EN</span>'
		}));
		render(SiteHeader, { geocode: async () => [], langSwitcher });
		await expect.element(page.getByTestId('lang-switch')).toBeInTheDocument();
	});

	it('rendert Layer-Trigger wenn onOpenLayerPalette gegeben', async () => {
		let opened = 0;
		render(SiteHeader, {
			geocode: async () => [],
			activeLayerCount: 2,
			onOpenLayerPalette: () => {
				opened += 1;
			}
		});
		const trigger = page.getByTestId('header-layer-trigger');
		await expect.element(trigger).toBeInTheDocument();
		const el = (await trigger.element()) as HTMLButtonElement;
		expect(el.getAttribute('aria-label')).toMatch(/layer/i);
		await trigger.click();
		expect(opened).toBe(1);
	});

	it('Layer-Trigger zeigt Badge mit activeLayerCount', async () => {
		render(SiteHeader, {
			geocode: async () => [],
			activeLayerCount: 3,
			onOpenLayerPalette: () => {}
		});
		const badge = page.getByTestId('header-layer-badge');
		const el = (await badge.element()) as HTMLElement;
		expect(el.textContent?.trim()).toBe('3');
	});

	it('Layer-Trigger ohne onOpenLayerPalette wird nicht gerendert', async () => {
		render(SiteHeader, { geocode: async () => [] });
		await expect.element(page.getByTestId('header-layer-trigger')).not.toBeInTheDocument();
	});

	it('Layer-Badge versteckt wenn count=0', async () => {
		render(SiteHeader, {
			geocode: async () => [],
			activeLayerCount: 0,
			onOpenLayerPalette: () => {}
		});
		await expect.element(page.getByTestId('header-layer-trigger')).toBeInTheDocument();
		await expect.element(page.getByTestId('header-layer-badge')).not.toBeInTheDocument();
	});

	it('Header hat banner-role + sticky+ hairline-Bottom', async () => {
		render(SiteHeader, { geocode: async () => [] });
		const banner = page.getByRole('banner');
		await expect.element(banner).toBeInTheDocument();
		const el = (await banner.element()) as HTMLElement;
		expect(el.className).toMatch(/sticky/);
		expect(el.className).toMatch(/border-b/);
		expect(el.className).toMatch(/border-rule/);
	});

	describe('Bookmark-Trigger (Story 1.26)', () => {
		it('rendert Bookmark-Trigger wenn onOpenBookmarks gegeben', async () => {
			let opened = 0;
			render(SiteHeader, {
				geocode: async () => [],
				onOpenBookmarks: () => {
					opened += 1;
				}
			});
			const trigger = page.getByTestId('header-bookmark-trigger');
			await expect.element(trigger).toBeInTheDocument();
			const el = (await trigger.element()) as HTMLButtonElement;
			expect(el.getAttribute('aria-label')).toMatch(/bookmark/i);
			expect(el.getAttribute('aria-haspopup')).toBe('dialog');
			await trigger.click();
			expect(opened).toBe(1);
		});

		it('Bookmark-Badge zeigt count wenn > 0', async () => {
			render(SiteHeader, {
				geocode: async () => [],
				bookmarkCount: 3,
				onOpenBookmarks: () => {}
			});
			const badge = page.getByTestId('header-bookmark-badge');
			const el = (await badge.element()) as HTMLElement;
			expect(el.textContent?.trim()).toBe('3');
		});

		it('Bookmark-Badge versteckt wenn count=0', async () => {
			render(SiteHeader, {
				geocode: async () => [],
				bookmarkCount: 0,
				onOpenBookmarks: () => {}
			});
			await expect.element(page.getByTestId('header-bookmark-trigger')).toBeInTheDocument();
			await expect.element(page.getByTestId('header-bookmark-badge')).not.toBeInTheDocument();
		});

		it('Icon-Variant gefüllt wenn currentAddressBookmarked=true', async () => {
			render(SiteHeader, {
				geocode: async () => [],
				currentAddressBookmarked: true,
				onOpenBookmarks: () => {}
			});
			const trigger = (await page.getByTestId('header-bookmark-trigger').element()) as HTMLElement;
			expect(trigger.getAttribute('data-bookmarked')).toBe('true');
		});

		it('Icon-Variant outline wenn currentAddressBookmarked=false', async () => {
			render(SiteHeader, {
				geocode: async () => [],
				currentAddressBookmarked: false,
				onOpenBookmarks: () => {}
			});
			const trigger = (await page.getByTestId('header-bookmark-trigger').element()) as HTMLElement;
			expect(trigger.getAttribute('data-bookmarked')).toBe('false');
		});

		it('Bookmark-Trigger ohne onOpenBookmarks wird nicht gerendert', async () => {
			render(SiteHeader, { geocode: async () => [] });
			await expect.element(page.getByTestId('header-bookmark-trigger')).not.toBeInTheDocument();
		});
	});

	describe('Such-Bar-Kollaps (Story 1.31 AC-2)', () => {
		it('searchCollapsed=false rendert AddressSearch-Combobox', async () => {
			render(SiteHeader, { geocode: async () => [], searchCollapsed: false });
			await expect.element(page.getByRole('combobox')).toBeInTheDocument();
			await expect.element(page.getByTestId('header-search-trigger')).not.toBeInTheDocument();
		});

		it('searchCollapsed=true rendert Search-Icon-Button statt Combobox', async () => {
			render(SiteHeader, { geocode: async () => [], searchCollapsed: true });
			await expect.element(page.getByTestId('header-search-trigger')).toBeInTheDocument();
			await expect.element(page.getByRole('combobox')).not.toBeInTheDocument();
		});

		it('Klick auf Search-Icon-Button öffnet Overlay', async () => {
			render(SiteHeader, { geocode: async () => [], searchCollapsed: true });
			await page.getByTestId('header-search-trigger').click();
			await expect.element(page.getByTestId('address-search-overlay')).toBeInTheDocument();
		});
	});
});

describe('site-header · Kiez-Finder-Link', () => {
	it('rendert flag-gated Link auf /explore?finder=1', async () => {
		render(SiteHeader, {});
		const link = (await page.getByTestId('header-finder-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/explore?finder=1');
		// Seit 25.08. Icon-Control: Label hängt am aria-label, nicht im Textinhalt.
		expect(link.getAttribute('aria-label')).toBe('Kiez-Finder öffnen');
	});

	// i18n Block B2, Entscheidung 1A: Shell ist auf jeder /en-Seite englisch,
	// interne Shell-Links zeigen auf /en/...
	it('EN: aria-label + Link-Ziel sind englisch/lokalisiert', async () => {
		overwriteGetLocale(() => 'en');
		render(SiteHeader, { geocode: async () => [] });
		const link = (await page.getByTestId('header-finder-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('aria-label')).toBe('Open Kiez Finder');
		expect(link.getAttribute('title')).toBe('Kiez Finder');
		expect(link.getAttribute('href')).toBe('/en/explore?finder=1');
	});
});

describe('site-header · i18n Block B2 (Shell englisch auf /en)', () => {
	it('Logo-Link zeigt auf /en', async () => {
		overwriteGetLocale(() => 'en');
		render(SiteHeader, { geocode: async () => [] });
		const link = page.getByRole('link', { name: 'navigator.berlin' });
		const el = (await link.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('/en/');
	});

	it('Menü-Trigger + Layer-/Bookmark-Trigger-Aria-Labels sind englisch (Plural)', async () => {
		overwriteGetLocale(() => 'en');
		render(SiteHeader, {
			geocode: async () => [],
			activeLayerCount: 2,
			onOpenLayerPalette: () => {},
			bookmarkCount: 3,
			onOpenBookmarks: () => {}
		});
		const menuTrigger = (await page.getByTestId('header-menu-trigger').element()) as HTMLElement;
		expect(menuTrigger.getAttribute('aria-label')).toBe('Open menu');
		const layerTrigger = (await page
			.getByTestId('header-layer-trigger')
			.element()) as HTMLElement;
		expect(layerTrigger.getAttribute('aria-label')).toBe('2 active layers · Open palette');
		const bookmarkTrigger = (await page
			.getByTestId('header-bookmark-trigger')
			.element()) as HTMLElement;
		expect(bookmarkTrigger.getAttribute('aria-label')).toBe('Show 3 saved addresses');
	});

	// Review-Fund: Singular-Form fehlte -- "Show 1 saved addresses" wäre
	// grammatisch falsch gewesen (Block-B-`_singular`/`_plural`-Muster).
	it('Layer-/Bookmark-Trigger-Aria-Labels: Singular bei count=1', async () => {
		overwriteGetLocale(() => 'en');
		render(SiteHeader, {
			geocode: async () => [],
			activeLayerCount: 1,
			onOpenLayerPalette: () => {},
			bookmarkCount: 1,
			onOpenBookmarks: () => {}
		});
		const layerTrigger = (await page
			.getByTestId('header-layer-trigger')
			.element()) as HTMLElement;
		expect(layerTrigger.getAttribute('aria-label')).toBe('1 active layer · Open palette');
		const bookmarkTrigger = (await page
			.getByTestId('header-bookmark-trigger')
			.element()) as HTMLElement;
		expect(bookmarkTrigger.getAttribute('aria-label')).toBe('Show 1 saved address');
	});

	it('Adress-Suche im Header hat englischen Placeholder', async () => {
		overwriteGetLocale(() => 'en');
		render(SiteHeader, { geocode: async () => [] });
		const input = (await page.getByRole('combobox').element()) as HTMLInputElement;
		expect(input.placeholder).toBe('Enter a Berlin address');
	});
});
