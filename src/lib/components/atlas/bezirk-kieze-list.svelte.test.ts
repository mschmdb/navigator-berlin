import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import BezirkKiezeList from './bezirk-kieze-list.svelte';
import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const KIEZE: KiezListEntry[] = [
	{
		slug: 'prenzlauer-berg',
		name: 'Prenzlauer Berg',
		composite: 78,
		rang: 12,
		quartil: 1,
		total: 143
	},
	{
		slug: 'pankow-zentrum',
		name: 'Pankow Zentrum',
		composite: 55,
		rang: 70,
		quartil: 2,
		total: 143
	},
	{ slug: 'buchholz', name: 'Buchholz', composite: null, rang: null, quartil: null, total: 0 },
	{ slug: 'schlecht', name: 'Aschlecht', composite: 12, rang: 140, quartil: 4, total: 143 }
];

function names(): string[] {
	return [...document.querySelectorAll('[data-testid="bezirk-kieze-link"]')].map(
		(el) => el.textContent?.trim() ?? ''
	);
}

function ariaSort(testid: string): string | null {
	return (
		document.querySelector(`[data-testid="${testid}"]`)?.closest('th')?.getAttribute('aria-sort') ??
		null
	);
}

describe('bezirk-kieze-list.svelte', () => {
	it('rendert Headline und alle Kieze, Score absteigend, ohne Score am Ende', async () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		const h2 = page.getByRole('heading', { level: 2 });
		await expect.element(h2).toHaveTextContent(/Kieze im Bezirk Pankow/);
		expect(names()).toEqual(['Prenzlauer Berg', 'Pankow Zentrum', 'Aschlecht', 'Buchholz']);
		expect(ariaSort('bezirk-kieze-sort-score')).toBe('descending');
		expect(ariaSort('bezirk-kieze-sort-name')).toBe('none');
	});

	it('Links verweisen auf /kiez/{slug}', () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		const link = document.querySelector('[data-testid="bezirk-kieze-link"]');
		expect(link?.getAttribute('href')).toBe('/kiez/prenzlauer-berg');
	});

	it('zeigt Score, Strich ohne Score und Rang mit Anti-Stigma-Wortlaut', () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		const section = document.querySelector('[data-testid="bezirk-kieze-list"]') as HTMLElement;
		expect(section.textContent).toContain('78');
		expect(section.textContent).toContain('Platz 12 von 143');
		expect(section.textContent).toContain('unteres Viertel');
		expect(section.textContent).not.toContain('Platz 140');
		const rows = section.querySelectorAll('tbody tr');
		expect(rows[3].textContent).toContain('–');
	});

	it('sortiert per Klick auf Name und aktualisiert aria-sort', async () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		await page.getByTestId('bezirk-kieze-sort-name').click();
		expect(names()).toEqual(['Aschlecht', 'Buchholz', 'Pankow Zentrum', 'Prenzlauer Berg']);
		expect(ariaSort('bezirk-kieze-sort-name')).toBe('ascending');
		expect(ariaSort('bezirk-kieze-sort-score')).toBe('none');
		await page.getByTestId('bezirk-kieze-sort-name').click();
		expect(ariaSort('bezirk-kieze-sort-name')).toBe('descending');
		expect(names()[0]).toBe('Prenzlauer Berg');
	});

	it('kehrt die Score-Sortierung um, ohne Score bleibt am Ende', async () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		await page.getByTestId('bezirk-kieze-sort-score').click();
		expect(names()).toEqual(['Aschlecht', 'Pankow Zentrum', 'Prenzlauer Berg', 'Buchholz']);
		expect(ariaSort('bezirk-kieze-sort-score')).toBe('ascending');
	});

	it('startet ohne Scores alphabetisch', () => {
		const ohne = KIEZE.map((k) => ({ ...k, composite: null, rang: null, quartil: null, total: 0 }));
		render(BezirkKiezeList, { kieze: ohne, bezirkName: 'Pankow' });
		expect(names()).toEqual(['Aschlecht', 'Buchholz', 'Pankow Zentrum', 'Prenzlauer Berg']);
		expect(ariaSort('bezirk-kieze-sort-name')).toBe('ascending');
	});

	it('Sortier-Button behält den sichtbaren Text im Namen (WCAG 2.5.3)', () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		const btn = document.querySelector('[data-testid="bezirk-kieze-sort-name"]');
		expect(btn?.hasAttribute('aria-label')).toBe(false);
		expect(btn?.textContent).toContain('Kiez');
		expect(btn?.querySelector('.sr-only')?.textContent).toContain('Nach Name sortieren');
	});

	it('liest Score-Text und Strich als sr-only-Text', () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		const rows = document.querySelectorAll('tbody tr');
		expect(rows[0].querySelector('td .sr-only')?.textContent).toContain('Kiez-Score 78 von 100');
		expect(rows[3].querySelector('td [aria-hidden="true"]')?.textContent).toBe('–');
		expect(rows[3].querySelector('td .sr-only')?.textContent).toContain('ohne Score');
	});

	it('sagt den Sortierwechsel an', async () => {
		const live = document.createElement('div');
		live.id = 'global-aria-live';
		document.body.appendChild(live);
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		await page.getByTestId('bezirk-kieze-sort-name').click();
		expect(live.textContent).toBe('Liste sortiert nach Kiez, aufsteigend.');
		live.remove();
	});

	it('blendet die Rang-Spalte aus, wenn kein Kiez einen Rang hat', () => {
		const ohneRang = KIEZE.map((k) => ({ ...k, rang: null, quartil: null, total: 0 }));
		render(BezirkKiezeList, { kieze: ohneRang, bezirkName: 'Pankow' });
		const section = document.querySelector('[data-testid="bezirk-kieze-list"]') as HTMLElement;
		expect(section.querySelectorAll('thead th')).toHaveLength(2);
		expect(section.textContent).not.toContain('Rang in Berlin');
		expect(section.querySelectorAll('tbody tr')[0].querySelectorAll('th, td')).toHaveLength(2);
	});

	it('rendert nichts wenn Kieze leer', () => {
		render(BezirkKiezeList, { kieze: [], bezirkName: 'Mitte' });
		expect(document.querySelector('[data-testid="bezirk-kieze-list"]')).toBeNull();
	});

	describe('EN', () => {
		it('Headline, Aria-Labels und Link mit /en-Präfix englisch', async () => {
			overwriteGetLocale(() => 'en');
			render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
			const h2 = page.getByRole('heading', { level: 2 });
			await expect.element(h2).toHaveTextContent(/Kieze in Bezirk Pankow/);
			const link = document.querySelector('[data-testid="bezirk-kieze-link"]');
			expect(link?.getAttribute('href')).toBe('/en/kiez/prenzlauer-berg');
			const section = document.querySelector('[data-testid="bezirk-kieze-list"]') as HTMLElement;
			expect(section.textContent).toContain('Kiez score 78 of 100');
			expect(section.textContent).toContain('Rank in Berlin');
			expect(section.textContent).toContain('Rank 12 of 143');
		});
	});
});
