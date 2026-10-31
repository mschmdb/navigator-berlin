import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { HOME_DATA_SOURCES } from '$lib/content/home-data-sources.js';
import HomeTrust from './home-trust.svelte';

afterEach(() => overwriteGetLocale(() => 'de'));

describe('HomeTrust', () => {
	it('nennt alle Datenquellen', () => {
		render(HomeTrust);
		const text = document.querySelector('[data-testid="home-trust"]')!.textContent ?? '';
		for (const s of HOME_DATA_SOURCES) expect(text).toContain(s.name);
	});

	it('verlinkt Methodik, Daten, Lizenzen und Über', () => {
		render(HomeTrust);
		const hrefs = [...document.querySelectorAll('[data-testid="home-trust"] nav a')].map((a) =>
			a.getAttribute('href')
		);
		expect(hrefs).toEqual(['/methodik', '/daten', '/lizenzen', '/ueber']);
	});

	it('EN: Links tragen das /en-Präfix', () => {
		overwriteGetLocale(() => 'en');
		render(HomeTrust);
		const hrefs = [...document.querySelectorAll('[data-testid="home-trust"] nav a')].map((a) =>
			a.getAttribute('href')
		);
		expect(hrefs).toEqual(['/en/methodik', '/en/daten', '/en/lizenzen', '/en/ueber']);
	});

	it('erwähnt Cookies', () => {
		render(HomeTrust);
		expect(document.querySelector('[data-testid="home-trust"]')!.textContent).toMatch(/Cookie/);
	});

	it('enthält den Neutralitätssatz in DE und EN', () => {
		render(HomeTrust);
		expect(document.querySelector('[data-testid="home-trust"]')!.textContent).toContain(
			'bewertet weder Gegenden noch Menschen'
		);
		overwriteGetLocale(() => 'en');
		render(HomeTrust);
		expect(document.body.textContent).toContain('does not rate areas or people');
	});

	it('trennt Quellen mit Semikolon, damit Kommas in Namen lesbar bleiben', () => {
		render(HomeTrust);
		expect(document.querySelector('[data-testid="home-trust"]')!.textContent).toContain(
			'ODIS Berlin; SenMVKU, Umweltatlas; OpenStreetMap'
		);
	});
});
