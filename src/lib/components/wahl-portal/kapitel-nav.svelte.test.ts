import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import KapitelNav from './kapitel-nav.svelte';

const CHAPTERS = [
	{ id: 'kopf', label: 'Kopf' },
	{ id: 'karte', label: 'Karte' },
	{ id: 'wechsel', label: 'Wechsel' }
];

describe('KapitelNav', () => {
	it('rendert eine nav mit aria-label "Kapitel" und einen Link pro Kapitel', async () => {
		render(KapitelNav, { chapters: CHAPTERS });
		const nav = page.getByRole('navigation', { name: 'Kapitel' });
		await expect.element(nav).toBeInTheDocument();
		for (const chapter of CHAPTERS) {
			await expect.element(page.getByTestId(`kapitel-nav-link-${chapter.id}`)).toBeInTheDocument();
		}
	});

	it('Links zeigen auf #id mit Label-Text', async () => {
		render(KapitelNav, { chapters: CHAPTERS });
		const link = (await page.getByTestId('kapitel-nav-link-karte').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('#karte');
		expect(link.textContent?.trim()).toBe('Karte');
	});

	it('erstes Kapitel ist initial aria-current (Fallback ohne IntersectionObserver-Treffer)', async () => {
		render(KapitelNav, { chapters: CHAPTERS });
		const first = (await page.getByTestId('kapitel-nav-link-kopf').element()) as HTMLElement;
		expect(first.getAttribute('aria-current')).toBe('true');
		const second = (await page.getByTestId('kapitel-nav-link-karte').element()) as HTMLElement;
		expect(second.hasAttribute('aria-current')).toBe(false);
	});

	it('Klick auf einen Link setzt aria-current sofort (User-Fund 19.09.)', async () => {
		render(KapitelNav, { chapters: CHAPTERS });
		await page.getByTestId('kapitel-nav-link-wechsel').click();
		const wechsel = (await page.getByTestId('kapitel-nav-link-wechsel').element()) as HTMLElement;
		expect(wechsel.getAttribute('aria-current')).toBe('true');
		const kopf = (await page.getByTestId('kapitel-nav-link-kopf').element()) as HTMLElement;
		expect(kopf.hasAttribute('aria-current')).toBe(false);
	});

	it('rendert leer ohne Fehler bei leerer Kapitel-Liste', async () => {
		render(KapitelNav, { chapters: [] });
		await expect.element(page.getByTestId('kapitel-nav')).toBeInTheDocument();
	});
});
