import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
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
