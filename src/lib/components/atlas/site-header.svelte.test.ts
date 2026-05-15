import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import SiteHeader from './site-header.svelte';

describe('site-header.svelte', () => {
	it('rendert Logo-Link mit aria-label', async () => {
		render(SiteHeader, { geocode: async () => [] });
		const link = page.getByRole('link', { name: 'navigator.berlin Startseite' });
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
});
