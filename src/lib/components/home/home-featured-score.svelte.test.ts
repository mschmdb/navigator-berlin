import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import HomeFeaturedScore from './home-featured-score.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const FEATURED = {
	slug: 'suedliche-luisenstadt',
	displayName: 'Suedliche Luisenstadt',
	composite: 64,
	ruheLuft: 50,
	gruenHitze: 46,
	mobilitaet: 41,
	versorgung: 77,
	wohnschutz: 100,
	exploreHref: '/explore?address=13.41320,52.49500&q=Suedliche%20Luisenstadt'
};

describe('HomeFeaturedScore', () => {
	it('rendert den Platzhalter-Score (prerender-safe) + Profil-Link', async () => {
		render(HomeFeaturedScore, { featured: FEATURED });
		const ph = document.querySelector('[data-testid="home-featured-score-placeholder"]');
		expect(ph?.textContent).toContain('64');
		const section = document.querySelector('[data-testid="home-featured-score"]');
		expect(section?.querySelector('a')?.getAttribute('href')).toBe(
			'/explore?address=13.41320,52.49500&q=Suedliche%20Luisenstadt'
		);
	});

	it('rendert nichts ohne Featured-Daten', async () => {
		render(HomeFeaturedScore, { featured: null });
		expect(document.querySelector('[data-testid="home-featured-score"]')).toBeNull();
	});

	// i18n Block B2 Review-Fund: der Link zur Karte ging bisher ohne
	// `localizedHref` raus, führte auf `/en` also fälschlich auf die DE-URL.
	// Ring selbst mounted in diesem Test-Setup nie (IntersectionObserver
	// feuert hier nicht, siehe Platzhalter-Test oben) -- die EN-Labels des
	// Rings deckt `kiez-score-ring.svelte.test.ts` separat ab.
	it('EN: Platzhalter zeigt "Overall", Kartenlink zeigt auf /en/explore', async () => {
		overwriteGetLocale(() => 'en');
		render(HomeFeaturedScore, { featured: FEATURED });
		const ph = document.querySelector('[data-testid="home-featured-score-placeholder"]');
		expect(ph?.textContent).toContain('Overall');
		expect(ph?.textContent).toContain('64');
		const section = document.querySelector('[data-testid="home-featured-score"]');
		expect(section?.querySelector('a')?.getAttribute('href')).toBe(
			'/en/explore?address=13.41320,52.49500&q=Suedliche%20Luisenstadt'
		);
	});
});
