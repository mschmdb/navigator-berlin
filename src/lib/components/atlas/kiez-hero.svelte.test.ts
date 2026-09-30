import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KiezHero from './kiez-hero.svelte';
import type { KiezProfile } from '$lib/data/types.js';
import type { InferSelectModel } from 'drizzle-orm';
import type { kiezStats } from '$lib/server/db/schema/index.js';
import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

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
	kultur: 48,
	kriminalitaet: 55,
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
		dominantVersorgung: {
			value: 'mittel',
			layer: 'gruenversorgung-2023',
			sourceUpdatedAt: '2023-09-01'
		},
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

// i18n Block B4a Review-Fund: alle Steckbrief-Cluster befüllt (PET, ÖPNV,
// Wohnlage, MSS, Grünanlagen-Zähler), damit die EN-Fixture jede Übersetzung
// + jedes Zahlenformat einmal real durchläuft, statt nur den Lärm-/
// Grünversorgungs-Ausschnitt aus `statsFixture`.
const statsFixtureFull: KiezStatsRow = {
	slug: 'boxhagener-kiez',
	bezirkSlug: 'friedrichshain-kreuzberg',
	laerm: {
		dominantCategory: { value: 'hoch', layer: 'laerm-2023', sourceUpdatedAt: '2023-06-01' },
		categoryDistribution: null
	},
	luft: { dominantCategory: null, categoryDistribution: null },
	gruen: {
		dominantVersorgung: {
			value: 'mittel',
			layer: 'gruenversorgung-2023',
			sourceUpdatedAt: '2023-09-01'
		},
		versorgungDistribution: null,
		gruenanlagenCount: { value: 1234, layer: 'gruenanlagen', sourceUpdatedAt: '2023-09-01' },
		spielplaetzeCount: { value: 12, layer: 'spielplaetze', sourceUpdatedAt: '2023-09-01' }
	} as unknown as KiezStatsRow['gruen'],
	klima: {
		meanPet: { value: 24.567, layer: 'klima-pet-2022', sourceUpdatedAt: '2022-06-01' },
		shareSehrHeiss: null
	} as unknown as KiezStatsRow['klima'],
	wohnen: {
		dominantWohnlage: { value: 'gut', layer: 'wohnlagen-2024', sourceUpdatedAt: '2024-01-01' },
		wohnlageDistribution: null,
		dominantMss: { value: 'mittel', layer: 'mss-gesamtindex-2025', sourceUpdatedAt: '2025-01-01' },
		mssDistribution: null
	} as unknown as KiezStatsRow['wohnen'],
	oepnv: {
		stopsPerKm2: { value: 12.34, layer: 'oepnv-composite', sourceUpdatedAt: '2026-05-01' },
		uBahnCount: { value: 3, layer: 'ubahn-stationen', sourceUpdatedAt: '2026-05-01' },
		sBahnCount: { value: 2, layer: 'sbahn-stationen', sourceUpdatedAt: '2026-05-01' },
		tramCount: { value: 5, layer: 'tram-haltestellen', sourceUpdatedAt: '2026-05-01' },
		busCount: { value: 10, layer: 'bus-haltestellen', sourceUpdatedAt: '2026-05-01' }
	} as unknown as KiezStatsRow['oepnv'],
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
		expect(table?.textContent).toMatch(/Quelle: Lärmbelastung 2023/);
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

	it('Profil-Prosa hat kein lang-Attribut auf der DE-Seite (kein Sprachwechsel nötig)', async () => {
		render(KiezHero, {
			profile: baseProfile,
			stats: null,
			score: null,
			faq: [],
			profileProse: ['Ein deutscher Absatz.']
		});
		const prose = document.querySelector('[data-testid="kiez-profile"]');
		expect(prose?.hasAttribute('lang')).toBe(false);
	});

	// i18n Block B4a
	describe('opts.locale (EN)', () => {
		it('Verteilungen englisch: Lärm "Medium", Grün gut/schlecht → High/Low, Wohnlage "Good residential area"', async () => {
			overwriteGetLocale(() => 'en');
			const stats = {
				...statsFixtureFull,
				laerm: {
					...statsFixtureFull.laerm,
					categoryDistribution: {
						value: { mittel: 0.6, niedrig: 0.4 },
						layer: 'laerm-2023',
						sourceUpdatedAt: '2023-06-01'
					}
				},
				gruen: {
					...statsFixtureFull.gruen,
					versorgungDistribution: {
						value: { gut: 0.7, schlecht: 0.3 },
						layer: 'gruenversorgung-2023',
						sourceUpdatedAt: '2023-09-01'
					}
				},
				wohnen: {
					...statsFixtureFull.wohnen,
					wohnlageDistribution: {
						value: { gut: 0.8, mittel: 0.2 },
						layer: 'wohnlagen-2024',
						sourceUpdatedAt: '2024-01-01'
					}
				}
			} as unknown as KiezStatsRow;
			render(KiezHero, { profile: baseProfile, stats, score: null, faq: [] });
			const text = (
				document.querySelector('[data-testid="kiez-steckbrief"]')?.textContent ?? ''
			).replace(/\s+/g, ' ');
			expect(text).toContain('Medium 60% · Low 40%');
			expect(text).toContain('High 70% · Low 30%');
			expect(text).toContain('Good residential area 80% · Medium residential area 20%');
			expect(text).not.toMatch(/Mittel \d+%|Schlecht \d+%/);
		});

		it('Lead, Score-Dimension-Labels + alle Steckbrief-Cluster englisch, EN-Zahlenformate (Komma-Tausender, Punkt-Dezimal, Monat-Jahr)', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezHero, {
				profile: baseProfile,
				stats: statsFixtureFull,
				score: scoreFixture,
				faq: []
			});
			const hero = document.querySelector('[data-testid="kiez-hero"]');
			expect(hero?.textContent).toMatch(/18,500/); // EN-Tausendertrennzeichen (Komma)
			expect(hero?.textContent).toMatch(/residents/);
			const scoreSec = document.querySelector('[data-testid="kiez-score"]');
			expect(scoreSec?.textContent).toMatch(/Quiet & air/);
			expect(scoreSec?.textContent).toMatch(/Green & heat/);

			const table = document.querySelector('[data-testid="kiez-steckbrief"]');
			// Lärm: übersetzter Wert + EN-Monat-Jahr-Stand.
			expect(table?.textContent).toMatch(/Noise/);
			expect(table?.textContent).toMatch(/loud/);
			expect(table?.textContent).toMatch(/Source: Noise pollution 2023/);
			expect(table?.textContent).toMatch(/June 2023/);
			// Grünversorgung: übersetzter Wert + EN-Zähler (Komma-Tausender).
			expect(table?.textContent).toMatch(/Green space provision/);
			expect(table?.textContent).toMatch(/moderate/);
			expect(table?.textContent).toMatch(/Green spaces 1,234/);
			expect(table?.textContent).toMatch(/Playgrounds 12/);
			// Klima/PET: übersetzte Kategorie + EN-Dezimalformat (Punkt).
			expect(table?.textContent).toMatch(/Climate · PET/);
			expect(table?.textContent).toMatch(/24\.6 \(no heat stress\)/);
			// ÖPNV: übersetzte Dichte + EN-Dezimalformat + Zähler.
			expect(table?.textContent).toMatch(/Public transport density/);
			expect(table?.textContent).toMatch(/12\.3 \(dense\)/);
			expect(table?.textContent).toMatch(/U 3 · S 2 · Tram 5 · Bus 10/);
			// Wohnlage: "simple"/"good", nicht "basic".
			expect(table?.textContent).toMatch(/Residential area/);
			expect(table?.textContent).toMatch(/good residential area/);
			// Soziale Lage: ausgeschriebenes MSS-Glossar, übersetzte Beschreibung.
			expect(table?.textContent).toMatch(/Social situation \(MSS, Berlin social monitoring\)/);
			expect(table?.textContent).toMatch(/medium range of the Berlin distribution/);
		});

		it('FAQ-Platzhalter englisch wenn keine FAQ-Einträge vorhanden', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezHero, { profile: baseProfile, stats: null, score: null, faq: [] });
			const heading = document.querySelector('#faq-placeholder-heading');
			expect(heading?.textContent).toMatch(/Frequently asked questions/i);
		});

		it('Profil-Prosa im DE-Fallback (profileLocale de) trägt lang="de" (WCAG 3.1.2)', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezHero, {
				profile: baseProfile,
				stats: null,
				score: null,
				faq: [],
				profileProse: ['Ein deutscher Absatz.'],
				profileLocale: 'de'
			});
			const prose = document.querySelector('[data-testid="kiez-profile"]');
			expect(prose?.getAttribute('lang')).toBe('de');
			expect(prose?.textContent).toContain('Ein deutscher Absatz.');
		});

		it('ohne profileLocale gilt die Seiten-Locale (kein lang auf EN-Text)', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezHero, {
				profile: baseProfile,
				stats: null,
				score: null,
				faq: [],
				profileProse: ['An English paragraph.']
			});
			const prose = document.querySelector('[data-testid="kiez-profile"]');
			expect(prose?.hasAttribute('lang')).toBe(false);
		});

		it('englische Profil-Prosa (profileLocale en) trägt kein lang-Attribut', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezHero, {
				profile: baseProfile,
				stats: null,
				score: null,
				faq: [],
				profileProse: ['An English paragraph.'],
				profileLocale: 'en'
			});
			const prose = document.querySelector('[data-testid="kiez-profile"]');
			expect(prose?.hasAttribute('lang')).toBe(false);
			expect(prose?.textContent).toContain('An English paragraph.');
		});
	});
});

describe('KiezHero FAQ-Sprache (Block C3)', () => {
	it('reicht faqLocale als contentLocale an die FaqSection durch (DE-Fallback auf EN-Seite)', async () => {
		overwriteGetLocale(() => 'en');
		render(KiezHero, {
			profile: baseProfile,
			stats: null,
			score: null,
			faq: [{ question: 'Frage?', answer: 'Antwort.' }],
			faqLocale: 'de'
		});
		const accordion = document.querySelector(
			'[data-testid="faq-section"] .divide-y.divide-rule.border-y.border-rule'
		);
		expect(accordion?.getAttribute('lang')).toBe('de');
	});
});
