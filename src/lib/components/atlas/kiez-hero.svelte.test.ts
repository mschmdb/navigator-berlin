import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KiezHero from './kiez-hero.svelte';
import type { KiezProfile } from '$lib/data/types.js';
import type { InferSelectModel } from 'drizzle-orm';
import type { kiezStats } from '$lib/server/db/schema/index.js';
import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';

type KiezStatsRow = InferSelectModel<typeof kiezStats>;

const baseProfile: KiezProfile = {
	slug: 'boxhagener-kiez',
	name: 'Boxhagener Kiez',
	bezirk: 'Friedrichshain-Kreuzberg',
	einwohner: 18500,
	flaecheHa: 122,
	centroid: [13.46, 52.51],
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[13.45, 52.5],
				[13.47, 52.5],
				[13.47, 52.52],
				[13.45, 52.52],
				[13.45, 52.5]
			]
		]
	},
	layerCoverage: []
};

const scoreFixture: KiezScore = {
	slug: 'boxhagener-kiez',
	bezirkSlug: 'friedrichshain-kreuzberg',
	composite: 47,
	ruheLuft: 30,
	gruenHitze: 35,
	mobilitaet: 65,
	versorgung: 70,
	wohnschutz: 55,
	computedAt: new Date('2026-05-16T00:00:00Z')
};

const statsFixture: KiezStatsRow = {
	slug: 'boxhagener-kiez',
	bezirkSlug: 'friedrichshain-kreuzberg',
	laerm: {
		dominantCategory: { value: 'hoch', layer: 'laerm-2023', sourceUpdatedAt: '2023-06-01' },
		categoryDistribution: null
	},
	luft: { dominantCategory: null, categoryDistribution: null },
	gruen: {
		dominantVersorgung: { value: 'mittel', layer: 'gruenversorgung-2023', sourceUpdatedAt: '2023-09-01' },
		gruenanlagenCount: null,
		spielplaetzeCount: null
	} as unknown as KiezStatsRow['gruen'],
	klima: { meanPet: null, hotDays: null } as unknown as KiezStatsRow['klima'],
	wohnen: { dominantWohnlage: null, dominantMss: null } as unknown as KiezStatsRow['wohnen'],
	oepnv: { stopsPerKm2: null } as unknown as KiezStatsRow['oepnv'],
	bildung: {} as KiezStatsRow['bildung'],
	heritage: {} as KiezStatsRow['heritage'],
	computedAt: new Date('2026-05-16T00:00:00Z')
};

describe('KiezHero.svelte', () => {
	it('rendert h1 mit Kiez-Name', async () => {
		render(KiezHero, { profile: baseProfile, stats: null, score: null, faq: [] });
		expect(document.querySelector('[data-testid="kiez-hero"] h1')?.textContent).toBe(
			'Boxhagener Kiez'
		);
	});

	it('rendert parent-Bezirk als Subline', async () => {
		render(KiezHero, { profile: baseProfile, stats: null, score: null, faq: [] });
		const hero = document.querySelector('[data-testid="kiez-hero"]');
		expect(hero?.textContent).toMatch(/Bezirk Friedrichshain-Kreuzberg/);
	});

	it('Lead enthält Einwohner-Zahl + Bezirks-Hinweis', async () => {
		render(KiezHero, { profile: baseProfile, stats: null, score: null, faq: [] });
		const hero = document.querySelector('[data-testid="kiez-hero"]');
		expect(hero?.textContent).toMatch(/18\.500/);
		expect(hero?.textContent).toMatch(/122 ha/);
	});

	it('zeigt Score-Section wenn score vorhanden (composite + 5 ADR-015-Dimensionen)', async () => {
		render(KiezHero, { profile: baseProfile, stats: null, score: scoreFixture, faq: [] });
		const scoreSec = document.querySelector('[data-testid="kiez-score"]');
		expect(scoreSec).not.toBeNull();
		expect(scoreSec?.textContent).toMatch(/47/);
		expect(scoreSec?.textContent).toMatch(/Ruhe & Luft/);
		expect(scoreSec?.textContent).toMatch(/Grün & Hitze/);
		expect(scoreSec?.textContent).toMatch(/Mobilität/);
		expect(scoreSec?.textContent).toMatch(/Versorgung/);
		expect(scoreSec?.textContent).toMatch(/Wohnschutz/);
		expect(scoreSec?.textContent?.toLowerCase()).not.toContain('soziale');
	});

	it('verbirgt Score-Section wenn score null', async () => {
		render(KiezHero, { profile: baseProfile, stats: null, score: null, faq: [] });
		expect(document.querySelector('[data-testid="kiez-score"]')).toBeNull();
	});

	it('zeigt Steckbrief-Tabelle aus stats-Fixture mit Quellen-Subline', async () => {
		render(KiezHero, { profile: baseProfile, stats: statsFixture, score: null, faq: [] });
		const table = document.querySelector('[data-testid="kiez-steckbrief"]');
		expect(table).not.toBeNull();
		expect(table?.textContent).toMatch(/Lärm/);
		expect(table?.textContent).toMatch(/Quelle: laerm-2023/);
		expect(table?.textContent).toMatch(/Grünversorgung/);
	});

	it('rendert FaqSection wenn faq-Items vorhanden', async () => {
		render(KiezHero, {
			profile: baseProfile,
			stats: null,
			score: null,
			faq: [{ question: 'Frage?', answer: 'Antwort.' }]
		});
		expect(document.querySelector('[data-testid="faq-section"]')).not.toBeNull();
	});

	it('verwendet niemals em-dash (memory feedback_no_em_dashes)', async () => {
		render(KiezHero, { profile: baseProfile, stats: null, score: scoreFixture, faq: [] });
		const hero = document.querySelector('[data-testid="kiez-hero"]');
		expect(hero?.textContent).not.toMatch(/—/);
	});

	it('verwendet niemals den Begriff "lebenswert" (memory feedback_no_lebenswert)', async () => {
		render(KiezHero, { profile: baseProfile, stats: null, score: scoreFixture, faq: [] });
		const hero = document.querySelector('[data-testid="kiez-hero"]');
		expect(hero?.textContent?.toLowerCase()).not.toContain('lebenswert');
	});
});
