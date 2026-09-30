import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { internalHrefs, textLines } from '../methodik-test-utils.js';

describe('methodik/wahldaten +page.svelte (Story 17: Briefwahl-Gruppen)', () => {
	it('Anker #wahldaten-briefwahl und #aggregation bleiben erhalten', () => {
		render(Page);
		expect(document.getElementById('wahldaten-briefwahl')).not.toBeNull();
		expect(document.getElementById('aggregation')).not.toBeNull();
	});

	it('TOC-Link auf #wahldaten-briefwahl liest „3. Briefwahl-Gruppen"', () => {
		render(Page);
		const link = document.querySelector('a[href="#wahldaten-briefwahl"]');
		expect(link?.textContent?.trim()).toBe('3. Briefwahl-Gruppen');
	});

	it('Abschnitt 3 nennt Briefwahl-Gruppen statt Asymmetrie und linkt auf #aggregation', () => {
		render(Page);
		const section = document.getElementById('wahldaten-briefwahl');
		const text = section?.textContent ?? '';
		expect(text).toMatch(/Briefwahl-Gruppen/);
		expect(text).toMatch(/kleinste Ebene/);
		expect(text).not.toMatch(/Briefwahl-Asymmetrie/);
		expect(text).not.toMatch(/pre-2021/);
		expect(text).not.toMatch(/Schraffur/);
		expect(section?.querySelector('a[href="#aggregation"]')).not.toBeNull();
	});

	it('Abschnitt 4 nennt anteilige Briefwahl-Verteilung statt Ausschluss', () => {
		render(Page);
		const section = document.getElementById('aggregation');
		const text = section?.textContent ?? '';
		expect(text).toMatch(/anteilig/);
		expect(text).toMatch(/Schätzung, keine amtliche Aufteilung/);
		expect(text).not.toMatch(/Kiez-Aggregat ausgeschlossen/);
		expect(text).not.toMatch(/ausgeschlossen, weil sie keinen räumlichen Bezug/);
	});
});

describe('methodik/wahldaten +page.svelte (Wahlen 2026: Stand auf Prod-Daten bringen)', () => {
	it('Abschnitt 2 pinnt die vollständigen Jahreslisten, je eine pro <li>, ohne Phase/Backlog', () => {
		render(Page);
		const section = document.getElementById('cutoff');
		const items = Array.from(section?.querySelectorAll('li') ?? []).map((li) =>
			(li.textContent ?? '').replace(/\s+/g, ' ').trim()
		);
		expect(items).toContain('Bundestagswahlen: 2013, 2017, 2021, 2025');
		expect(items).toContain(
			'Abgeordnetenhauswahlen: 2011, 2016, 2021, 2023 (Wiederholung), 2026 (vorläufig)'
		);
		expect(items).toContain(
			'Bezirksverordneten-Versammlungen: 2011, 2016, 2021, 2023 (Wiederholung), 2026 (vorläufig)'
		);
		const text = section?.textContent ?? '';
		expect(text).not.toMatch(/Phase 1/);
		expect(text).not.toMatch(/Backlog/);
	});

	it('Abschnitt 6: 2026 im Polygon-Satz mit AGH + BVV, BTW 2013 und AGH + BVV 2011 im Ohne-Geometrie-Satz', () => {
		render(Page);
		const section = document.getElementById('geometrien');
		const firstParagraph = (section?.querySelector('p')?.textContent ?? '')
			.replace(/\s+/g, ' ')
			.trim();
		const [polygonSentence, noGeoSentence] = firstParagraph.split(/(?<=\.)\s+/);
		expect(polygonSentence).toMatch(
			/AGH \+ BVV 2016, 2021 \(verwendet auch für 2023-Wiederholung\) und 2026\.$/
		);
		expect(polygonSentence).not.toMatch(/BTW 2013/);
		expect(noGeoSentence).toMatch(/^BTW 2013 sowie AGH \+ BVV 2011 besitzen keine/);
		const text = section?.textContent ?? '';
		expect(text).not.toMatch(/pre-2011/);
		expect(text).not.toMatch(/Memory/);
	});

	it('Abschnitt 7 bindet die Endergebnis-Termine an BVV/AGH und zeigt Wahltag, Stand und Quelle', () => {
		render(Page);
		const section = document.getElementById('update-cadence');
		const text = (section?.textContent ?? '').replace(/\s+/g, ' ');
		expect(text).toMatch(/20\.09\.2026/);
		expect(text).toMatch(/21\.09\.2026/);
		expect(text).toMatch(/wahlen-berlin\.de/);
		expect(text).toMatch(/30\.09\.2026\s*\(BVV\)/);
		expect(text).toMatch(/05\.\s*bis\s*08\.10\.2026\s*\(AGH\)/);
		expect(text).toMatch(/wo verfügbar/);
		expect(text).toMatch(/vorläufig/);
		expect(text).not.toMatch(/Memory/);
		expect(text).not.toMatch(/pnpm/);
	});

	it('kein Phase-1/Backlog/Memory/pnpm im sichtbaren Seitentext', () => {
		const { container } = render(Page);
		const text = container.textContent ?? '';
		expect(text).not.toMatch(/Phase 1/);
		expect(text).not.toMatch(/Backlog/);
		expect(text).not.toMatch(/Memory/);
		expect(text).not.toMatch(/pnpm/);
	});
});

describe('methodik/wahldaten · DE-Parität (i18n C4b)', () => {
	it('sichtbarer DE-Text entspricht dem festgehaltenen Stand', async () => {
		render(Page);
		const article = document.querySelector('[data-testid="wahl-methodik-page"]')!;
		await expect(textLines(article)).toMatchFileSnapshot('./__snapshots__/wahldaten-de.txt');
	});
});

describe('methodik/wahldaten · DE-Links (i18n C4b)', () => {
	it('interne Links bleiben ohne Locale-Präfix', () => {
		render(Page);
		const article = document.querySelector('[data-testid="wahl-methodik-page"]')!;
		const hrefs = internalHrefs(article);
		expect(hrefs).toEqual([
			'/',
			'/methodik',
			'/methodik/cross-layer-templates',
			'/berlin-wahlen#alle-wahlen'
		]);
	});

	it('H1 trägt kein lang="de" mehr, die Seite gibt die Sprache vor', () => {
		render(Page);
		expect(document.querySelector('h1')?.hasAttribute('lang')).toBe(false);
	});
});

describe('methodik/wahldaten · EN (i18n C4b)', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	it('rendert H1, Lead und Abschnittsüberschriften auf Englisch', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		expect(document.querySelector('h1')?.textContent?.trim()).toBe('Methodology · Election data');
		const headings = [...document.querySelectorAll('h2')].map((h) => h.textContent?.trim());
		expect(headings).toEqual([
			'1. Data sources',
			'2. Data cutoff',
			'3. Postal-vote groups',
			'4. Polling district to Kiez aggregation',
			'5. Repeat election 2023',
			'6. Geometries + coverage',
			'7. Update cadence',
			'8. Party aliases',
			'9. Cross-layer linking'
		]);
		const toc = document.querySelector('nav[aria-label="Contents"]');
		expect(toc?.querySelectorAll('a').length).toBe(9);
	});

	it('setzt „provisional“ an den Stellen von „vorläufig“ und lässt kein deutsches Wort stehen', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const cutoff = document.getElementById('cutoff')?.textContent ?? '';
		expect(cutoff.match(/\(provisional\)/g)?.length).toBe(2);
		const cadence = document.getElementById('update-cadence')?.textContent ?? '';
		expect(cadence).toContain('provisional official result');
		expect(cadence).toContain('“provisional”');
		expect(cadence).toContain('20 September 2026');
		expect(cadence).toContain('5 to 8 October 2026');
		const text = document.querySelector('[data-testid="wahl-methodik-page"]')?.textContent ?? '';
		for (const german of ['vorläufig', 'Datenquellen', 'Briefwahl-Gruppen', 'Wiederholungswahl']) {
			expect(text, german).not.toContain(german);
		}
	});

	it('Seiten-Links laufen unter /en, Anker und externe Links bleiben', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const article = document.querySelector('[data-testid="wahl-methodik-page"]')!;
		expect(internalHrefs(article)).toEqual([
			'/en/',
			'/en/methodik',
			'/en/methodik/cross-layer-templates',
			'/en/berlin-wahlen#alle-wahlen'
		]);
		expect(
			document.getElementById('wahldaten-briefwahl')?.querySelector('a[href="#aggregation"]')
		).not.toBeNull();
		expect(document.querySelector('a[href="https://www.wahlen-berlin.de"]')?.textContent).toBe(
			'wahlen-berlin.de'
		);
	});

	it('trägt kein lang="de"', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		expect(document.querySelector('[lang="de"]')).toBeNull();
	});

	it('Code-Spans bleiben unverändert', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const codes = [...document.querySelectorAll('code')].map((c) => c.textContent);
		expect(codes).toContain('is_repeat_election');
		expect(codes).toContain('RBS_OD_Wahllokale_AH23.zip');
		expect(codes).toContain('keep-shapes');
	});
});

describe('methodik/wahldaten · Meta und JSON-LD (i18n C4b)', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	it('DE: Meta-Title bleibt der Baseline-Titel', () => {
		render(Page);
		expect(document.title).toBe('Methodik · Wahldaten · navigator.berlin');
	});

	it('EN: Breadcrumb-JSON-LD nennt lokalisierte Pfade inklusive Wurzel', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const crumbs = JSON.parse(
			document.querySelector('script[data-testid="wahldaten-breadcrumb-jsonld"]')?.textContent ??
				'{}'
		);
		expect(crumbs.itemListElement[0].item).toMatch(/\/en\/$/);
		expect(crumbs.itemListElement[1].item).toMatch(/\/en\/methodik$/);
		expect(crumbs.itemListElement[2].item).toMatch(/\/en\/methodik\/wahldaten$/);
	});
});
