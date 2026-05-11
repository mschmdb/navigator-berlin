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
		const mark = page.getByText('navigator.berlin');
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

	it('Header hat banner-role + sticky+ hairline-Bottom', async () => {
		render(SiteHeader, { geocode: async () => [] });
		const banner = page.getByRole('banner');
		await expect.element(banner).toBeInTheDocument();
		const el = (await banner.element()) as HTMLElement;
		expect(el.className).toMatch(/sticky/);
		expect(el.className).toMatch(/border-b/);
		expect(el.className).toMatch(/border-rule/);
	});
});
