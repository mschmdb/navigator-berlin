import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KuehleOrteTransparenz from './kuehle-orte-transparenz.svelte';

describe('KuehleOrteTransparenz (Story 16.4)', () => {
	it('rendert die drei Quellen-Namen', async () => {
		render(KuehleOrteTransparenz);
		await expect.element(page.getByText('OpenStreetMap', { exact: true })).toBeInTheDocument();
		await expect
			.element(page.getByText('Redaktionelle Anreicherung', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Deutscher Wetterdienst', { exact: true }))
			.toBeInTheDocument();
	});

	it('verlinkt /lizenzen für die volle Lizenz-Übersicht', async () => {
		render(KuehleOrteTransparenz);
		const link = (await page
			.getByTestId('transparenz-lizenzen-link')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toContain('/lizenzen');
	});

	it('Opt-out-Link ist mailto mit aria-label', async () => {
		render(KuehleOrteTransparenz);
		const link = (await page.getByTestId('kuehle-orte-opt-out').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')?.startsWith('mailto:')).toBe(true);
		expect(link.getAttribute('aria-label')).toBeTruthy();
	});
});

const flat = (el: Element): string => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('KuehleOrteTransparenz · DE-Wortlaut (i18n C4c)', () => {
	it('Überschriften, Lizenz-Hinweis und Opt-out behalten den Baseline-Wortlaut', () => {
		render(KuehleOrteTransparenz);
		const root = document.querySelector('section')!;
		expect(root.querySelector('h2')?.textContent).toBe('Transparenz und Quellen');
		expect(flat(root)).toContain('Die vollständige Lizenz-Übersicht steht auf der Lizenzen-Seite.');
		expect(root.querySelector('h3')?.textContent).toBe(
			'Ihre Einrichtung soll nicht gelistet sein?'
		);
		expect(flat(root)).toContain(
			'Schreiben Sie uns, wir tragen den Ort aus. Ein Klick öffnet einen vorbereiteten Entwurf.'
		);
		const optOut = root.querySelector('[data-testid="kuehle-orte-opt-out"]')!;
		expect(optOut.getAttribute('aria-label')).toBe(
			'Einrichtung aus der Kühle-Orte-Karte austragen lassen'
		);
		expect(flat(optOut)).toBe('Austragung anfragen');
		expect(
			root.querySelector('[data-testid="transparenz-lizenzen-link"]')?.getAttribute('href')
		).toBe('/lizenzen');
	});
});

describe('KuehleOrteTransparenz · EN (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('rendert englisch, Lizenzen-Link unter /en', () => {
		overwriteGetLocale(() => 'en');
		render(KuehleOrteTransparenz);
		const root = document.querySelector('section')!;
		expect(root.querySelector('h2')?.textContent).toBe('Transparency and sources');
		expect(flat(root)).toContain('The full licence overview is on the licences page.');
		expect(root.querySelector('h3')?.textContent).toBe("Don't want your venue listed?");
		const optOut = root.querySelector('[data-testid="kuehle-orte-opt-out"]')!;
		expect(optOut.getAttribute('aria-label')).toBe(
			'Have your venue removed from the cool places map'
		);
		expect(flat(optOut)).toBe('Request removal');
		expect(
			root.querySelector('[data-testid="transparenz-lizenzen-link"]')?.getAttribute('href')
		).toBe('/en/lizenzen');
		expect(root.querySelector('[lang="de"]')).toBeNull();
	});
});
