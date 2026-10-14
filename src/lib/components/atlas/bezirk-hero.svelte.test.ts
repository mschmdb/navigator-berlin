import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import BezirkHero from './bezirk-hero.svelte';
import type { BezirkProfile } from '$lib/data/types.js';
import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';
import type { RegionOutline } from '$lib/seo/region-outline-svg.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const profile: BezirkProfile = {
	slug: 'mitte',
	name: 'Mitte',
	einwohner: 386000,
	flaecheHa: 3947,
	centroid: [13.4, 52.52],
	geometry: { type: 'Polygon', coordinates: [] },
	ortsteilSlugs: [],
	layerCoverage: []
};

const kieze: KiezListEntry[] = [
	{ slug: 'tiergarten', name: 'Tiergarten', composite: 60, rang: 30, quartil: 1, total: 143 }
];
const outline: RegionOutline = {
	viewBox: '0 0 1000 800',
	width: 1000,
	height: 800,
	paths: [{ id: 'tiergarten', d: 'M0 0L100 0L100 100Z' }]
};
const rank = { rang: 3, quartil: 1, total: 12 };
const noRank = { rang: null, quartil: null, total: 0 };

function text(): string {
	return (document.querySelector('[data-testid="bezirk-hero"]')?.textContent ?? '').replace(
		/\s+/g,
		' '
	);
}

describe('BezirkHero.svelte', () => {
	it('rendert h1 mit Bezirks-Name', () => {
		render(BezirkHero, { profile, kieze, outline, compositeRank: rank, einwohnerStichtag: null });
		expect(document.querySelector('[data-testid="bezirk-hero"] h1')?.textContent).toBe('Mitte');
	});

	it('nennt „Bezirk“ als Eyebrow vor der h1', () => {
		render(BezirkHero, { profile, kieze, outline, compositeRank: rank, einwohnerStichtag: null });
		const eyebrow = document.querySelector('[data-testid="bezirk-hero"] p');
		expect(eyebrow?.textContent?.trim()).toBe('Bezirk');
	});

	it('zeigt Einwohner:innen, Fläche in km² und Stand', () => {
		render(BezirkHero, {
			profile,
			kieze,
			outline,
			compositeRank: rank,
			einwohnerStichtag: '2024-12-31'
		});
		const facts = document.querySelector('[data-testid="bezirk-facts"]');
		expect(facts?.textContent).toMatch(/386\.000/);
		expect(facts?.textContent).toMatch(/39,5 km²/);
		expect(text()).toMatch(/Stand Ende 2024/);
	});

	it('zeigt den Bezirks-Rang als „Platz X von 12“', () => {
		render(BezirkHero, { profile, kieze, outline, compositeRank: rank, einwohnerStichtag: null });
		expect(text()).toContain('Platz 3 von 12');
	});

	it('nutzt im unteren Viertel den Anti-Stigma-Wortlaut', () => {
		render(BezirkHero, {
			profile,
			kieze,
			outline,
			compositeRank: { rang: 11, quartil: 4, total: 12 },
			einwohnerStichtag: null
		});
		expect(text()).toContain('unteres Viertel');
		expect(text()).not.toContain('Platz 11');
	});

	it('lässt den Rang ohne DB-Daten weg', () => {
		render(BezirkHero, {
			profile,
			kieze,
			outline,
			compositeRank: noRank,
			einwohnerStichtag: null
		});
		expect(document.querySelector('[data-testid="bezirk-rank-fact"]')).toBeNull();
	});

	it('verlinkt den Karten-Button auf /explore?bezirk=<slug>', () => {
		render(BezirkHero, { profile, kieze, outline, compositeRank: rank, einwohnerStichtag: null });
		const button = document.querySelector('[data-testid="bezirk-map-button"]');
		expect(button?.textContent?.trim()).toBe('Mitte auf der Karte');
		expect(button?.getAttribute('href')).toBe('/explore?bezirk=mitte');
	});

	it('rendert die Kiez-Karte', () => {
		render(BezirkHero, { profile, kieze, outline, compositeRank: rank, einwohnerStichtag: null });
		expect(document.querySelector('[data-testid="bezirk-kieze-map"]')).not.toBeNull();
	});

	it('rendert ohne Umriss keine Karte, aber Button und Fakten', () => {
		render(BezirkHero, {
			profile,
			kieze,
			outline: null,
			compositeRank: rank,
			einwohnerStichtag: null
		});
		expect(document.querySelector('[data-testid="bezirk-kieze-map"]')).toBeNull();
		expect(document.querySelector('[data-testid="bezirk-map-button"]')).not.toBeNull();
	});

	it('verwendet niemals em-dash', () => {
		render(BezirkHero, { profile, kieze, outline, compositeRank: rank, einwohnerStichtag: null });
		expect(text()).not.toMatch(/—/);
	});

	describe('EN', () => {
		it('Fakten, Button und Link englisch mit /en-Präfix', () => {
			overwriteGetLocale(() => 'en');
			render(BezirkHero, {
				profile,
				kieze,
				outline,
				compositeRank: rank,
				einwohnerStichtag: '2024-12-31'
			});
			const facts = document.querySelector('[data-testid="bezirk-facts"]');
			expect(facts?.textContent).toMatch(/386,000/);
			expect(facts?.textContent).toMatch(/39\.5 km²/);
			expect(text()).toMatch(/as of end of 2024/);
			expect(text()).toContain('Rank 3 of 12');
			const button = document.querySelector('[data-testid="bezirk-map-button"]');
			expect(button?.textContent?.trim()).toBe('Mitte on the map');
			expect(button?.getAttribute('href')).toBe('/en/explore?bezirk=mitte');
		});
	});
});
