import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { KAELTEHILFE_APP_URL } from '$lib/kaelte/hilfe-dienste.js';
import SchlafplatzHinweis from './schlafplatz-hinweis.svelte';

afterEach(() => overwriteGetLocale(() => 'de'));

describe('SchlafplatzHinweis', () => {
	it('DE: Frage, Text und Link auf die Kältehilfe-App', async () => {
		render(SchlafplatzHinweis);
		const box = await page.getByTestId('schlafplatz-hinweis').element();
		expect(box.textContent).toContain('Schlafplatz für heute Nacht?');
		expect(box.textContent).toContain('Nachtcafés und Notübernachtungen');
		const link = page.getByRole('link', { name: /Kältehilfe-App/ });
		await expect.element(link).toHaveAttribute('href', KAELTEHILFE_APP_URL);
	});

	it('öffnet ein neues Tab und sagt das Screenreadern', async () => {
		render(SchlafplatzHinweis);
		const link = await page.getByTestId('schlafplatz-app-link').element();
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
		expect(link.querySelector('.sr-only')?.textContent).toBe('(öffnet neuen Tab)');
	});

	it('EN: englischer Text, Kältehilfe in lang="de", keine em-dashes', async () => {
		overwriteGetLocale(() => 'en');
		render(SchlafplatzHinweis);
		const box = await page.getByTestId('schlafplatz-hinweis').element();
		expect(box.textContent).toContain('Need a bed for tonight?');
		expect(box.textContent?.includes('—')).toBe(false);
		expect(box.textContent?.includes('·')).toBe(false);
		const link = await page.getByTestId('schlafplatz-app-link').element();
		expect(link.getAttribute('href')).toBe(KAELTEHILFE_APP_URL);
		expect(link.querySelector('[lang="de"]')?.textContent).toBe('Kältehilfe');
		expect(link.querySelector('.sr-only')?.textContent).toBe('(opens in new tab)');
	});
});
