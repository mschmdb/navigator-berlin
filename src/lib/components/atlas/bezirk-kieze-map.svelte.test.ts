import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import BezirkKiezeMap from './bezirk-kieze-map.svelte';
import { DIMENSION_RAMPS } from './internal/dimension-ramps.js';
import { NO_SCORE_FILL } from './internal/score-class-color.js';
import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';
import type { RegionOutline } from '$lib/seo/region-outline-svg.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const kieze: KiezListEntry[] = [
	{ slug: 'reuterstrasse', name: 'Reuterstraße', composite: 41, rang: 90, quartil: 3, total: 143 },
	{ slug: 'rixdorf', name: 'Rixdorf', composite: 80, rang: 5, quartil: 1, total: 143 },
	{ slug: 'ohne-score', name: 'Ohne Score', composite: null, rang: null, quartil: null, total: 0 }
];

const outline: RegionOutline = {
	viewBox: '0 0 1000 800',
	width: 1000,
	height: 800,
	paths: [
		{ id: 'reuterstrasse', d: 'M0 0L100 0L100 100Z' },
		{ id: 'rixdorf', d: 'M200 0L300 0L300 100Z' },
		{ id: 'ohne-score', d: 'M400 0L500 0L500 100Z' }
	]
};

function pathFor(slug: string): SVGPathElement {
	const link = document.querySelector(`[data-testid="bezirk-map-link"][data-slug="${slug}"]`);
	const path = link?.querySelector('path');
	if (!path) throw new Error(`Pfad ${slug} fehlt`);
	return path;
}

describe('bezirk-kieze-map.svelte', () => {
	it('rendert pro Kiez einen Link mit sprechendem Namen', () => {
		render(BezirkKiezeMap, { outline, kieze, bezirkName: 'Neukölln' });
		const links = document.querySelectorAll('[data-testid="bezirk-map-link"]');
		expect(links).toHaveLength(3);
		expect(links[0].getAttribute('aria-label')).toBe('Reuterstraße, Kiez-Score 41');
		expect(links[0].getAttribute('href')).toBe('/kiez/reuterstrasse');
	});

	it('nennt Kieze ohne Score im Namen', () => {
		render(BezirkKiezeMap, { outline, kieze, bezirkName: 'Neukölln' });
		const link = document.querySelector('[data-slug="ohne-score"]');
		expect(link?.getAttribute('aria-label')).toBe('Ohne Score, ohne Kiez-Score');
	});

	it('färbt nach Klasse und grau ohne Score', () => {
		render(BezirkKiezeMap, { outline, kieze, bezirkName: 'Neukölln' });
		const ramp = DIMENSION_RAMPS.gesamt;
		expect(pathFor('reuterstrasse').getAttribute('fill')).toBe(ramp[1]);
		expect(pathFor('rixdorf').getAttribute('fill')).toBe(ramp[4]);
		expect(pathFor('ohne-score').getAttribute('fill')).toBe(NO_SCORE_FILL);
	});

	it('beschriftet die Gruppe mit dem Bezirk', () => {
		render(BezirkKiezeMap, { outline, kieze, bezirkName: 'Neukölln' });
		const svg = document.querySelector('[data-testid="bezirk-kieze-map"] svg');
		expect(svg?.getAttribute('role')).toBe('img');
		expect(svg?.getAttribute('aria-label')).toContain('Neukölln');
	});

	it('nimmt Karten-Links aus der Tab-Reihenfolge, Link bleibt für die Maus', () => {
		render(BezirkKiezeMap, { outline, kieze, bezirkName: 'Neukölln' });
		const links = document.querySelectorAll('[data-testid="bezirk-map-link"]');
		for (const link of links) {
			expect(link.getAttribute('tabindex')).toBe('-1');
			expect(link.getAttribute('href')).toMatch(/^\/kiez\//);
		}
	});

	it('zeigt eine Legende mit Klassen und Grau', () => {
		render(BezirkKiezeMap, { outline, kieze, bezirkName: 'Neukölln' });
		const legend = document.querySelector('[data-testid="bezirk-map-legend"]');
		expect(legend?.textContent).toContain('76 bis 100');
		expect(legend?.textContent).toContain('ohne Score');
	});

	it('benennt die Legende „Kiez-Score“ für Screenreader (sr-only) per aria-labelledby', () => {
		render(BezirkKiezeMap, { outline, kieze, bezirkName: 'Neukölln' });
		const legend = document.querySelector('[data-testid="bezirk-map-legend"]');
		const heading = document.getElementById(legend?.getAttribute('aria-labelledby') ?? '');
		expect(heading?.textContent?.trim()).toBe('Kiez-Score');
		expect(heading?.className).toContain('sr-only');
	});

	it('rendert nichts ohne Umriss', () => {
		render(BezirkKiezeMap, { outline: null, kieze, bezirkName: 'Neukölln' });
		expect(document.querySelector('[data-testid="bezirk-kieze-map"]')).toBeNull();
	});

	it('lokalisiert Links und Texte auf EN', () => {
		overwriteGetLocale(() => 'en');
		render(BezirkKiezeMap, { outline, kieze, bezirkName: 'Neukölln' });
		const link = document.querySelector('[data-slug="rixdorf"]');
		expect(link?.getAttribute('href')).toBe('/en/kiez/rixdorf');
		expect(link?.getAttribute('aria-label')).toBe('Rixdorf, Kiez score 80');
	});
});
