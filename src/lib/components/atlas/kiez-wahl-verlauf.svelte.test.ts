import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KiezWahlVerlauf, { type WahlVerlaufRow } from './kiez-wahl-verlauf.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const ROWS: WahlVerlaufRow[] = [
	{
		key: 'btw',
		typ: 'btw',
		stimmtyp: 'zweitstimme',
		jahre: [
			{ jahr: 2017, parteiKurzname: 'SPD' },
			{ jahr: 2021, parteiKurzname: 'Grüne' }
		]
	},
	{
		key: 'bvv',
		typ: 'bvv',
		stimmtyp: 'einstimme',
		jahre: [
			{ jahr: 2016, parteiKurzname: 'SPD' },
			{ jahr: 2021, parteiKurzname: 'Grüne' }
		]
	}
];

describe('kiez-wahl-verlauf.svelte', () => {
	it('rendert nichts bei leeren rows', async () => {
		render(KiezWahlVerlauf, { kiezName: 'Mitte', rows: [] });
		expect(document.querySelector('[data-testid="kiez-wahl-verlauf"]')).toBeNull();
	});

	it('rendert Überschrift, Intro mit Kiez-Namen und Typ/Stimmtyp-Zeilen (DE, Plural)', async () => {
		render(KiezWahlVerlauf, { kiezName: 'Mitte', rows: ROWS });
		const section = document.querySelector('[data-testid="kiez-wahl-verlauf"]');
		expect(section?.textContent).toMatch(/Wahl-Verlauf hier/);
		expect(section?.textContent).toMatch(/Im Kiez Mitte/);
		expect(section?.textContent).toMatch(/Bundestagswahlen/);
		expect(section?.textContent).toMatch(/Zweitstimmen/);
		expect(section?.textContent).toMatch(/BVV-Wahlen/);
	});

	it('Quellen-Zeile bleibt byte-identisch zum Alt-Verhalten', async () => {
		render(KiezWahlVerlauf, { kiezName: 'Mitte', rows: ROWS });
		const source = document.querySelector('[data-testid="kiez-wahl-verlauf-source"]');
		const normalized = source?.textContent?.replace(/\s+/g, ' ').trim();
		expect(normalized).toBe(
			'Wahlbezirksstatistik (Bundeswahlleiterin + Amt für Statistik Berlin-Brandenburg) · Lizenz dl-de/by-2-0'
		);
	});

	it('Methodik-Link zeigt auf /methodik/wahldaten', async () => {
		render(KiezWahlVerlauf, { kiezName: 'Mitte', rows: ROWS });
		const link = document.querySelector(
			'[data-testid="kiez-wahl-verlauf-methodik-link"]'
		) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/methodik/wahldaten');
	});

	// i18n Block B4a
	describe('opts.locale (EN)', () => {
		it('Typ/Stimmtyp-Plural + Intro + Quelle + Methodik-Link englisch', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezWahlVerlauf, { kiezName: 'Mitte', rows: ROWS });
			const section = document.querySelector('[data-testid="kiez-wahl-verlauf"]');
			expect(section?.textContent).toMatch(/Election history here/i);
			expect(section?.textContent).toMatch(/In Kiez Mitte,/);
			expect(section?.textContent).toMatch(/Bundestag elections/);
			expect(section?.textContent).toMatch(/party votes/);
			expect(section?.textContent).toMatch(/District Assembly \(BVV\) elections/);
			expect(section?.textContent).not.toMatch(/Bundestagswahlen/);
			const source = document.querySelector('[data-testid="kiez-wahl-verlauf-source"]');
			expect(source?.textContent).toMatch(/Licence dl-de\/by-2-0/);
			const link = document.querySelector(
				'[data-testid="kiez-wahl-verlauf-methodik-link"]'
			) as HTMLAnchorElement;
			expect(link.getAttribute('href')).toBe('/en/methodik/wahldaten');
			expect(link.textContent).toMatch(/Methodology/);
		});

		it('<ol>-aria-label übersetzt den Typ-Namen pro Zeile', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezWahlVerlauf, { kiezName: 'Mitte', rows: ROWS });
			const lists = document.querySelectorAll('[data-testid="kiez-wahl-verlauf"] ol');
			const ariaLabels = Array.from(lists).map((el) => el.getAttribute('aria-label'));
			expect(ariaLabels).toContain('Strongest party per year for Bundestag elections');
			expect(ariaLabels).toContain(
				'Strongest party per year for District Assembly (BVV) elections'
			);
		});
	});
});
