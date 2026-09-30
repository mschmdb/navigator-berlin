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

/** Die Live-Diagnose hängt vom Browser ab und wird separat getestet. */
function mainWithoutDiagnose(): Element {
	const main = document.querySelector('[data-testid="webmcp-page"]')!.cloneNode(true) as Element;
	main.querySelector('[data-testid="webmcp-diagnose"]')?.remove();
	return main;
}

describe('webmcp · DE-Parität (i18n C4b)', () => {
	it('sichtbarer DE-Text entspricht dem festgehaltenen Stand', async () => {
		render(Page);
		await expect(textLines(mainWithoutDiagnose())).toMatchFileSnapshot(
			'./__snapshots__/webmcp-de.txt'
		);
	});
});

describe('webmcp · Links DE', () => {
	it('DE-Seitenlinks bleiben ohne /en', async () => {
		render(Page);
		const hrefs = internalHrefs(mainWithoutDiagnose());
		for (const file of FILE_LINKS) expect(hrefs).toContain(file);
		expect(hrefs.filter((h) => h.startsWith('/en'))).toEqual([]);
	});
});

describe('webmcp · EN (i18n C4b)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('rendert H1 literal und Absatz englisch, ohne lang="de"', async () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const main = mainWithoutDiagnose();
		expect(main.querySelector('h1')?.textContent).toBe('WebMCP');
		expect(main.textContent).toContain('WebMCP is a browser API that lets websites deliver');
		expect(main.querySelector('[lang="de"]')).toBeNull();
	});

	it('lässt Datei-Links unverändert und hat keine Seitenlinks nach /en/', async () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const hrefs = internalHrefs(mainWithoutDiagnose());
		for (const file of FILE_LINKS) expect(hrefs).toContain(file);
		expect(hrefs.filter((h) => !FILE_LINKS.includes(h))).toEqual([]);
	});

	it('enthält keinen deutschen Resttext', async () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const text = mainWithoutDiagnose().textContent ?? '';
		for (const word of [
			'Verfügbare Tools',
			'Begründung',
			'Status der Spec',
			'Einsatz in',
			'Quellen',
			'Adressen, Straßen'
		]) {
			expect(text).not.toContain(word);
		}
	});
});

describe('webmcp · DE-Wortlaut der Linklisten und Meta (i18n C4b)', () => {
	const lineOf = (li: Element): string => (li.textContent ?? '').replace(/\s+/g, ' ').trim();

	it('Canary-Schritte 1 und 4 und die Quellenliste behalten den Baseline-Wortlaut', () => {
		render(Page);
		const steps = [...document.querySelectorAll('main ol li')].map(lineOf);
		expect(steps[0]).toBe('Chrome Canary ab Version 149 installieren (oder Chrome Stable 149+).');
		expect(steps[3]).toBe(
			'Optional: Chrome-Team-Extension Model Context Tool Inspector installieren, um Tools zu inspizieren und manuell aufzurufen.'
		);
		const sources = [...document.querySelectorAll('main section:last-of-type li')].map(lineOf);
		expect(sources).toEqual([
			"WebMCP Editor's Draft, Web Machine Learning CG",
			'GitHub-Repository der Spec',
			'Patrick Brosset: WebMCP updates, clarifications, and next steps (Feb 2026)'
		]);
	});

	it('Meta-Title bleibt der Baseline-Titel', () => {
		render(Page);
		expect(document.title).toBe('WebMCP - Schnittstelle für KI-Assistenten - navigator.berlin');
	});
});

describe('webmcp · Browser-Support Stand September 2026', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	it.each([
		['de', 'Origin Trial ab Version 150', 'lehnt WebMCP ab', 'neutral'],
		['en', 'Origin trial from version 150', 'rejects WebMCP', 'neutral']
	] as const)(
		'%s: Edge, Firefox und Safari mit belegtem Stand, ohne Schätzung',
		(locale, edge, safari, firefox) => {
			overwriteGetLocale(() => locale);
			render(Page);
			const text = document.querySelector('main')?.textContent ?? '';
			expect(text).toContain(edge);
			expect(text).toContain(safari);
			expect(text).toContain(firefox);
			expect(text).not.toMatch(/Q3 2026|March 2026|März 2026/);
		}
	);
});
