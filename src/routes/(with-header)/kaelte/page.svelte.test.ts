import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';
import type { PageProps } from './$types';

const NO_DATA = { warnings: [] } as unknown as PageProps['data'];
const FROST_DATA = {
	warnings: [
		{
			event: 'strenger-frost',
			level: 2,
			headline: 'Amtliche WARNUNG vor strengem Frost',
			source: 'Deutscher Wetterdienst (DWD)',
			sourceUrl: 'https://www.dwd.de/warnungen'
		}
	]
} as unknown as PageProps['data'];

afterEach(() => overwriteGetLocale(() => 'de'));

describe('Kälte-Seite', () => {
	it('hat genau ein h1', async () => {
		render(Page, { data: NO_DATA });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Kälte-Navigator Berlin');
		expect(document.querySelectorAll('h1').length).toBe(1);
	});

	it('enthält den Notfall-Block', async () => {
		render(Page, { data: NO_DATA });
		await expect.element(page.getByTestId('kaelte-notfall')).toBeVisible();
		await expect.element(page.getByTestId('kaelte-112-link')).toHaveAttribute('href', 'tel:112');
	});

	it('zeigt die Liste warmer Orte und den Transparenz-Block unterhalb des Notfall-Blocks (#62)', async () => {
		render(Page, { data: NO_DATA });
		const orte = document.querySelector('[data-testid="kaelte-platzhalter-orte"]');
		const notfall = document.querySelector('[data-testid="kaelte-notfall"]');
		expect(orte?.querySelector('[data-testid="waerme-orte-naehe"]')).not.toBeNull();
		expect(orte?.querySelector('[data-testid="waerme-transparenz"]')).not.toBeNull();
		expect(notfall!.compareDocumentPosition(orte!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		await expect.element(page.getByTestId('waerme-locate')).toBeVisible();
	});

	it('verlinkt „auf der Karte ansehen“ auf den Explorer mit Layer waerme-orte (#71)', async () => {
		render(Page, { data: NO_DATA });
		const link = (await page.getByTestId('kaelte-karte-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/explore?layers=waerme-orte&mode=kaelte');
		expect(link.textContent).toMatch(/auf der Karte ansehen/i);
	});

	it('Karten-Link zeigt auf EN den englischen Text und /en/-Pfad (#71)', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: NO_DATA });
		const link = (await page.getByTestId('kaelte-karte-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/explore?layers=waerme-orte&mode=kaelte');
		expect(link.textContent).toMatch(/view on the map/i);
	});

	it('zeigt ohne Warnung kein Banner', async () => {
		render(Page, { data: NO_DATA });
		expect(document.querySelector('[data-testid="dwd-kaeltewarn-banner"]')).toBeNull();
	});

	it('zeigt das Warnbanner oberhalb des Notfall-Blocks', async () => {
		render(Page, { data: FROST_DATA });
		const banner = document.querySelector('[data-testid="dwd-kaeltewarn-banner"]');
		const notfall = document.querySelector('[data-testid="kaelte-notfall"]');
		expect(banner).not.toBeNull();
		expect(notfall).not.toBeNull();
		expect(
			banner!.compareDocumentPosition(notfall!) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		expect(banner!.textContent).toContain('Strenger Frost');
	});

	it('AC 1: 112-Link bleibt mit drei Warnungen auf 390x844 im ersten Bildschirm', async () => {
		await page.viewport(390, 844);
		const long = 'Amtliche WARNUNG vor strengem Frost. '.repeat(6);
		const warn = (event: string, level: number) => ({
			event,
			level,
			headline: long,
			source: 'Deutscher Wetterdienst (DWD)',
			sourceUrl: 'https://www.dwd.de/warnungen'
		});
		const data = {
			warnings: [warn('glatteis', 3), warn('strenger-frost', 2), warn('schneefall', 2)]
		} as unknown as PageProps['data'];
		render(Page, { data });
		await expect.element(page.getByTestId('kaelte-112-link')).toBeInViewport();
	});

	it('setzt noindex bis zum Launch', async () => {
		render(Page, { data: NO_DATA });
		await new Promise((r) => setTimeout(r, 20));
		const robots = document.head.querySelector('meta[name="robots"]');
		expect(robots?.getAttribute('content')).toContain('noindex');
	});

	it('Canonical zeigt auf /kaelte der Hauptdomain-Struktur', async () => {
		render(Page, { data: NO_DATA });
		await new Promise((r) => setTimeout(r, 20));
		const canonical = document.head.querySelector('link[rel="canonical"]');
		expect(canonical?.getAttribute('href')).toMatch(/\/kaelte$/);
	});

	it('hreflang-en-Alternate zeigt auf /en/kaelte', async () => {
		render(Page, { data: NO_DATA });
		await new Promise((r) => setTimeout(r, 20));
		const en = document.head.querySelector('link[rel="alternate"][hreflang="en"]');
		expect(en?.getAttribute('href')).toMatch(/\/en\/kaelte$/);
	});

	it('rendert Breadcrumb-JSON-LD', async () => {
		render(Page, { data: NO_DATA });
		const ld = document.querySelector('[data-testid="kaelte-breadcrumb-jsonld"]');
		expect(ld?.textContent).toContain('BreadcrumbList');
	});

	it('gerenderter Text enthält keine em-dashes (U+2014)', async () => {
		render(Page, { data: NO_DATA });
		const text = (await page.getByTestId('kaelte-landing').element()).textContent ?? '';
		expect(text.includes('—')).toBe(false);
	});

	it('rendert englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: NO_DATA });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Cold Navigator Berlin');
	});
});
