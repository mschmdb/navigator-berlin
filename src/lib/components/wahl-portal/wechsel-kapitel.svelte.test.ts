import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WechselKapitelContextProbe from './internal/wechsel-kapitel-context-probe.svelte';
import { _resetManifestCache } from '$lib/data/manifest.js';
import { _resetLayerCache } from '$lib/data/internal/layer-fetch.js';
import { _resetWinnersCache } from './internal/winner-map-winners.svelte.js';
import type { WahlPortalListEntry } from '$lib/state/wahl-portal-context.svelte.js';

const SHA = 'a'.repeat(64);

function layerMeta(overrides: Record<string, unknown>) {
	return {
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/x/data.geojson',
		fetchedAt: '2026-05-16T06:56:28.400Z',
		license: 'dl-de/zero-2-0',
		sha256: SHA,
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 8, max: 12 },
		geometryType: 'Polygon',
		...overrides
	};
}

const MANIFEST = {
	schemaVersion: 1,
	generatedAt: '2026-05-16T06:56:28.400Z',
	layers: [
		layerMeta({ slug: 'bezirke', filename: 'bezirke.aaaaaaaa.geojson', featureCount: 2 }),
		layerMeta({
			slug: 'lor-bezirksregion',
			filename: 'lor-bezirksregion.bbbbbbbb.geojson',
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

const BEZIRKE_FC = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { Gemeinde_name: 'Mitte', Schluessel_gesamt: '11000001' }
		}
	]
};

const KIEZ_FC = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { BZR_ID: '010101', BZR_NAME: 'Hansaviertel', BEZ: '01' }
		}
	]
};

const WAHLEN: WahlPortalListEntry[] = [
	{
		slug: '2023-agh-zweitstimme',
		jahr: 2023,
		typ: 'agh',
		isRepeatElection: true,
		sourceName: 'Amt für Statistik Berlin-Brandenburg',
		license: 'dl-de/by-2-0'
	}
];

function fakeFetch(routes: ReadonlyArray<[string, unknown]>): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();
		for (const [pattern, data] of routes) {
			if (url.includes(pattern)) {
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
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

describe('wechsel-kapitel.svelte', () => {
	it('zeigt einen Lade-Hinweis vor der Winners-Antwort', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', { winners: [] }]]);
		render(WechselKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('wechsel-kapitel-loading')).toBeInTheDocument();
	});

	it('DB-los/leer: zeigt einen Hinweis statt leerer Karte/Liste, kein Crash', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', { winners: [] }]]);
		render(WechselKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('wechsel-kapitel-empty')).toBeInTheDocument();
		await expect.element(page.getByTestId('wechsel-kapitel-canvas')).not.toBeInTheDocument();
	});

	it('zeigt eine Fehlermeldung, wenn die Winners-API fehlschlägt', async () => {
		const fetchFn = (async () => new Response('boom', { status: 500 })) as typeof fetch;
		render(WechselKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('wechsel-kapitel-error')).toBeInTheDocument();
	});

	it('I/O-Matrix Wechsel-Liste: nennt Gebiet, Jahr und Von/Nach-Parteien, Karte + Legende + Tabelle rendern', async () => {
		const winners = {
			winners: [
				{
					jahr: 2016,
					gebiet_slug: 'hansaviertel',
					partei: 'SPD',
					farbe_hex: '#A50C1A',
					anteil: 0.4,
					is_repeat_election: false,
					parent_slug: null
				},
				{
					jahr: 2021,
					gebiet_slug: 'hansaviertel',
					partei: 'GRÜNE',
					farbe_hex: '#0F6E2C',
					anteil: 0.35,
					is_repeat_election: false,
					parent_slug: null
				},
				{
					jahr: 2023,
					gebiet_slug: 'hansaviertel',
					partei: 'GRÜNE',
					farbe_hex: '#0F6E2C',
					anteil: 0.38,
					is_repeat_election: true,
					parent_slug: '2021-agh-zweitstimme'
				}
			]
		};
		const fetchFn = fakeFetch([
			['/api/wahl/winners', winners],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		render(WechselKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });

		await expect.element(page.getByTestId('wechsel-kapitel-canvas')).toBeInTheDocument();
		// Singular-Grammatik: "1 von 1 Kiezen wechselte" (nicht "wechselten").
		await expect
			.element(page.getByTestId('wechsel-kapitel-takeaway'))
			.toHaveTextContent('1 von 1 Kiezen wechselte mindestens einmal');
		await expect.element(page.getByTestId('wechsel-kapitel-legende')).toBeInTheDocument();

		const entries = page.getByTestId('wechsel-kapitel-eintrag');
		await expect.element(entries).toHaveTextContent('Hansaviertel');
		await expect.element(entries).toHaveTextContent('2023');
		await expect.element(page.getByTestId('wechsel-kapitel-von')).toHaveTextContent('SPD');
		await expect.element(page.getByTestId('wechsel-kapitel-nach')).toHaveTextContent('GRÜNE');

		await page.getByTestId('table-toggle').click();
		await expect.element(page.getByTestId('data-table')).toHaveTextContent('Hansaviertel');
	});

	it('Winners ok, aber Geometrie-Fehler (MANIFEST.json 500): zeigt einen Fehlerhinweis statt eines dauerhaft leeren Kartenkastens', async () => {
		const winners = {
			winners: [
				{
					jahr: 2021,
					gebiet_slug: 'hansaviertel',
					partei: 'SPD',
					farbe_hex: '#A50C1A',
					anteil: 0.4,
					is_repeat_election: false,
					parent_slug: null
				},
				{
					jahr: 2023,
					gebiet_slug: 'hansaviertel',
					partei: 'GRÜNE',
					farbe_hex: '#0F6E2C',
					anteil: 0.38,
					is_repeat_election: true,
					parent_slug: '2021-agh-zweitstimme'
				}
			]
		};
		const fetchFn = (async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('/api/wahl/winners')) {
				return new Response(JSON.stringify(winners), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('MANIFEST.json')) {
				return new Response('boom', { status: 500 });
			}
			return new Response('not found', { status: 404 });
		}) as typeof fetch;
		render(WechselKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('wechsel-kapitel-error')).toBeInTheDocument();
		await expect.element(page.getByTestId('wechsel-kapitel-canvas')).not.toBeInTheDocument();
	});

	it('ohne Wechsel: Liste zeigt einen Hinweis statt leerer Liste', async () => {
		const winners = {
			winners: [
				{
					jahr: 2021,
					gebiet_slug: 'hansaviertel',
					partei: 'SPD',
					farbe_hex: '#A50C1A',
					anteil: 0.4,
					is_repeat_election: false,
					parent_slug: null
				},
				{
					jahr: 2023,
					gebiet_slug: 'hansaviertel',
					partei: 'SPD',
					farbe_hex: '#A50C1A',
					anteil: 0.42,
					is_repeat_election: true,
					parent_slug: '2021-agh-zweitstimme'
				}
			]
		};
		const fetchFn = fakeFetch([
			['/api/wahl/winners', winners],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		render(WechselKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('wechsel-kapitel-canvas')).toBeInTheDocument();
		await expect.element(page.getByTestId('wechsel-kapitel-liste-empty')).toBeInTheDocument();
	});
});
