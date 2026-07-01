import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import HomeHitzeTeaser from './home-hitze-teaser.svelte';

describe('HomeHitzeTeaser', () => {
	it('verlinkt die Hitze-Landing /hitze', async () => {
		render(HomeHitzeTeaser);
		const link = (await page.getByTestId('home-hitze-teaser-landing').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/hitze');
	});

	it('bietet einen Direkt-zur-Karte-Deep-Link mit mode=hitze', async () => {
		render(HomeHitzeTeaser);
		const link = (await page.getByTestId('home-hitze-teaser-map').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toContain('layers=kuehle-orte');
		expect(link.getAttribute('href')).toContain('mode=hitze');
	});
});
