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
