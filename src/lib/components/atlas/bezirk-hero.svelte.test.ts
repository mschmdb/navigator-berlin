import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import BezirkHero from './bezirk-hero.svelte';
import type { BezirkProfile } from '$lib/data/types.js';
import type { InferSelectModel } from 'drizzle-orm';
import type { bezirkStats } from '$lib/server/db/schema/index.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

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
		dominantVersorgung: {
			value: 'hoch',
			layer: 'gruenversorgung-2023',
			sourceUpdatedAt: '2023-09-01'
		},
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

// i18n Block B4a Review-Fund: alle Steckbrief-Cluster befüllt (PET, ÖPNV,
// Wohnlage, MSS, Grünanlagen-Zähler), analog `kiez-hero.svelte.test.ts`.
const statsFixtureFull: BezirkStatsRow = {
	slug: 'mitte',
	laerm: {
		dominantCategory: { value: 'mittel', layer: 'laerm-2023', sourceUpdatedAt: '2023-06-01' },
		categoryDistribution: null
	},
	luft: { dominantCategory: null, categoryDistribution: null },
	gruen: {
		dominantVersorgung: {
			value: 'hoch',
			layer: 'gruenversorgung-2023',
			sourceUpdatedAt: '2023-09-01'
		},
		versorgungDistribution: null,
		gruenanlagenCount: { value: 1234, layer: 'gruenanlagen', sourceUpdatedAt: '2023-09-01' },
		spielplaetzeCount: { value: 12, layer: 'spielplaetze', sourceUpdatedAt: '2023-09-01' }
	} as unknown as BezirkStatsRow['gruen'],
	klima: {
		meanPet: { value: 24.567, layer: 'klima-pet-2022', sourceUpdatedAt: '2022-06-01' },
		shareSehrHeiss: null
	} as unknown as BezirkStatsRow['klima'],
	wohnen: {
		dominantWohnlage: { value: 'gut', layer: 'wohnlagen-2024', sourceUpdatedAt: '2024-01-01' },
		wohnlageDistribution: null,
		dominantMss: { value: 'mittel', layer: 'mss-gesamtindex-2025', sourceUpdatedAt: '2025-01-01' },
		mssDistribution: null
	} as unknown as BezirkStatsRow['wohnen'],
	oepnv: {
		stopsPerKm2: { value: 12.34, layer: 'oepnv-composite', sourceUpdatedAt: '2026-05-01' },
		uBahnCount: { value: 3, layer: 'ubahn-stationen', sourceUpdatedAt: '2026-05-01' },
		sBahnCount: { value: 2, layer: 'sbahn-stationen', sourceUpdatedAt: '2026-05-01' },
		tramCount: { value: 5, layer: 'tram-haltestellen', sourceUpdatedAt: '2026-05-01' },
		busCount: { value: 10, layer: 'bus-haltestellen', sourceUpdatedAt: '2026-05-01' }
	} as unknown as BezirkStatsRow['oepnv'],
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
		expect(placeholder?.textContent).toMatch(/Aggregat-Werte werden mit dem nächsten Daten-Update/);
		expect(document.querySelector('[data-testid="bezirk-steckbrief"]')).toBeNull();
	});

	it('rendert Steckbrief-Tabelle aus stats-Fixture mit Quellen-Subline', async () => {
		render(BezirkHero, { profile: baseProfile, stats: statsFixture, faq: [] });
		const table = document.querySelector('[data-testid="bezirk-steckbrief"]');
		expect(table).not.toBeNull();
		expect(table?.textContent).toMatch(/Lärm/);
		expect(table?.textContent).toMatch(/Quelle: Lärmbelastung 2023/);
		expect(table?.textContent).toMatch(/Grünversorgung/);
	});

	it('zeigt FAQ-Placeholder wenn faq leer', async () => {
		render(BezirkHero, { profile: baseProfile, stats: null, faq: [] });
		expect(document.querySelector('[data-testid="faq-section"]')).toBeNull();
		const hero = document.querySelector('[data-testid="bezirk-hero"]');
		expect(hero?.textContent).toMatch(/FAQ-Einträge ergänzen wir mit dem nächsten Daten-Update/);
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

	it('Profil-Prosa hat kein lang-Attribut auf der DE-Seite (kein Sprachwechsel nötig)', async () => {
		render(BezirkHero, {
			profile: baseProfile,
			stats: null,
			faq: [],
			profileProse: ['Ein deutscher Absatz.']
		});
		const prose = document.querySelector('[data-testid="bezirk-profile"]');
		expect(prose?.hasAttribute('lang')).toBe(false);
	});

	// i18n Block B4a
	describe('opts.locale (EN)', () => {
		it('Lead + alle Steckbrief-Cluster englisch, EN-Zahlenformate (Komma-Tausender, Punkt-Dezimal, Monat-Jahr)', async () => {
			overwriteGetLocale(() => 'en');
			render(BezirkHero, { profile: baseProfile, stats: statsFixtureFull, faq: [] });
			const hero = document.querySelector('[data-testid="bezirk-hero"]');
			expect(hero?.textContent).toMatch(/386,000 residents/);
			expect(hero?.textContent).toMatch(/3,947 ha/);

			const table = document.querySelector('[data-testid="bezirk-steckbrief"]');
			expect(table?.textContent).toMatch(/Noise/);
			expect(table?.textContent).toMatch(/moderate/);
			expect(table?.textContent).toMatch(/Source: Noise pollution 2023/);
			expect(table?.textContent).toMatch(/June 2023/);
			expect(table?.textContent).toMatch(/Green space provision/);
			expect(table?.textContent).toMatch(/Green spaces 1,234/);
			expect(table?.textContent).toMatch(/Playgrounds 12/);
			expect(table?.textContent).toMatch(/Climate · PET/);
			expect(table?.textContent).toMatch(/24\.6 \(no heat stress\)/);
			expect(table?.textContent).toMatch(/Public transport density/);
			expect(table?.textContent).toMatch(/12\.3 \(dense\)/);
			expect(table?.textContent).toMatch(/U 3 · S 2 · Tram 5 · Bus 10/);
			expect(table?.textContent).toMatch(/good residential area/);
			expect(table?.textContent).toMatch(/Social situation \(MSS, Berlin social monitoring\)/);
			expect(table?.textContent).toMatch(/medium range of the Berlin distribution/);
		});

		it('FAQ-Platzhalter englisch wenn keine FAQ-Einträge vorhanden', async () => {
			overwriteGetLocale(() => 'en');
			render(BezirkHero, { profile: baseProfile, stats: null, faq: [] });
			const hero = document.querySelector('[data-testid="bezirk-hero"]');
			expect(hero?.textContent).toMatch(/Frequently asked questions/i);
		});

		it('Profil-Prosa bleibt deutsch und trägt lang="de" (WCAG 3.1.2)', async () => {
			overwriteGetLocale(() => 'en');
			render(BezirkHero, {
				profile: baseProfile,
				stats: null,
				faq: [],
				profileProse: ['Ein deutscher Absatz.']
			});
			const prose = document.querySelector('[data-testid="bezirk-profile"]');
			expect(prose?.getAttribute('lang')).toBe('de');
			expect(prose?.textContent).toContain('Ein deutscher Absatz.');
		});
	});
});

describe('BezirkHero FAQ-Sprache (Block C3)', () => {
	it('reicht faqLocale als contentLocale an die FaqSection durch (DE-Fallback auf EN-Seite)', async () => {
		overwriteGetLocale(() => 'en');
		render(BezirkHero, {
			profile: baseProfile,
			stats: null,
			faq: [{ question: 'Frage?', answer: 'Antwort.' }],
			faqLocale: 'de'
		});
		const accordion = document.querySelector(
			'[data-testid="faq-section"] .divide-y.divide-rule.border-y.border-rule'
		);
		expect(accordion?.getAttribute('lang')).toBe('de');
	});
});
