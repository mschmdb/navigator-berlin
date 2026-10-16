import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';

afterEach(() => overwriteGetLocale(() => 'de'));

describe('Kälte-Seite', () => {
	it('hat genau ein h1', async () => {
		render(Page);
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Kälte-Navigator Berlin');
		expect(document.querySelectorAll('h1').length).toBe(1);
	});

	it('enthält den Notfall-Block', async () => {
		render(Page);
		await expect.element(page.getByTestId('kaelte-notfall')).toBeVisible();
		await expect.element(page.getByTestId('kaelte-112-link')).toHaveAttribute('href', 'tel:112');
	});

	it('hat leere Platzhalter für Warnbanner (#60) und warme Orte (#61)', async () => {
		render(Page);
		const warnung = document.querySelector('[data-testid="kaelte-platzhalter-warnung"]');
		const orte = document.querySelector('[data-testid="kaelte-platzhalter-orte"]');
		expect(warnung).not.toBeNull();
		expect(orte).not.toBeNull();
		expect(warnung?.textContent?.trim()).toBe('');
		expect(orte?.textContent?.trim()).toBe('');
	});

	it('setzt noindex bis zum Launch', async () => {
		render(Page);
		await new Promise((r) => setTimeout(r, 20));
		const robots = document.head.querySelector('meta[name="robots"]');
		expect(robots?.getAttribute('content')).toContain('noindex');
	});

	it('Canonical zeigt auf /kaelte der Hauptdomain-Struktur', async () => {
		render(Page);
		await new Promise((r) => setTimeout(r, 20));
		const canonical = document.head.querySelector('link[rel="canonical"]');
		expect(canonical?.getAttribute('href')).toMatch(/\/kaelte$/);
	});

	it('hreflang-en-Alternate zeigt auf /en/kaelte', async () => {
		render(Page);
		await new Promise((r) => setTimeout(r, 20));
		const en = document.head.querySelector('link[rel="alternate"][hreflang="en"]');
		expect(en?.getAttribute('href')).toMatch(/\/en\/kaelte$/);
	});

	it('rendert Breadcrumb-JSON-LD', async () => {
		render(Page);
		const ld = document.querySelector('[data-testid="kaelte-breadcrumb-jsonld"]');
		expect(ld?.textContent).toContain('BreadcrumbList');
	});

	it('gerenderter Text enthält keine em-dashes (U+2014)', async () => {
		render(Page);
		const text = (await page.getByTestId('kaelte-landing').element()).textContent ?? '';
		expect(text.includes('—')).toBe(false);
	});

	it('rendert englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Cold Navigator Berlin');
	});
});
