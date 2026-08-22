import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HomeFinderTeaser from './home-finder-teaser.svelte';
import { HOME_SCREENSHOTS } from '$lib/content/screenshot-manifest.js';

describe('home-finder-teaser', () => {
	it('rendert Section mit Überschrift, Beispiel-Wünschen als Text und CTA-Link', async () => {
		render(HomeFinderTeaser, {});
		const section = (await page.getByTestId('home-finder-teaser').element()) as HTMLElement;
		expect(section.tagName).toBe('SECTION');
		expect(section.querySelector('h2')?.textContent).toContain('Sag der Karte');
		expect(section.textContent).toMatch(/ruhig/i);
		const cta = section.querySelector('a[data-testid="home-finder-teaser-cta"]');
		expect(cta?.getAttribute('href')).toBe('/explore?finder=1');
	});

	it('zeigt den Finder-Screenshot aus dem Manifest, lazy geladen', async () => {
		render(HomeFinderTeaser, {});
		const section = (await page.getByTestId('home-finder-teaser').element()) as HTMLElement;
		const img = section.querySelector('img');
		expect(img?.getAttribute('src')).toBe(HOME_SCREENSHOTS.kiezFinder.path);
		expect(img?.getAttribute('loading')).toBe('lazy');
		expect(img?.getAttribute('alt')).toBe(HOME_SCREENSHOTS.kiezFinder.alt);
	});

	it('Beispiel-Wünsche sind echter Text, kein Bild-Alt', async () => {
		render(HomeFinderTeaser, {});
		const section = (await page.getByTestId('home-finder-teaser').element()) as HTMLElement;
		const chips = section.querySelectorAll('[data-testid="home-finder-beispiel"]');
		expect(chips.length).toBeGreaterThanOrEqual(3);
	});
});
