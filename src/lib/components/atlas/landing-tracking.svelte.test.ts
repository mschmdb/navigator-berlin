import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { __setEmbeddedForTests } from '$lib/utils/plausible.js';
import BezirkHero from './bezirk-hero.svelte';
import BezirkKiezeList from './bezirk-kieze-list.svelte';
import BezirkKiezeMap from './bezirk-kieze-map.svelte';
import KiezHero from './kiez-hero.svelte';
import KiezNeighbors from './kiez-neighbors.svelte';
import KeyFigureTiles from './key-figure-tiles.svelte';
import LayerKiezRanking from './layer-kiez-ranking.svelte';
import { KEY_FIGURE_LAYERS, type KeyFigure } from '$lib/data/region-key-figures.js';
import type { BezirkProfile, KiezProfile } from '$lib/data/types.js';
import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';
import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';
import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
import type { NeighborEntry } from '$lib/data/kiez-neighbors.js';
import type { LayerKiezRanking as Ranking } from '$lib/data/layer-kiez-ranking.js';

type Recorded = [string, { props?: Record<string, unknown> } | undefined];
let events: Recorded[] = [];

function blockNavigation(e: Event): void {
	e.preventDefault();
}

beforeEach(() => {
	events = [];
	(window as { plausible?: unknown }).plausible = (name: string, opts?: Recorded[1]) =>
		events.push([name, opts]);
	// Vitest-Browser läuft im iframe; ohne Override schluckt der Embed-Guard die Events.
	__setEmbeddedForTests(false);
	document.addEventListener('click', blockNavigation);
});

afterEach(() => {
	document.removeEventListener('click', blockNavigation);
	__setEmbeddedForTests(null);
	delete (window as { plausible?: unknown }).plausible;
	overwriteGetLocale(() => 'de');
});

function click(testid: string): void {
	const el = document.querySelector(`[data-testid="${testid}"]`);
	if (!el) throw new Error(`Element ${testid} fehlt`);
	// SVG-Anker haben kein click(); das Event funktioniert für alle Elemente.
	el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

function expectLanding(action: string, pageType: string): void {
	expect(events).toEqual([
		['Landing', { props: { action, page_type: pageType }, interactive: false }]
	]);
}

const outline: RegionOutline = {
	viewBox: '0 0 1000 800',
	width: 1000,
	height: 800,
	paths: [{ id: 'tiergarten', d: 'M0 0L100 0L100 100Z' }]
};
const kieze: KiezListEntry[] = [
	{ slug: 'tiergarten', name: 'Tiergarten', composite: 60, rang: 30, quartil: 1, total: 143 },
	{ slug: 'moabit', name: 'Moabit', composite: 40, rang: 80, quartil: 2, total: 143 }
];

describe('Landing-Events', () => {
	it('Bezirk: Karten-Button sendet genau ein Event', () => {
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
		render(BezirkHero, {
			profile,
			kieze,
			outline,
			compositeRank: { rang: 3, quartil: 1, total: 12 },
			einwohnerStichtag: null
		});
		click('bezirk-map-button');
		expectLanding('map_button', 'bezirk');
	});

	it('Bezirk: Sortier-Button sendet list_sort', () => {
		render(BezirkKiezeList, { kieze, bezirkName: 'Mitte' });
		click('bezirk-kieze-sort-name');
		expectLanding('list_sort', 'bezirk');
	});

	it('Bezirk: Kiez-Link der Liste sendet list_link', () => {
		render(BezirkKiezeList, { kieze, bezirkName: 'Mitte' });
		click('bezirk-kieze-link');
		expectLanding('list_link', 'bezirk');
	});

	it('Bezirk: Karten-Link sendet map_link', () => {
		render(BezirkKiezeMap, { outline, kieze, bezirkName: 'Mitte' });
		click('bezirk-map-link');
		expectLanding('map_link', 'bezirk');
	});

	describe('Kiez-Hero', () => {
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
		const props = {
			profile,
			score,
			compositeRank: { rang: 40, quartil: 2, total: 143 },
			comparison: [],
			outline: {
				...outline,
				paths: [{ id: 'boxhagener-kiez', d: 'M0 0L100 0L100 100Z' }]
			},
			einwohnerStichtag: '2024-12-31'
		};

		it('Karten-Button sendet map_button/kiez', () => {
			render(KiezHero, props);
			click('kiez-map-button');
			expectLanding('map_button', 'kiez');
		});

		it('Bezirks-Link der Eyebrow sendet eyebrow_link/kiez', () => {
			render(KiezHero, props);
			click('kiez-hero-bezirk-link');
			expectLanding('eyebrow_link', 'kiez');
		});
	});

	describe('Kennzahl-Kacheln', () => {
		const figures: KeyFigure[] = [
			{
				id: 'altbau',
				layer: KEY_FIGURE_LAYERS[1],
				unit: 'percent',
				value: 60,
				berlin: 39.49,
				level: null,
				berlinLevel: null
			}
		];

		it('Kiez: Klick sendet key_figure/kiez', () => {
			render(KeyFigureTiles, { figures, regionName: 'Moabit', kind: 'kiez', slug: 'moabit' });
			click('key-figure-link');
			expectLanding('key_figure', 'kiez');
		});

		it('Bezirk: Klick sendet key_figure/bezirk', () => {
			render(KeyFigureTiles, { figures, regionName: 'Mitte', kind: 'bezirk', slug: 'mitte' });
			click('key-figure-link');
			expectLanding('key_figure', 'bezirk');
		});
	});

	describe('Nachbarn und Ähnliche', () => {
		const entry: NeighborEntry = {
			slug: 'karlshorst',
			name: 'Karlshorst',
			bezirkName: 'Lichtenberg',
			composite: 61
		};

		it('Nachbar-Link sendet neighbor/kiez', () => {
			render(KiezNeighbors, { neighbors: [entry], similar: [] });
			click('kiez-sibling-link');
			expectLanding('neighbor', 'kiez');
		});

		it('Ähnlich-Link sendet similar/kiez', () => {
			render(KiezNeighbors, { neighbors: [], similar: [entry] });
			click('kiez-similar-link');
			expectLanding('similar', 'kiez');
		});
	});

	it('Layer: Ranglisten-Link sendet ranking_link/layer', () => {
		const ranking: Ranking = {
			variant: 'neutral',
			unit: 'eur-m2',
			top: {
				entries: [{ slug: 'kiez-1', name: 'Kiez 1', bezirkName: 'Mitte', value: 12.5 }],
				tie: null
			},
			bottom: { entries: [], tie: null }
		};
		render(LayerKiezRanking, { ranking });
		click('layer-kiez-ranking-link');
		expectLanding('ranking_link', 'layer');
	});

	it('ohne window.plausible bleibt der Klick folgenlos', () => {
		delete (window as { plausible?: unknown }).plausible;
		render(BezirkKiezeList, { kieze, bezirkName: 'Mitte' });
		expect(() => click('bezirk-kieze-sort-name')).not.toThrow();
	});
});
