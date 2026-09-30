import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';
import { internalHrefs, textLines } from '../methodik/methodik-test-utils.js';

const FILE_LINKS = [
	'/.well-known/webmcp.json',
	'/webmcp-manifest.json',
	'/llms.txt',
	'/llms-full.txt'
];

describe('architektur · DE-Parität (i18n C4b)', () => {
	it('sichtbarer DE-Text entspricht dem festgehaltenen Stand', async () => {
		render(Page);
		const main = document.querySelector('main')!;
		await expect(textLines(main)).toMatchFileSnapshot('./__snapshots__/architektur-de.txt');
	});

	it('DE-Seitenlinks bleiben ohne /en', async () => {
		render(Page);
		const main = document.querySelector('main')!;
		const hrefs = internalHrefs(main);
		expect(hrefs).toContain('/methodik');
		expect(hrefs).toContain('/lizenzen');
		expect(hrefs).toContain('/webmcp');
		expect(hrefs.filter((h) => h.startsWith('/en'))).toEqual([]);
	});
});

describe('architektur · EN (i18n C4b)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('rendert H1 und Absatz englisch, ohne lang="de"', async () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const main = document.querySelector('main')!;
		expect(main.querySelector('h1')?.textContent).toBe('Architecture');
		expect(main.textContent).toContain('Open-source stack, hosted in Germany');
		expect(main.querySelector('[lang="de"]')).toBeNull();
	});

	it('lokalisiert Seitenlinks und lässt Datei-Links unverändert', async () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const main = document.querySelector('main')!;
		const hrefs = internalHrefs(main);
		for (const file of FILE_LINKS) expect(hrefs).toContain(file);
		const pages = hrefs.filter((h) => !FILE_LINKS.includes(h));
		expect(pages).toEqual(['/en/methodik', '/en/lizenzen', '/en/webmcp']);
	});

	it('enthält keinen deutschen Resttext', async () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const text = document.querySelector('main')!.textContent ?? '';
		for (const word of ['Anwendung', 'Nicht verwendet', 'Hosting in', 'Schnittstelle', 'Quelle,']) {
			expect(text).not.toContain(word);
		}
	});
});

describe('architektur · DE-Wortlaut der Linklisten und Meta (i18n C4b)', () => {
	const lineOf = (li: Element): string => (li.textContent ?? '').replace(/\s+/g, ' ').trim();

	it('Listenpunkte mit Links behalten den Baseline-Wortlaut', () => {
		render(Page);
		const items = [...document.querySelectorAll('main li')].map(lineOf);
		expect(items).toContain('Svelte mit SvelteKit (Server-Side-Rendering, Prerender-first)');
		expect(items).toContain(
			'Karte: MapLibre GL + OpenFreeMap (Open Source, basiert auf OpenStreetMap)'
		);
		expect(items).toContain('Geocoding: Nominatim (OpenStreetMap Foundation, EU)');
		expect(items).toContain('ODIS Berlin');
		expect(items).toContain('Bundeswahlleiterin (Bundestagswahl-Daten)');
	});

	it('Meta-Title bleibt der Baseline-Titel', () => {
		render(Page);
		expect(document.title).toBe('Architektur - Berlin in Daten - navigator.berlin');
	});
});
