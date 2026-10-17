import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import HomeKaelteTeaser from './home-kaelte-teaser.svelte';

describe('HomeKaelteTeaser', () => {
	it('verlinkt die Kälte-Landing /kaelte', async () => {
		render(HomeKaelteTeaser);
		const link = (await page
			.getByTestId('home-kaelte-teaser-landing')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/kaelte');
	});

	it('bietet einen Direkt-zur-Karte-Deep-Link mit Warme-Orte-Layer und mode=kaelte', async () => {
		render(HomeKaelteTeaser);
		const link = (await page.getByTestId('home-kaelte-teaser-map').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toContain('layers=waerme-orte');
		expect(link.getAttribute('href')).toContain('mode=kaelte');
	});

	it('zeigt die Lead nur in der großen Variante', async () => {
		const big = render(HomeKaelteTeaser);
		expect(document.querySelector('[data-testid="home-kaelte-teaser-lead"]')).not.toBeNull();
		big.unmount();
		render(HomeKaelteTeaser, { compact: true });
		expect(document.querySelector('[data-testid="home-kaelte-teaser-lead"]')).toBeNull();
		expect(document.querySelector('[data-testid="home-kaelte-teaser-landing"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="home-kaelte-teaser-eyebrow"]')).toBeNull();
	});
});
