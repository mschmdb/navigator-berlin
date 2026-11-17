import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { __setEmbeddedForTests } from '$lib/utils/plausible.js';
import LayerKiezRanking from './layer-kiez-ranking.svelte';
import NeighborList from '$lib/components/place/neighbor-list.svelte';
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

function renderNeighbors(action: 'neighbor' | 'similar', pageType: 'kiez' | 'bezirk'): void {
	render(NeighborList, {
		route: pageType === 'kiez' ? '/kiez/[slug]' : '/bezirk/[slug]',
		pageType,
		oncompare: () => {},
		groups: [
			{ title: 'T', hint: 'H', action, entries: [{ slug: 'karlshorst', name: 'Karlshorst' }] }
		]
	});
}

describe('Landing-Events', () => {
	it('Kiez: Nachbar-Link sendet neighbor/kiez', () => {
		renderNeighbors('neighbor', 'kiez');
		click('place-neighbor-link');
		expectLanding('neighbor', 'kiez');
	});

	it('Kiez: Ähnlich-Link sendet similar/kiez', () => {
		renderNeighbors('similar', 'kiez');
		click('place-neighbor-link');
		expectLanding('similar', 'kiez');
	});

	it('Bezirk: Nachbarbezirk-Link sendet neighbor/bezirk', () => {
		renderNeighbors('neighbor', 'bezirk');
		click('place-neighbor-link');
		expectLanding('neighbor', 'bezirk');
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
		renderNeighbors('neighbor', 'kiez');
		expect(() => click('place-neighbor-link')).not.toThrow();
	});
});
