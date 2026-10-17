/**
 * GH-88: Erklärung, externer Link, Datenstand und redaktionelle Hinweise stehen einmal pro
 * Sektion. Die Tests wandern aus `layer-hit-row`/`layer-card`/`klima-pet-card` hierher.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import SectionSources from './section-sources.svelte';
import type { LayerHit } from '$lib/data';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const wohnlage: LayerHit = {
	layer: 'mietspiegel-wohnlage',
	value: 'gut',
	source: 'https://fbinter.stadt-berlin.de/wfs',
	updatedAt: '2025-06-01T00:00:00Z',
	license: 'dl-de/zero-2-0'
};

const wohnlagen2024: LayerHit = {
	layer: 'wohnlagen-2024',
	value: { wol_mode: 'gut', plr_name: 'Mitte' },
	source: 'https://gdi.berlin.de/services/wfs/wohnlagenadr2024',
	updatedAt: '2024-06-10T00:00:00Z',
	license: 'dl-de/by-2-0'
};

async function openWith(hits: LayerHit[], lang?: 'de' | 'en') {
	render(SectionSources, {
		sectionLabel: 'Wohnen',
		hits,
		layerNameFor: (slug: string) => slug,
		lang
	});
	await page.getByTestId('section-sources-toggle').click();
}

describe('SectionSources', () => {
	it('rendert nichts ohne Datensätze', async () => {
		render(SectionSources, { sectionLabel: 'Wohnen', hits: [], layerNameFor: (s: string) => s });
		await expect.element(page.getByTestId('section-sources')).not.toBeInTheDocument();
	});

	it('ist eingeklappt, bis der Toggle geklickt wird', async () => {
		render(SectionSources, {
			sectionLabel: 'Wohnen',
			hits: [wohnlage],
			layerNameFor: (s: string) => s
		});
		const toggle = (await page.getByTestId('section-sources-toggle').element()) as HTMLElement;
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		await expect.element(page.getByTestId('section-sources-item')).not.toBeInTheDocument();
		await page.getByTestId('section-sources-toggle').click();
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
	});

	it('Datenstand je Datensatz in der Dichte-Skala', async () => {
		await openWith([wohnlage]);
		const banner = (await page.getByTestId('data-stand-banner').element()) as HTMLElement;
		expect(banner.className).toMatch(/text-dense-meta/);
	});

	it('Outdated (>5 Jahre) zeigt die Veraltet-Pille', async () => {
		await openWith([{ ...wohnlage, updatedAt: '2019-01-01T00:00:00Z' }]);
		await expect.element(page.getByTestId('banner-outdated')).toBeInTheDocument();
	});

	it('Datensatz-Name verlinkt auf die Layer-Seite, EN mit Präfix', async () => {
		await openWith([wohnlage], 'en');
		const link = document.querySelector(
			'[data-testid="section-sources-item"] a'
		) as HTMLAnchorElement | null;
		expect(link?.getAttribute('href')).toBe('/en/layer/mietspiegel-wohnlage');
	});

	it('externer Link (Mietspiegel-Rechner) für wohnlagen-2024', async () => {
		await openWith([wohnlagen2024]);
		const link = (await page.getByTestId('external-link').element()) as HTMLAnchorElement;
		expect(link.href).toBe('https://mietspiegel.berlin.de/');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toMatch(/noopener/);
	});

	it('kein externer Link ohne Wert an dieser Stelle', async () => {
		await openWith([{ ...wohnlagen2024, value: null, reason: 'coverage-out-of-scope' }]);
		await expect.element(page.getByTestId('external-link')).not.toBeInTheDocument();
	});

	it('Erklärung und Skala in EN, ohne lang-Attribut', async () => {
		await openWith([wohnlagen2024], 'en');
		const long = (await page.getByTestId('explain-long').element()) as HTMLElement;
		expect(long.textContent).toMatch(/Aggregated residential area classification/);
		expect(long.getAttribute('lang')).toBeNull();
		const scale = (await page.getByTestId('explain-scale').element()) as HTMLElement;
		expect(scale.textContent).toMatch(/prime location/);
	});

	it('Erklärung in DE ohne lang-Attribut', async () => {
		await openWith([wohnlagen2024]);
		const long = (await page.getByTestId('explain-long').element()) as HTMLElement;
		expect(long.textContent).toMatch(/Wohnlagen-Einstufung/);
		expect(long.getAttribute('lang')).toBeNull();
	});

	it('Editorial: legal-Disclaimer mit Quellen-Link für mietspiegel-wohnlage', async () => {
		await openWith([wohnlage]);
		const d = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(d.getAttribute('data-variant')).toBe('legal');
		expect(d.textContent).toMatch(/rechtliche Aussage/);
		const link = (await page.getByTestId('disclaimer-source-link').element()) as HTMLAnchorElement;
		expect(link.href).toMatch(/^https:\/\//);
	});

	it('Editorial: Saison-Hinweis nur außerhalb der Saison', async () => {
		await openWith([{ ...wohnlage, layer: 'trinkbrunnen', value: { name: 'Brunnen 1' } }]);
		await expect.element(page.getByTestId('editorial-disclaimer')).not.toBeInTheDocument();
	});

	it('Editorial: Saison-Hinweis bei reason seasonal', async () => {
		await openWith([{ ...wohnlage, layer: 'trinkbrunnen', value: null, reason: 'seasonal' }]);
		const d = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(d.getAttribute('data-variant')).toBe('seasonal');
	});

	it('Editorial: Layer ohne Config zeigt keinen Hinweis', async () => {
		await openWith([{ ...wohnlage, layer: 'gebaeudealter', value: 'vor 1949' }]);
		await expect.element(page.getByTestId('editorial-disclaimer')).not.toBeInTheDocument();
	});
});
