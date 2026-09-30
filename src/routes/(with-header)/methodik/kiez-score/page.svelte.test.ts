import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { internalHrefs, textLines } from '../methodik-test-utils.js';
import Page from './+page.svelte';

/**
 * Story 2.9a · AC-6 Methodik-Doku.
 *
 * Verifiziert dass die /methodik/kiez-score-Page um die Sections für
 * Kiez-Score (Bezirksregion) und Bezirks-Score erweitert wurde.
 */

describe('methodik/kiez-score · Bezirks-Score-Erweiterung (Story 2.9a)', () => {
	it('rendert section#kiez-score mit Bezirksregion-Aggregations-Erklärung', async () => {
		render(Page, { props: {} });
		const sec = document.getElementById('kiez-score');
		expect(sec, 'section#kiez-score fehlt').not.toBeNull();
		expect(sec?.tagName).toBe('SECTION');
		expect(sec?.textContent ?? '').toMatch(/Bezirksregion/);
		expect(sec?.textContent ?? '').toMatch(/flächen-gewichtet/i);
		expect(sec?.textContent ?? '').toMatch(/50 Prozent/);
	});

	it('rendert section#bezirks-score mit Stigma-Hinweis und Pipeline-Befehl', async () => {
		render(Page, { props: {} });
		const sec = document.getElementById('bezirks-score');
		expect(sec, 'section#bezirks-score fehlt').not.toBeNull();
		expect(sec?.tagName).toBe('SECTION');
		expect(sec?.textContent ?? '').toMatch(/Gesamt-Choropleth/);
		expect(sec?.textContent ?? '').toMatch(/data:aggregate-scores/);
	});

	it('TOC enthält Anker zu #kiez-score und #bezirks-score', async () => {
		render(Page, { props: {} });
		const tocKiez = document.querySelector('a[href="#kiez-score"]');
		const tocBezirk = document.querySelector('a[href="#bezirks-score"]');
		expect(tocKiez, 'TOC-Link #kiez-score fehlt').not.toBeNull();
		expect(tocBezirk, 'TOC-Link #bezirks-score fehlt').not.toBeNull();
	});

	it('verwendet nicht den Begriff „lebenswert" (Stigma-Lint)', async () => {
		render(Page, { props: {} });
		const article = document.querySelector('[data-testid="methodik-kiez-score-page"]');
		const text = (article?.textContent ?? '').toLowerCase();
		expect(text, 'methodik-page enthält „lebenswert"').not.toMatch(/lebenswert/);
	});
});

describe('methodik/kiez-score · DE unverändert (i18n C4a)', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	it('sichtbarer DE-Text entspricht dem festgehaltenen Stand vor C4a', async () => {
		render(Page, { props: {} });
		const article = document.querySelector('[data-testid="methodik-kiez-score-page"]')!;
		await expect(textLines(article)).toMatchFileSnapshot('./__snapshots__/kiez-score-de.txt');
	});

	it('DE-Links bleiben ohne Locale-Präfix', async () => {
		render(Page, { props: {} });
		const article = document.querySelector('[data-testid="methodik-kiez-score-page"]')!;
		const hrefs = internalHrefs(article);
		expect(hrefs).toContain('/methodik');
		expect(hrefs).toContain('/lizenzen');
		expect(hrefs.some((h) => h.startsWith('/en'))).toBe(false);
	});
});

describe('methodik/kiez-score · EN (i18n C4a)', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	it('rendert H1, Lead und Breadcrumb auf Englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { props: {} });
		expect(
			document.querySelector('[data-testid="methodik-kiez-score-h1"]')?.textContent?.trim()
		).toBe('Environment & infrastructure score');
		const crumb = document.querySelector('[data-testid="methodik-kiez-score-breadcrumb"]');
		expect(crumb?.getAttribute('aria-label')).toBe('Breadcrumb');
		expect(crumb?.textContent).toContain('Methodology');
		expect(crumb?.textContent).toContain('Kiez score');
	});

	it('Dimensionsliste übernimmt die Namen der bestehenden Atlas-Messages', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { props: {} });
		const labels = [...document.querySelectorAll('#dimensionen li > p:first-child')].map((p) =>
			p.textContent?.trim()
		);
		expect(labels.slice(0, 5)).toEqual([
			'Quiet & air',
			'Green & heat',
			'Mobility',
			'Local amenities',
			'Tenant protection'
		]);
		expect(labels[5]).toBe('Culture (standalone, not in the overall score)');
		const weightRows = [...document.querySelectorAll('#gewichte tbody tr td:first-child')].map(
			(td) => td.textContent?.replace(/\s+/g, ' ').trim()
		);
		expect(weightRows).toContain('Culture (not in the overall score)');
		expect(weightRows).toContain('Recorded crime (not in the overall score)');
	});

	it('alle internen Links liegen unter /en', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { props: {} });
		const article = document.querySelector('[data-testid="methodik-kiez-score-page"]')!;
		const hrefs = internalHrefs(article);
		expect(hrefs.length).toBeGreaterThanOrEqual(3);
		expect(hrefs.filter((h) => !h.startsWith('/en/'))).toEqual([]);
		expect(hrefs).toContain('/en/methodik');
		expect(hrefs).toContain('/en/lizenzen');
		expect(
			document.querySelector('[data-testid="methodik-kiez-score-back-link"]')?.getAttribute('href')
		).toBe('/en/methodik');
	});

	it('trägt kein lang="de" und keinen deutschen Resttext', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { props: {} });
		const article = document.querySelector('[data-testid="methodik-kiez-score-page"]')!;
		expect(article.querySelector('[lang="de"]')).toBeNull();
		const text = article.textContent ?? '';
		for (const german of [
			'Worum es geht',
			'Dimensionen',
			'Gewichte',
			'Normalisierung',
			'Sozialstruktur'
		]) {
			expect(text, german).not.toContain(german);
		}
	});

	it('Code-Spans der Build-Pipeline bleiben unverändert', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { props: {} });
		const codes = [...document.querySelectorAll('#bezirks-score code')].map((c) => c.textContent);
		expect(codes).toEqual(['pnpm data:aggregate-scores', 'bezirk_score', 'kiez_score']);
	});

	it('Breadcrumb-JSON-LD nennt lokalisierte Pfade', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { props: {} });
		const crumbs = JSON.parse(
			document.querySelector('script[data-testid="methodik-kiez-score-breadcrumb-jsonld"]')
				?.textContent ?? '{}'
		);
		expect(crumbs.itemListElement[0].item).toMatch(/\/en\/$/);
		expect(crumbs.itemListElement[1].item).toMatch(/\/en\/methodik$/);
		expect(crumbs.itemListElement[2].item).toMatch(/\/en\/methodik\/kiez-score$/);
	});

	it('Feedback-Mail trägt den englischen Betreff, JSON-LD folgt der Locale', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { props: {} });
		expect(document.querySelector('#feedback a[href^="mailto:"]')?.getAttribute('href')).toContain(
			'subject=Kiez%20score%20methodology'
		);
		const speakable = JSON.parse(
			document.querySelector('script[data-testid="methodik-kiez-score-speakable-jsonld"]')
				?.textContent ?? '{}'
		);
		expect(speakable.name).toBe('Methodology of the environment & infrastructure score');
		expect(speakable.inLanguage).toBe('en-US');
		expect(speakable.url).toMatch(/\/en\/methodik\/kiez-score$/);
	});
});
