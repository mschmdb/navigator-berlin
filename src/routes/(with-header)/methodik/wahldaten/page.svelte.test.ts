import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

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
