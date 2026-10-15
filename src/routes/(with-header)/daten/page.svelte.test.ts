import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { LayerOverviewSource } from '$lib/data/layer-overview.js';
import Page from './+page.svelte';
import { internalHrefs } from '../methodik/methodik-test-utils.js';

const layers: LayerOverviewSource[] = [
	{ slug: 'laerm-2023', bundleGroup: 'C: Umwelt' },
	{ slug: 'luft-2023', bundleGroup: 'C: Umwelt' },
	{ slug: 'bezirke', bundleGroup: 'A: Boundaries' },
	{
		slug: 'denkmal-2024',
		bundleGroup: 'D: Memorial',
		inspectorRelevant: false,
		mapRelevant: false
	}
];

afterEach(() => overwriteGetLocale(() => 'de'));

function jsonLd(testid: string): { itemListElement: { name: string; item: string }[] } {
	const el = document.querySelector(`script[type="application/ld+json"][data-testid="${testid}"]`);
	return JSON.parse(el?.textContent ?? '{}');
}

describe('/daten +page.svelte', () => {
	it('hat genau eine h1 und je Themengruppe eine h2', () => {
		render(Page, { data: { layers } });
		expect(document.querySelectorAll('h1')).toHaveLength(1);
		expect(document.querySelector('h1')?.textContent).toBe('Daten-Layer');
		const h2 = [...document.querySelectorAll('h2')].map((h) => h.textContent?.trim());
		expect(h2).toEqual(['Verwaltungsgrenzen', 'Umwelt']);
	});

	it('verlinkt Layer mit Detailseite samt Kurztext, Build-only-Layer fehlen', () => {
		render(Page, { data: { layers } });
		const hrefs = internalHrefs(document.body);
		expect(hrefs).toEqual(
			expect.arrayContaining(['/layer/laerm-2023', '/layer/luft-2023', '/layer/bezirke'])
		);
		expect(hrefs).not.toContain('/layer/denkmal-2024');
		const items = document.querySelectorAll('[data-testid="layer-overview-item"]');
		expect(items).toHaveLength(3);
		for (const item of items)
			expect(item.querySelector('p')?.textContent?.length).toBeGreaterThan(0);
	});

	it('vergibt eindeutige Heading-IDs, die zu aria-labelledby passen', () => {
		render(Page, { data: { layers } });
		const sections = [...document.querySelectorAll('article section')];
		expect(sections.length).toBeGreaterThan(1);
		const ids = sections.map((sec) => sec.getAttribute('aria-labelledby')!);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(document.getElementById(id)?.tagName).toBe('H2');
	});

	it('verlinkt Atlas und Lizenzen', () => {
		render(Page, { data: { layers } });
		const hrefs = internalHrefs(document.body);
		expect(hrefs).toContain('/explore');
		expect(hrefs).toContain('/lizenzen');
	});

	it('setzt Titel, Beschreibung und Breadcrumb-JSON-LD in DE', () => {
		render(Page, { data: { layers } });
		expect(document.title).toBe('Alle 3 Daten-Layer für Berlin | navigator.berlin');
		const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
		expect(description?.length).toBeGreaterThanOrEqual(70);
		expect(description?.length).toBeLessThanOrEqual(160);
		const items = jsonLd('daten-breadcrumb-jsonld').itemListElement;
		expect(items.map((i) => i.name)).toEqual(['Berlin', 'Daten-Layer']);
		expect(items[1]?.item.endsWith('/daten')).toBe(true);
	});

	it('EN: englische Texte und /en-Links', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { layers } });
		expect(document.querySelector('h1')?.textContent).toBe('Data layers');
		expect([...document.querySelectorAll('h2')].map((h) => h.textContent?.trim())).toEqual([
			'Administrative boundaries',
			'Environment'
		]);
		expect(internalHrefs(document.body).filter((h) => !h.startsWith('/en'))).toEqual([]);
		const items = jsonLd('daten-breadcrumb-jsonld').itemListElement;
		expect(items[1]?.item.endsWith('/en/daten')).toBe(true);
	});

	it('rendert ohne Layer eine leere Seite ohne Fehler', () => {
		render(Page, { data: { layers: [] } });
		expect(document.querySelectorAll('h1')).toHaveLength(1);
		expect(document.querySelectorAll('[data-testid="layer-overview-item"]')).toHaveLength(0);
	});
});
