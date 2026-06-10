import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HomeFeaturedScore from './home-featured-score.svelte';

const FEATURED = {
	slug: 'suedliche-luisenstadt',
	displayName: 'Suedliche Luisenstadt',
	composite: 64,
	ruheLuft: 50,
	gruenHitze: 46,
	mobilitaet: 41,
	versorgung: 77,
	wohnschutz: 100
};

describe('HomeFeaturedScore', () => {
	it('rendert den Platzhalter-Score (prerender-safe) + Profil-Link', async () => {
		render(HomeFeaturedScore, { featured: FEATURED });
		const ph = document.querySelector('[data-testid="home-featured-score-placeholder"]');
		expect(ph?.textContent).toContain('64');
		const section = document.querySelector('[data-testid="home-featured-score"]');
		expect(section?.querySelector('a')?.getAttribute('href')).toBe('/explore');
	});

	it('rendert nichts ohne Featured-Daten', async () => {
		render(HomeFeaturedScore, { featured: null });
		expect(document.querySelector('[data-testid="home-featured-score"]')).toBeNull();
	});
});
