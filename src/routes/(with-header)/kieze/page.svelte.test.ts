import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { OverviewBezirk } from '$lib/data/region-overview.js';
import Page from './+page.svelte';
import { internalHrefs } from '../methodik/methodik-test-utils.js';

const bezirke: OverviewBezirk[] = [
	{
		slug: 'mitte',
		name: 'Mitte',
		einwohner: 390000,
		composite: 44,
		kieze: [
			{ slug: 'brunnenstrasse', name: 'Brunnenstraße', composite: 51 },
			{ slug: 'moabit-west', name: 'Moabit West', composite: null }
		]
	},
	{
		slug: 'spandau',
		name: 'Spandau',
		einwohner: 250000,
		composite: 38,
		kieze: [{ slug: 'heerstrasse-spandau', name: 'Heerstraße', composite: 41 }]
	}
];

afterEach(() => overwriteGetLocale(() => 'de'));

function jsonLd(testid: string): { itemListElement: { name: string; item: string }[] } {
	const el = document.querySelector(`script[type="application/ld+json"][data-testid="${testid}"]`);
	return JSON.parse(el?.textContent ?? '{}');
}

describe('/kieze +page.svelte', () => {
	it('hat genau eine h1 und je Bezirk eine h2', () => {
		render(Page, { data: { bezirke } });
		expect(document.querySelectorAll('h1')).toHaveLength(1);
		expect(document.querySelector('h1')?.textContent).toBe('Alle Kieze in Berlin');
		const h2 = [...document.querySelectorAll('h2')].map((h) => h.textContent?.trim());
		expect(h2).toEqual(['Mitte', 'Spandau']);
	});

	it('verlinkt jeden Kiez und jeden Bezirk mit lokalisierten Pfaden', () => {
		render(Page, { data: { bezirke } });
		const hrefs = internalHrefs(document.body);
		for (const slug of ['brunnenstrasse', 'moabit-west', 'heerstrasse-spandau']) {
			expect(hrefs).toContain(`/kiez/${slug}`);
		}
		expect(hrefs).toContain('/bezirk/mitte');
		expect(hrefs).toContain('/bezirk/spandau');
	});

	it('zeigt Scores als Text mit Screenreader-Beschriftung, ohne Score einen Strich', () => {
		render(Page, { data: { bezirke } });
		const items = [...document.querySelectorAll('[data-testid="kiez-overview-item"]')];
		expect(items).toHaveLength(3);
		expect(items[0]?.textContent).toContain('51');
		expect(items[0]?.textContent).toContain('Kiez-Score 51 von 100');
		expect(items[1]?.textContent).toContain('k. A.');
		expect(items[1]?.textContent).not.toContain('–');
		expect(items[1]?.textContent).toContain('ohne Score');
	});

	it('listet Kieze in einer <ul> je Bezirk', () => {
		render(Page, { data: { bezirke } });
		const lists = document.querySelectorAll('section ul');
		expect(lists).toHaveLength(2);
		expect(lists[0]?.querySelectorAll(':scope > li')).toHaveLength(2);
	});

	it('rendert keine Gruppe ohne Kieze und nutzt die Einzahl bei einem Kiez', () => {
		render(Page, {
			data: { bezirke: [...bezirke, { ...bezirke[0]!, slug: 'leer', name: 'Leer', kieze: [] }] }
		});
		const h2 = [...document.querySelectorAll('h2')].map((h) => h.textContent?.trim());
		expect(h2).toEqual(['Mitte', 'Spandau']);
		expect(document.body.textContent).toContain('1 Kiez ');
		expect(document.body.textContent).toContain('2 Kieze');
	});

	it('Sprunglinks haben passende Ziel-IDs und das Trennzeichen ist aria-hidden', () => {
		render(Page, { data: { bezirke } });
		const targets = [...document.querySelectorAll('nav a[href^="#"]')].map((a) =>
			a.getAttribute('href')!.slice(1)
		);
		expect(targets).toEqual(['bezirk-mitte', 'bezirk-spandau']);
		for (const id of targets) expect(document.getElementById(id)).not.toBeNull();
		expect(document.querySelectorAll('section header p span[aria-hidden="true"]')).toHaveLength(2);
	});

	it('funktioniert ohne Scores und ohne Daten', () => {
		const noScores = bezirke.map((b) => ({
			...b,
			composite: null,
			kieze: b.kieze.map((k) => ({ ...k, composite: null }))
		}));
		render(Page, { data: { bezirke: noScores } });
		expect(document.querySelectorAll('[data-testid="kiez-overview-item"]')).toHaveLength(3);
	});

	it('setzt Titel, Beschreibung und Breadcrumb-JSON-LD in DE', () => {
		render(Page, { data: { bezirke } });
		expect(document.title).toBe('Alle 3 Kieze in Berlin | navigator.berlin');
		const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
		expect(description?.length).toBeGreaterThanOrEqual(70);
		expect(description?.length).toBeLessThanOrEqual(160);
		const items = jsonLd('kieze-breadcrumb-jsonld').itemListElement;
		expect(items.map((i) => i.name)).toEqual(['Berlin', 'Kieze']);
		expect(items[1]?.item.endsWith('/kieze')).toBe(true);
	});

	it('EN: englische Texte, /en-Links und /en-Breadcrumb', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { bezirke } });
		expect(document.querySelector('h1')?.textContent).toBe('All Kieze in Berlin');
		expect(document.title).toBe('All 3 Kieze in Berlin | navigator.berlin');
		const hrefs = internalHrefs(document.body).filter((h) => !h.startsWith('#'));
		expect(hrefs.filter((h) => !h.startsWith('/en'))).toEqual([]);
		expect(hrefs).toContain('/en/kiez/brunnenstrasse');
		const items = jsonLd('kieze-breadcrumb-jsonld').itemListElement;
		expect(items[1]?.item.endsWith('/en/kieze')).toBe(true);
	});
});
