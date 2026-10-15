import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { OverviewBezirk } from '$lib/data/region-overview.js';
import Page from './+page.svelte';
import { internalHrefs } from '../methodik/methodik-test-utils.js';

const bezirke: OverviewBezirk[] = [
	{ slug: 'mitte', name: 'Mitte', einwohner: 390000, composite: 44, kieze: [] },
	{ slug: 'spandau', name: 'Spandau', einwohner: null, composite: null, kieze: [] }
];

const data = { bezirke, einwohnerStichtag: '2024-12-31' as string | null };

afterEach(() => overwriteGetLocale(() => 'de'));

function jsonLd(testid: string): { itemListElement: { name: string; item: string }[] } {
	const el = document.querySelector(`script[type="application/ld+json"][data-testid="${testid}"]`);
	return JSON.parse(el?.textContent ?? '{}');
}

describe('/bezirke +page.svelte', () => {
	it('hat genau eine h1 und eine Liste mit allen Bezirken', () => {
		render(Page, { data });
		expect(document.querySelectorAll('h1')).toHaveLength(1);
		expect(document.querySelector('h1')?.textContent).toBe('Alle Bezirke in Berlin');
		expect(document.querySelectorAll('[data-testid="bezirk-overview-item"]')).toHaveLength(2);
		expect(internalHrefs(document.body)).toEqual(
			expect.arrayContaining(['/bezirk/mitte', '/bezirk/spandau'])
		);
	});

	it('zeigt Einwohnerzahl und Score mit sichtbarem Label, Stichtag im Text', () => {
		render(Page, { data });
		const mitte = document.querySelectorAll('[data-testid="bezirk-overview-item"]')[0];
		expect(mitte?.textContent).toContain('Einwohner:innen');
		expect(mitte?.textContent).toContain('390.000');
		expect(mitte?.textContent).toContain('Bezirks-Score');
		expect(mitte?.textContent).toContain('44 von 100');
		expect(document.body.textContent).toContain('Stand Ende 2024');
	});

	it('laesst fehlende Einwohner und Scores weg, der Eintrag bleibt', () => {
		render(Page, { data: { bezirke, einwohnerStichtag: null } });
		const spandau = document.querySelectorAll('[data-testid="bezirk-overview-item"]')[1];
		expect(spandau?.querySelector('a')?.textContent?.trim()).toBe('Spandau');
		expect(spandau?.textContent).not.toContain('Bezirks-Score');
		expect(spandau?.textContent).not.toContain('Einwohner');
		expect(document.body.textContent).not.toContain('Einwohnerzahlen:');
	});

	it('setzt Titel, Beschreibung und Breadcrumb-JSON-LD in DE', () => {
		render(Page, { data });
		expect(document.title).toBe('Alle 2 Bezirke in Berlin | navigator.berlin');
		const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
		expect(description?.length).toBeGreaterThanOrEqual(70);
		expect(description?.length).toBeLessThanOrEqual(160);
		const items = jsonLd('bezirke-breadcrumb-jsonld').itemListElement;
		expect(items.map((i) => i.name)).toEqual(['Berlin', 'Bezirke']);
		expect(items[1]?.item.endsWith('/bezirke')).toBe(true);
	});

	it('EN: englische Texte, /en-Links, englisches Zahlenformat', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data });
		expect(document.querySelector('h1')?.textContent).toBe('All Bezirke in Berlin');
		expect(document.body.textContent).toContain('390,000');
		expect(document.body.textContent).toContain('44 of 100');
		expect(internalHrefs(document.body).filter((h) => !h.startsWith('/en'))).toEqual([]);
		const items = jsonLd('bezirke-breadcrumb-jsonld').itemListElement;
		expect(items[1]?.item.endsWith('/en/bezirke')).toBe(true);
	});
});
