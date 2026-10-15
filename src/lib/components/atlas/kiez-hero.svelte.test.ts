import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KiezHero from './kiez-hero.svelte';
import type { KiezProfile } from '$lib/data/types.js';
import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';
import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
import type { ComparisonDimRow } from '$lib/data/comparison-types.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const profile: KiezProfile = {
	slug: 'boxhagener-kiez',
	name: 'Boxhagener Kiez',
	bezirk: 'Friedrichshain-Kreuzberg',
	einwohner: 18500,
	flaecheHa: 122,
	centroid: [13.46, 52.51],
	geometry: { type: 'Polygon', coordinates: [] },
	layerCoverage: []
};

const score: KiezScore = {
	slug: 'boxhagener-kiez',
	bezirkSlug: 'friedrichshain-kreuzberg',
	composite: 47.4,
	ruheLuft: 30,
	gruenHitze: 35,
	mobilitaet: 65,
	versorgung: 70,
	wohnschutz: 55,
	kultur: 48,
	kriminalitaet: 55,
	computedAt: new Date('2026-05-16T00:00:00Z')
};

const outline: RegionOutline = {
	viewBox: '0 0 1000 800',
	width: 1000,
	height: 800,
	paths: [
		{ id: 'boxhagener-kiez', d: 'M0 0L100 0L100 100Z' },
		{ id: 'andere', d: 'M200 0L300 0L300 100Z' }
	]
};

const rank = { rang: 40, quartil: 2, total: 143 };
const noRank = { rang: null, quartil: null, total: 0 };

function dim(partial: Partial<ComparisonDimRow> & Pick<ComparisonDimRow, 'key'>): ComparisonDimRow {
	return { value: 50, berlinMedian: 50, rang: null, quartil: null, total: 143, ...partial };
}

const strongComparison: ComparisonDimRow[] = [
	dim({ key: 'ruhe-luft', rang: 90, quartil: 3 }),
	dim({ key: 'gruen-hitze', rang: 12, quartil: 1 })
];

function text(): string {
	return (document.querySelector('[data-testid="kiez-hero"]')?.textContent ?? '').replace(
		/\s+/g,
		' '
	);
}

function props(overrides: Record<string, unknown> = {}) {
	return {
		profile,
		score,
		compositeRank: rank,
		comparison: strongComparison,
		outline,
		einwohnerStichtag: '2024-12-31',
		...overrides
	};
}

describe('KiezHero.svelte', () => {
	it('rendert h1 mit Kiez-Name', () => {
		render(KiezHero, props());
		expect(document.querySelector('[data-testid="kiez-hero"] h1')?.textContent).toBe(
			'Boxhagener Kiez'
		);
	});

	it('verlinkt die Eyebrow „Kiez in {Bezirk}“ auf die Bezirksseite', () => {
		render(KiezHero, props());
		const link = document.querySelector('[data-testid="kiez-hero-bezirk-link"]');
		expect(link?.textContent?.trim()).toBe('Friedrichshain-Kreuzberg');
		expect(link?.parentElement?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'Kiez in Friedrichshain-Kreuzberg'
		);
		expect(link?.getAttribute('href')).toBe('/bezirk/friedrichshain-kreuzberg');
	});

	it('zeigt ohne Bezirk eine Eyebrow ohne Link', () => {
		render(KiezHero, props({ profile: { ...profile, bezirk: '' } }));
		expect(document.querySelector('[data-testid="kiez-hero-bezirk-link"]')).toBeNull();
		expect(document.querySelector('[data-testid="kiez-hero"] p')?.textContent?.trim()).toBe('Kiez');
	});

	it('zeigt Einwohner:innen, Fläche in km² und Stand', () => {
		render(KiezHero, props());
		const facts = document.querySelector('[data-testid="kiez-facts"]');
		expect(facts?.textContent).toMatch(/18\.500/);
		expect(facts?.textContent).toMatch(/1,2 km²/);
		expect(text()).toMatch(/Stand Ende 2024/);
	});

	it('zeigt Kiez-Score gerundet mit Rang „Platz X von 143“', () => {
		render(KiezHero, props());
		const fact = document.querySelector('[data-testid="kiez-hero-score"]');
		expect(fact?.textContent).toMatch(/47/);
		expect(fact?.textContent).toContain('Platz 40 von 143');
	});

	it('nutzt im unteren Viertel den Anti-Stigma-Wortlaut', () => {
		render(KiezHero, props({ compositeRank: { rang: 130, quartil: 4, total: 143 } }));
		expect(text()).toContain('unteres Viertel');
		expect(text()).not.toContain('Platz 130');
		expect(text()).not.toMatch(/Platz \d+ von 143/);
	});

	it('zeigt im unteren Viertel keinen Stärke-Satz, auch bei einer Dimension im oberen Viertel', () => {
		render(KiezHero, props({ compositeRank: { rang: 130, quartil: 4, total: 143 } }));
		expect(document.querySelector('[data-testid="kiez-hero-strength"]')).toBeNull();
	});

	it('zeigt den Stärke-Satz der besten Dimension im oberen Viertel', () => {
		render(KiezHero, props());
		expect(document.querySelector('[data-testid="kiez-hero-strength"]')?.textContent?.trim()).toBe(
			'Stärke: Grün & Hitze, Platz 12 von 143 in Berlin.'
		);
	});

	it('zeigt ohne Gesamt-Rang keinen Stärke-Satz, auch mit Dimension in Quartil 1', () => {
		render(KiezHero, props({ compositeRank: noRank }));
		expect(document.querySelector('[data-testid="kiez-hero-strength"]')).toBeNull();
	});

	it('zeigt den Stand unter der Einwohnerzahl', () => {
		render(KiezHero, props());
		const first = document.querySelector('[data-testid="kiez-facts"] dd');
		expect(first?.textContent).toMatch(/18\.500/);
		expect(first?.textContent).toMatch(/Stand Ende 2024/);
	});

	it('lässt den Stärke-Satz weg, wenn keine Dimension im oberen Viertel liegt', () => {
		render(KiezHero, props({ comparison: [dim({ key: 'ruhe-luft', rang: 90, quartil: 3 })] }));
		expect(document.querySelector('[data-testid="kiez-hero-strength"]')).toBeNull();
	});

	it('nennt keine Schwäche im Hero', () => {
		render(KiezHero, props({ comparison: [dim({ key: 'ruhe-luft', rang: 140, quartil: 4 })] }));
		expect(text()).not.toMatch(/Schwäche|schwach/i);
		expect(document.querySelector('[data-testid="kiez-hero-strength"]')).toBeNull();
	});

	it('zeigt ohne DB Fakten, Umriss und Button, aber keinen Score, Rang oder Stärke', () => {
		render(KiezHero, props({ score: null, compositeRank: noRank, comparison: [] }));
		expect(document.querySelector('[data-testid="kiez-hero-score"]')).toBeNull();
		expect(document.querySelector('[data-testid="kiez-hero-strength"]')).toBeNull();
		expect(document.querySelector('[data-testid="kiez-facts"]')?.textContent).toMatch(/18\.500/);
		expect(document.querySelector('[data-testid="kiez-location-map"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="kiez-map-button"]')).not.toBeNull();
	});

	it('rendert die Lage-Grafik als Bild mit Beschreibung und hebt den Kiez hervor', () => {
		render(KiezHero, props());
		const svg = document.querySelector('[data-testid="kiez-location-map"]');
		expect(svg?.getAttribute('role')).toBe('img');
		expect(svg?.getAttribute('aria-label')).toBe(
			'Lage von Boxhagener Kiez im Bezirk Friedrichshain-Kreuzberg'
		);
		expect(document.querySelector('[data-testid="kiez-location-current"]')?.getAttribute('d')).toBe(
			'M0 0L100 0L100 100Z'
		);
		expect(document.querySelector('[data-testid="kiez-location-others"]')?.getAttribute('d')).toBe(
			'M200 0L300 0L300 100Z'
		);
	});

	it('rendert ohne Umriss keine Grafik, aber Button und Fakten', () => {
		render(KiezHero, props({ outline: null }));
		expect(document.querySelector('[data-testid="kiez-location-map"]')).toBeNull();
		expect(document.querySelector('[data-testid="kiez-map-button"]')).not.toBeNull();
	});

	it('verlinkt den Karten-Button auf /explore?kiez=<slug>', () => {
		render(KiezHero, props());
		const button = document.querySelector('[data-testid="kiez-map-button"]');
		expect(button?.textContent?.trim()).toBe('Boxhagener Kiez auf der Karte');
		expect(button?.getAttribute('href')).toBe('/explore?kiez=boxhagener-kiez');
	});

	it('nutzt für die Dublette den disambiguierten Slug im Button', () => {
		render(
			KiezHero,
			props({
				profile: { ...profile, slug: 'heerstrasse-spandau', name: 'Heerstraße', bezirk: 'Spandau' }
			})
		);
		expect(document.querySelector('[data-testid="kiez-map-button"]')?.getAttribute('href')).toBe(
			'/explore?kiez=heerstrasse-spandau'
		);
		expect(
			document.querySelector('[data-testid="kiez-hero-bezirk-link"]')?.getAttribute('href')
		).toBe('/bezirk/spandau');
	});

	it('verwendet niemals em-dash', () => {
		render(KiezHero, props());
		expect(text()).not.toMatch(/—/);
	});

	it('wiederholt keinen Lead-Satz mit „auf dieser Seite“', () => {
		render(KiezHero, props());
		expect(text()).not.toMatch(/auf dieser Seite/);
	});

	describe('Gestalt', () => {
		it('setzt den Score in derselben Typo als „47 von 100“', () => {
			render(KiezHero, props());
			const dd = document.querySelector('[data-testid="kiez-hero-score"] dd');
			expect(dd?.textContent).toContain('47 von 100');
			expect(dd?.textContent).not.toContain('/ 100');
			const other = document.querySelector('[data-testid="kiez-facts"] dd');
			expect(dd).not.toBe(other);
			const a = getComputedStyle(dd as Element);
			const b = getComputedStyle(other as Element);
			expect(a.fontFamily).toBe(b.fontFamily);
			expect(a.fontSize).toBe(b.fontSize);
		});

		it('legt Stärke-Satz in die Textgruppe, Button in den Kartenrahmen', () => {
			render(KiezHero, props());
			const card = document.querySelector('[data-testid="hero-map-card"]');
			expect(card?.querySelector('[data-testid="kiez-map-button"]')).not.toBeNull();
			expect(card?.querySelector('[data-testid="kiez-hero-strength"]')).toBeNull();
			const facts = document.querySelector('[data-testid="kiez-facts"]');
			expect(
				facts?.parentElement?.querySelector('[data-testid="kiez-hero-strength"]')
			).not.toBeNull();
		});

		it('titelt den Rahmen „Lage im Bezirk {Bezirk}“ ohne Score-Erklärung', () => {
			render(KiezHero, props());
			const caption = document.querySelector('[data-testid="hero-map-card"] figcaption');
			expect(caption?.textContent).toContain('Lage im Bezirk Friedrichshain-Kreuzberg');
			expect(caption?.querySelector('a')).toBeNull();
		});

		it('zeigt den Button auch ohne Umriss', () => {
			render(KiezHero, props({ outline: null }));
			expect(document.querySelector('[data-testid="hero-map-card"]')).toBeNull();
			expect(document.querySelector('[data-testid="kiez-map-button"]')).not.toBeNull();
		});

		it('erklärt im Rahmen, dass die dunkle Fläche der Kiez ist', () => {
			render(KiezHero, props());
			expect(document.querySelector('[data-testid="kiez-outline-explain"]')?.textContent).toContain(
				'Dunkel: Boxhagener Kiez. Hell: die übrigen Kieze im Bezirk.'
			);
		});

		it('ohne Bezirk: Rahmentitel „Lage in Berlin“, aria-Label ohne Bezirk', () => {
			render(KiezHero, props({ profile: { ...profile, bezirk: '' } }));
			expect(
				document.querySelector('[data-testid="hero-map-card"] figcaption')?.textContent
			).toContain('Lage in Berlin');
			expect(
				document.querySelector('[data-testid="kiez-location-map"]')?.getAttribute('aria-label')
			).toBe('Lage von Boxhagener Kiez in Berlin');
		});

		it('rendert bei nicht passendem Umriss keinen Rahmen, aber den Button', () => {
			const other: RegionOutline = {
				...outline,
				paths: [{ id: 'anderer-kiez', d: 'M0 0L1 1Z' }]
			};
			render(KiezHero, props({ outline: other }));
			expect(document.querySelector('[data-testid="hero-map-card"]')).toBeNull();
			expect(document.querySelector('[data-testid="kiez-map-button"]')).not.toBeNull();
		});

		it('EN: „47 of 100“ und Rahmentitel englisch', () => {
			overwriteGetLocale(() => 'en');
			render(KiezHero, props());
			expect(document.querySelector('[data-testid="kiez-hero-score"] dd')?.textContent).toContain(
				'47 of 100'
			);
			expect(
				document.querySelector('[data-testid="hero-map-card"] figcaption')?.textContent
			).toContain('Location in Bezirk Friedrichshain-Kreuzberg');
		});
	});

	describe('EN', () => {
		it('nutzt im unteren Viertel englischen Wortlaut ohne Rang und ohne Stärke-Satz', () => {
			overwriteGetLocale(() => 'en');
			render(KiezHero, props({ compositeRank: { rang: 130, quartil: 4, total: 143 } }));
			expect(text()).toContain('bottom quartile');
			expect(text()).not.toContain('Rank 130');
			expect(text()).not.toMatch(/Rank \d+ of 143/);
			expect(document.querySelector('[data-testid="kiez-hero-strength"]')).toBeNull();
		});

		it('Eyebrow, Fakten, Stärke, Button und Links englisch mit /en-Präfix', () => {
			overwriteGetLocale(() => 'en');
			render(KiezHero, props());
			const facts = document.querySelector('[data-testid="kiez-facts"]');
			expect(facts?.textContent).toMatch(/18,500/);
			expect(facts?.textContent).toMatch(/1\.2 km²/);
			expect(facts?.textContent).toContain('Rank 40 of 143');
			expect(text()).toMatch(/as of end of 2024/);
			expect(
				document.querySelector('[data-testid="kiez-hero-bezirk-link"]')?.textContent?.trim()
			).toBe('Friedrichshain-Kreuzberg');
			expect(
				document.querySelector('[data-testid="kiez-hero-bezirk-link"]')?.getAttribute('href')
			).toBe('/en/bezirk/friedrichshain-kreuzberg');
			expect(
				document.querySelector('[data-testid="kiez-hero-strength"]')?.textContent?.trim()
			).toBe('Strength: Green & heat, rank 12 of 143 in Berlin.');
			const button = document.querySelector('[data-testid="kiez-map-button"]');
			expect(button?.textContent?.trim()).toBe('Boxhagener Kiez on the map');
			expect(button?.getAttribute('href')).toBe('/en/explore?kiez=boxhagener-kiez');
			expect(
				document.querySelector('[data-testid="kiez-location-map"]')?.getAttribute('aria-label')
			).toBe('Location of Boxhagener Kiez in Bezirk Friedrichshain-Kreuzberg');
		});
	});
});
