import { describe, expect, it } from 'vitest';
import { buildFeaturedScore } from './featured-score.js';

const ROW = {
	slug: 'suedliche-luisenstadt',
	composite: 64.2,
	ruheLuft: 64.4,
	gruenHitze: 51.2,
	mobilitaet: 33.1,
	versorgung: 77.3,
	wohnschutz: 100
};

describe('buildFeaturedScore', () => {
	it('übernimmt Gesamt und alle fünf Dimensionen aus der Kiez-Score-Zeile (gleiche Quelle wie die Rangliste)', () => {
		const featured = buildFeaturedScore(ROW, 'Südliche Luisenstadt', [13.4132, 52.495]);
		expect(featured.composite).toBe(ROW.composite);
		expect(featured.ruheLuft).toBe(ROW.ruheLuft);
		expect(featured.gruenHitze).toBe(ROW.gruenHitze);
		expect(featured.mobilitaet).toBe(ROW.mobilitaet);
		expect(featured.versorgung).toBe(ROW.versorgung);
		expect(featured.wohnschutz).toBe(ROW.wohnschutz);
	});

	it('zeigt dieselbe gerundete Gesamtzahl wie die Rangliste', () => {
		const featured = buildFeaturedScore(ROW, 'Südliche Luisenstadt', [13.4132, 52.495]);
		expect(Math.round(featured.composite ?? -1)).toBe(Math.round(ROW.composite));
	});

	it('reicht fehlende Dimensionen als null durch', () => {
		const featured = buildFeaturedScore(
			{ ...ROW, mobilitaet: null, wohnschutz: null },
			'Südliche Luisenstadt',
			[13.4132, 52.495]
		);
		expect(featured.mobilitaet).toBeNull();
		expect(featured.wohnschutz).toBeNull();
	});

	it('baut den Karten-Link auf den Kiez-Mittelpunkt mit 5 Nachkommastellen und kodiertem Namen', () => {
		const featured = buildFeaturedScore(ROW, 'Südliche Luisenstadt', [13.413201234, 52.49500987]);
		expect(featured.slug).toBe('suedliche-luisenstadt');
		expect(featured.displayName).toBe('Südliche Luisenstadt');
		expect(featured.exploreHref).toBe(
			'/explore?address=13.41320,52.49501&q=S%C3%BCdliche%20Luisenstadt'
		);
	});
});
