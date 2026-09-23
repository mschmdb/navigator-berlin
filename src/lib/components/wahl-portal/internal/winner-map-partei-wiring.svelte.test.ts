import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WinnerMapContextProbe from './winner-map-context-probe.svelte';
import { _resetManifestCache } from '$lib/data/manifest.js';
import { _resetLayerCache } from '$lib/data/internal/layer-fetch.js';
import { _resetWinnersCache } from './winner-map-winners.svelte.js';
import { fakeMapFactory } from './fake-maplibre-test-util.js';
import { genericFillOpacityExpression } from './winner-map-data.js';
import {
	fillOpacityExpression,
	genericParteiFillOpacityExpression,
	parteiAnteilSpanne,
	parteiFillOpacityExpression,
	wechselOutlineExpression
} from './winner-map-expressions.js';
import type { WahlPortalListEntry } from '$lib/state/wahl-portal-context.svelte.js';
import type { FeatureCollection } from 'geojson';

/** Die geteilte Fake-Map trackt `setData` sourcenübergreifend (Muster
 * `fake-maplibre-test-util.ts`); die `highlight`-Source resettet zwischendurch
 * auf eine leere FeatureCollection. Diese Hilfsfunktion filtert auf den
 * zuletzt gesetzten Winners-Datensatz (2 Gebiets-Features). */
function lastWinnersSetData(calls: readonly unknown[]): FeatureCollection {
	const winnersCalls = calls.filter(
		(c): c is FeatureCollection =>
			typeof c === 'object' &&
			c !== null &&
			Array.isArray((c as FeatureCollection).features) &&
			(c as FeatureCollection).features.length === 2
	);
	return winnersCalls.at(-1) as FeatureCollection;
}

/**
 * Story 9 Task-Acceptance: „Fake-Map-Verdrahtungstest (Tab-Klick → erwartete
 * Paint-Keys)". Anders als der Controller-Test (`winner-map-maplibre.svelte
 * .test.ts`) läuft hier die ECHTE Komponente (`WinnerMap` über den Context-
 * Probe) mit einer injizierten Fake-Map -- deckt die reaktive Verdrahtung
 * (Tab-Klick -> $effect -> Controller-Aufruf) ab, nicht nur den Controller
 * in Isolation. Direkter Auslöser: Live-Bug-Report 20.09. (Rückwechsel zu
 * „Gewinner" zeigte weiter Partei-Einfärbung -- Ursache war die zu hohe
 * Deckkraft-Untergrenze der Partei-Rampe, nicht die Verdrahtung selbst,
 * dieser Test sichert die Matrix-Zeile trotzdem strukturell ab).
 */

const SHA = 'a'.repeat(64);

function layerMeta(overrides: Record<string, unknown>) {
	return {
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/x/data.geojson',
		fetchedAt: '2026-05-16T06:56:28.400Z',
		license: 'dl-de/zero-2-0',
		sha256: SHA,
		bundleGroup: 'H: Wahldaten',
		zoomThresholds: { min: 13, max: 17 },
		geometryType: 'Polygon',
		...overrides
	};
}

const MANIFEST = {
	schemaVersion: 1,
	generatedAt: '2026-05-16T06:56:28.400Z',
	layers: [
		layerMeta({
			slug: 'wahlgruppen-bt25',
			filename: 'wahlgruppen-bt25.cccccccc.geojson',
			featureCount: 2
		})
	]
};

function polygon() {
	return {
		type: 'Polygon' as const,
		coordinates: [
			[
				[13.3, 52.5],
				[13.3, 52.51],
				[13.31, 52.51],
				[13.3, 52.5]
			]
		]
	};
}

const STIMMBEZIRK_FC = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { BWK: '75', BEZ: '01', BWB3: '1A', MEMBERS: '100' }
		},
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { BWK: '75', BEZ: '01', BWB3: '1B', MEMBERS: '101' }
		}
	]
};

const WAHLEN_2025: WahlPortalListEntry[] = [
	{
		slug: '2025-btw-zweitstimme',
		jahr: 2025,
		typ: 'btw',
		isRepeatElection: false,
		sourceName: 'Bundeswahlleiterin',
		license: 'dl-de/by-2-0',
		vorlaeufig: false,
		sourceUpdatedAt: null
	}
];

function winnersResponse(rows: Array<{ gebiet_slug: string; partei: string; anteil: number }>) {
	return {
		typ: 'btw',
		stimmtyp: 'zweitstimme',
		ebene: 'stimmbezirk',
		jahr: 2025,
		geo_slug: 'bt25',
		winners: rows.map((r) => ({
			jahr: 2025,
			gebiet_slug: r.gebiet_slug,
			partei: r.partei,
			farbe_hex: '#000000',
			anteil: r.anteil,
			is_repeat_election: false,
			parent_slug: null
		})),
		license: 'dl-de/by-2-0',
		source_name: 'Bundeswahlleiterin'
	};
}

// gruppeIdFromGeo('bt25', {BWK:'75',BEZ:'01',BWB3:'1A'}) -> `${BWK}-${BEZ}-${BWB3}-5`.
const GEWINNER_RESPONSE = winnersResponse([
	{ gebiet_slug: '075-01-1A-5', partei: 'SPD', anteil: 0.4 },
	{ gebiet_slug: '075-01-1B-5', partei: 'CDU', anteil: 0.3 }
]);

const SPD_RESPONSE = winnersResponse([
	{ gebiet_slug: '075-01-1A-5', partei: 'SPD', anteil: 0.089 },
	{ gebiet_slug: '075-01-1B-5', partei: 'SPD', anteil: 0.349 }
]);

function fakeFetch(): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();
		if (url.includes('MANIFEST.json')) {
			return new Response(JSON.stringify(MANIFEST), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
		if (url.includes('wahlgruppen-bt25.cccccccc.geojson')) {
			return new Response(JSON.stringify(STIMMBEZIRK_FC), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
		if (url.includes('/api/wahl/winners')) {
			const body = url.includes('partei=SPD') ? SPD_RESPONSE : GEWINNER_RESPONSE;
			return new Response(JSON.stringify(body), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
		return new Response('not found', { status: 404 });
	}) as typeof fetch;
}

beforeEach(() => {
	_resetManifestCache();
	_resetLayerCache();
	_resetWinnersCache();
});

afterEach(() => {
	_resetManifestCache();
	_resetLayerCache();
	_resetWinnersCache();
});

describe('WinnerMap Partei-Tab-Verdrahtung (Stimmbezirk, Fake-Map)', () => {
	it('Tab „SPD" -> setData + partei-relative Rampe; zurück zu „Gewinner" -> Sieger-FC + generische Rampe', async () => {
		const fake = fakeMapFactory();
		render(WinnerMapContextProbe, {
			reihe: 'btw',
			ebene: 'stimmbezirk',
			jahr: 2025,
			wahlen: WAHLEN_2025,
			fetchFn: fakeFetch(),
			mapFactory: fake.factory
		});

		await expect.element(page.getByTestId('winner-map-canvas')).toBeInTheDocument();
		// Style-`load` der Fake-Map manuell auslösen (kein echtes GL-Rendering im Test).
		fake.handlers['load']?.();
		await new Promise((r) => setTimeout(r, 0));

		await page.getByTestId('winner-map-partei-tab-SPD').click();
		await new Promise((r) => setTimeout(r, 0));

		expect(lastWinnersSetData(fake.setDataCalls)).toMatchObject({
			features: [
				expect.objectContaining({ properties: expect.objectContaining({ anteil: 0.089 }) }),
				expect.objectContaining({ properties: expect.objectContaining({ anteil: 0.349 }) })
			]
		});
		const spdOpacityCall = fake.paintCalls
			.filter((c) => c.layer === 'winners-fill' && c.prop === 'fill-opacity')
			.at(-1);
		expect(spdOpacityCall?.value).toEqual(genericParteiFillOpacityExpression(0.089, 0.349));
		// Review-Fund #6: figure-/canvas-aria-label + role=status-Announcement
		// nennen im Partei-Modus die Partei statt „stärkste Partei".
		await expect
			.element(page.getByTestId('winner-map-canvas'))
			.toHaveAttribute('aria-label', expect.stringContaining('Anteil SPD'));
		await expect
			.element(page.getByTestId('winner-map-ansicht-status'))
			.toHaveTextContent('Ansicht: Anteil SPD');

		await page.getByTestId('winner-map-partei-tab-gewinner').click();
		await new Promise((r) => setTimeout(r, 0));

		expect(lastWinnersSetData(fake.setDataCalls)).toMatchObject({
			features: [
				expect.objectContaining({ properties: expect.objectContaining({ partei: 'SPD' }) }),
				expect.objectContaining({ properties: expect.objectContaining({ partei: 'CDU' }) })
			]
		});
		const gewinnerOpacityCall = fake.paintCalls
			.filter((c) => c.layer === 'winners-fill' && c.prop === 'fill-opacity')
			.at(-1);
		expect(gewinnerOpacityCall?.value).toEqual(genericFillOpacityExpression());
		await expect
			.element(page.getByTestId('winner-map-canvas'))
			.toHaveAttribute('aria-label', expect.stringContaining('stärksten Partei'));
		await expect
			.element(page.getByTestId('winner-map-ansicht-status'))
			.toHaveTextContent('Ansicht: Stärkste Partei');
	});
});

/**
 * Review-Fund #1(b): der Controller-Test deckte nur den generischen
 * (Stimmbezirk) Pfad ab; auf kiez/bezirk backt `bakeParteiJahrProperties`
 * jahr-gebundene `w_<jahr>_*`-Keys, deren `setPaintProperty`/`setFilter`-
 * Aufrufe der EFFECT-DEPENDENCY-Fix (`void parteiRamp` in winner-map.svelte)
 * absichert. Echte Slug-Fixtures wie in `winner-map.svelte.test.ts`.
 */
describe('WinnerMap Partei-Tab-Verdrahtung (Kiez, Fake-Map)', () => {
	const KIEZ_MANIFEST = {
		schemaVersion: 1,
		generatedAt: '2026-05-16T06:56:28.400Z',
		layers: [
			layerMeta({ slug: 'bezirke', filename: 'bezirke.aaaaaaaa.geojson', featureCount: 1 }),
			layerMeta({
				slug: 'lor-bezirksregion',
				filename: 'lor-bezirksregion.bbbbbbbb.geojson',
				featureCount: 1
			})
		]
	};
	const KIEZ_BEZIRKE_FC = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: polygon(),
				properties: { Gemeinde_name: 'Mitte', Schluessel_gesamt: '11000001' }
			}
		]
	};
	const KIEZ_KIEZ_FC = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: polygon(),
				properties: { BZR_ID: '010101', BZR_NAME: 'Hansaviertel', BEZ: '01' }
			}
		]
	};
	const KIEZ_WAHLEN_2023: WahlPortalListEntry[] = [
		{
			slug: '2023-agh-zweitstimme',
			jahr: 2023,
			typ: 'agh',
			isRepeatElection: false,
			sourceName: 'Amt für Statistik Berlin-Brandenburg',
			license: 'dl-de/by-2-0',
			vorlaeufig: false,
			sourceUpdatedAt: null
		}
	];

	function kiezWinnersResponse(partei: string, anteil: number) {
		return {
			typ: 'agh',
			stimmtyp: 'zweitstimme',
			ebene: 'kiez',
			winners: [
				{
					jahr: 2023,
					gebiet_slug: 'hansaviertel',
					partei,
					farbe_hex: '#000000',
					anteil,
					is_repeat_election: false,
					parent_slug: null
				}
			],
			license: 'dl-de/by-2-0',
			source_name: 'Amt für Statistik Berlin-Brandenburg'
		};
	}

	const SPD_ANTEIL = 0.42;

	function kiezFakeFetch(): typeof fetch {
		return (async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('MANIFEST.json')) {
				return new Response(JSON.stringify(KIEZ_MANIFEST), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('bezirke.aaaaaaaa.geojson')) {
				return new Response(JSON.stringify(KIEZ_BEZIRKE_FC), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('lor-bezirksregion.bbbbbbbb.geojson')) {
				return new Response(JSON.stringify(KIEZ_KIEZ_FC), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('/api/wahl/winners')) {
				const body = url.includes('partei=SPD')
					? kiezWinnersResponse('SPD', SPD_ANTEIL)
					: kiezWinnersResponse('CDU', 0.5);
				return new Response(JSON.stringify(body), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			return new Response('not found', { status: 404 });
		}) as typeof fetch;
	}

	it('Tab SPD -> letzter fill-opacity-Call ist parteiFillOpacityExpression(2023, …); Tab Gewinner -> fillOpacityExpression(2023) + wechselOutlineExpression(2023)', async () => {
		const fake = fakeMapFactory();
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: KIEZ_WAHLEN_2023,
			fetchFn: kiezFakeFetch(),
			mapFactory: fake.factory
		});

		await expect.element(page.getByTestId('winner-map-canvas')).toBeInTheDocument();
		fake.handlers['load']?.();
		await new Promise((r) => setTimeout(r, 0));

		await page.getByTestId('winner-map-partei-tab-SPD').click();
		await new Promise((r) => setTimeout(r, 0));

		const spanne = parteiAnteilSpanne([
			{
				jahr: 2023,
				gebiet_slug: 'hansaviertel',
				partei: 'SPD',
				farbe_hex: '#000000',
				anteil: SPD_ANTEIL,
				is_repeat_election: false,
				parent_slug: null
			}
		]);
		const spdOpacityCall = fake.paintCalls
			.filter((c) => c.layer === 'winners-fill' && c.prop === 'fill-opacity')
			.at(-1);
		expect(spdOpacityCall?.value).toEqual(
			parteiFillOpacityExpression(2023, spanne.min, spanne.max)
		);
		const spdFilterCall = fake.filterCalls.at(-1);
		expect(spdFilterCall).toEqual({
			layer: 'winners-wechsel-outline',
			filter: ['==', ['literal', 1], 0]
		});

		await page.getByTestId('winner-map-partei-tab-gewinner').click();
		await new Promise((r) => setTimeout(r, 0));

		const gewinnerOpacityCall = fake.paintCalls
			.filter((c) => c.layer === 'winners-fill' && c.prop === 'fill-opacity')
			.at(-1);
		expect(gewinnerOpacityCall?.value).toEqual(fillOpacityExpression(2023));
		const gewinnerFilterCall = fake.filterCalls.at(-1);
		expect(gewinnerFilterCall).toEqual({
			layer: 'winners-wechsel-outline',
			filter: wechselOutlineExpression(2023)
		});
	});
});
