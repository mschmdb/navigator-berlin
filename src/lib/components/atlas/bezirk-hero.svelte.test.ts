import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BezirkHero from './bezirk-hero.svelte';
import type { BezirkProfile } from '$lib/data/types.js';
import type { InferSelectModel } from 'drizzle-orm';
import type { bezirkStats } from '$lib/server/db/schema/index.js';

type BezirkStatsRow = InferSelectModel<typeof bezirkStats>;

const baseProfile: BezirkProfile = {
	slug: 'mitte',
	name: 'Mitte',
	einwohner: 386000,
	flaecheHa: 3947,
	centroid: [13.4, 52.52],
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[13.35, 52.5],
				[13.45, 52.5],
				[13.45, 52.55],
				[13.35, 52.55],
				[13.35, 52.5]
			]
		]
	},
	ortsteilSlugs: [],
	layerCoverage: []
};

const statsFixture: BezirkStatsRow = {
	slug: 'mitte',
	laerm: {
		dominantCategory: { value: 'mittel', layer: 'laerm-2023', sourceUpdatedAt: '2023-06-01' },
		categoryDistribution: null
	},
	luft: { dominantCategory: null, categoryDistribution: null },
	gruen: {
		dominantVersorgung: { value: 'hoch', layer: 'gruenversorgung-2023', sourceUpdatedAt: '2023-09-01' },
		gruenanlagenCount: null,
		spielplaetzeCount: null
	} as unknown as BezirkStatsRow['gruen'],
	klima: { meanPet: null, hotDays: null } as unknown as BezirkStatsRow['klima'],
	wohnen: { dominantWohnlage: null, dominantMss: null } as unknown as BezirkStatsRow['wohnen'],
	oepnv: { stopsPerKm2: null } as unknown as BezirkStatsRow['oepnv'],
	bildung: {} as BezirkStatsRow['bildung'],
	heritage: {} as BezirkStatsRow['heritage'],
	computedAt: new Date('2026-05-16T00:00:00Z')
};

describe('BezirkHero.svelte', () => {
	it('rendert h1 mit Bezirks-Name', async () => {
		render(BezirkHero, { profile: baseProfile, stats: null, faq: [] });
		const heading = document.querySelector('[data-testid="bezirk-hero"] h1');
		expect(heading?.textContent).toBe('Mitte');
	});

	it('rendert Lead mit formatierten Einwohner- und Flächen-Daten', async () => {
		render(BezirkHero, { profile: baseProfile, stats: null, faq: [] });
		const lead = document.querySelector('[data-testid="bezirk-hero"] p');
		expect(lead?.textContent).toMatch(/386\.000 Einwohner:innen/);
		expect(lead?.textContent).toMatch(/3\.947 ha/);
	});

	it('zeigt Steckbrief-Platzhalter wenn stats null', async () => {
		render(BezirkHero, { profile: baseProfile, stats: null, faq: [] });
		const placeholder = document.querySelector('[data-testid="bezirk-hero"]');
		expect(placeholder?.textContent).toMatch(/Aggregat-Werte werden mit dem nächsten Daten-Build/);
		expect(document.querySelector('[data-testid="bezirk-steckbrief"]')).toBeNull();
	});

	it('rendert Steckbrief-Tabelle aus stats-Fixture mit Quellen-Subline', async () => {
		render(BezirkHero, { profile: baseProfile, stats: statsFixture, faq: [] });
		const table = document.querySelector('[data-testid="bezirk-steckbrief"]');
		expect(table).not.toBeNull();
		expect(table?.textContent).toMatch(/Lärm/);
		expect(table?.textContent).toMatch(/Quelle: laerm-2023/);
		expect(table?.textContent).toMatch(/Grünversorgung/);
	});

	it('zeigt FAQ-Placeholder wenn faq leer', async () => {
		render(BezirkHero, { profile: baseProfile, stats: null, faq: [] });
		expect(document.querySelector('[data-testid="faq-section"]')).toBeNull();
		const hero = document.querySelector('[data-testid="bezirk-hero"]');
		expect(hero?.textContent).toMatch(/FAQ-Einträge werden mit dem nächsten Daten-Build/);
	});

	it('rendert FaqSection wenn faq-Items vorhanden', async () => {
		render(BezirkHero, {
			profile: baseProfile,
			stats: null,
			faq: [{ question: 'Frage?', answer: 'Antwort.' }]
		});
		expect(document.querySelector('[data-testid="faq-section"]')).not.toBeNull();
	});

	it('verwendet niemals em-dash im Lead (memory feedback_no_em_dashes)', async () => {
		render(BezirkHero, { profile: baseProfile, stats: null, faq: [] });
		const hero = document.querySelector('[data-testid="bezirk-hero"]');
		expect(hero?.textContent).not.toMatch(/—/);
	});
});
