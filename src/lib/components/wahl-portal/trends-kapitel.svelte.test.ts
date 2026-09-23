import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TrendsKapitelContextProbe from './internal/trends-kapitel-context-probe.svelte';
import { _resetManifestCache } from '$lib/data/manifest.js';
import { _resetLayerCache } from '$lib/data/internal/layer-fetch.js';
import { _resetWinnersCache } from './internal/winner-map-winners.svelte.js';
import { _resetAnalytikCache } from './internal/trends-analytik.svelte.js';
import { fakeMapFactory } from './internal/fake-maplibre-test-util.js';
import { trendPropKeys, VOLATILITAET_FARBE_KEY } from './internal/trends-map-expressions.js';
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
		layerMeta({ slug: 'bezirke', filename: 'bezirke.aaaaaaaa.geojson', featureCount: 1 }),
		layerMeta({
			slug: 'lor-bezirksregion',
			filename: 'lor-bezirksregion.bbbbbbbb.geojson',
			featureCount: 1
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
		license: 'dl-de/by-2-0',
		vorlaeufig: false,
		sourceUpdatedAt: null
	}
];

const ANALYTIK = {
	gebiete: [
		{
			kiez_slug: 'hansaviertel',
			wechsel_count: 1,
			wechsel_jahre: [2023],
			volatilitaet: 0.08,
			trends: [{ partei: 'SPD', slope: 0.015 }]
		}
	],
	license: 'dl-de/by-2-0',
	source_name: 'Amt für Statistik Berlin-Brandenburg',
	source_url: 'https://example.invalid/agh23'
};

function fakeFetch(routes: ReadonlyArray<[string, unknown, number?]>): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();
		for (const [pattern, data, status] of routes) {
			if (url.includes(pattern)) {
				if (status && status >= 400) return new Response('boom', { status });
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
	_resetAnalytikCache();
});

afterEach(() => {
	_resetManifestCache();
	_resetLayerCache();
	_resetWinnersCache();
	_resetAnalytikCache();
});

describe('trends-kapitel.svelte', () => {
	it('zeigt einen Lade-Hinweis vor der Analytik-Antwort', async () => {
		const fetchFn = fakeFetch([['/api/wahl/analytik', { gebiete: [] }]]);
		render(TrendsKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('trends-kapitel-loading')).toBeInTheDocument();
	});

	it('DB-los/leer: zeigt einen Hinweis statt leerer Karte, kein Crash', async () => {
		// MANIFEST/Layer mitgeben, damit die Geometrie sauber lädt (`loaded`,
		// nicht `error`) -- sonst würde die neue `isError`-Formel (Review Triage
		// Log #11, ohne `gebiete.length`-Guard) einen Geometrie-Fetch-Fehler
		// fälschlich in dieses "DB-los"-Szenario mischen.
		const fetchFn = fakeFetch([
			['/api/wahl/analytik', { gebiete: [] }],
			['/api/wahl/winners', { winners: [] }],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		render(TrendsKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('trends-kapitel-empty')).toBeInTheDocument();
		await expect.element(page.getByTestId('trends-kapitel-canvas')).not.toBeInTheDocument();
	});

	it('zeigt eine Fehlermeldung, wenn die Analytik-API fehlschlägt', async () => {
		const fetchFn = fakeFetch([['/api/wahl/analytik', {}, 500]]);
		render(TrendsKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('trends-kapitel-error')).toBeInTheDocument();
	});

	it('Analytik ok, aber Geometrie-Fehler: zeigt einen Fehlerhinweis statt eines leeren Kartenkastens', async () => {
		const fetchFn = fakeFetch([
			['/api/wahl/analytik', ANALYTIK],
			['MANIFEST.json', {}, 500]
		]);
		render(TrendsKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('trends-kapitel-error')).toBeInTheDocument();
		await expect.element(page.getByTestId('trends-kapitel-canvas')).not.toBeInTheDocument();
	});

	it('Geometrie-Fehler bei LEERER Analytik zeigt einen Fehlerhinweis, nicht "noch keine Daten" (Review Triage Log #11)', async () => {
		const fetchFn = fakeFetch([
			['/api/wahl/analytik', { gebiete: [] }],
			['MANIFEST.json', {}, 500]
		]);
		render(TrendsKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('trends-kapitel-error')).toBeInTheDocument();
		await expect.element(page.getByTestId('trends-kapitel-empty')).not.toBeInTheDocument();
	});

	it('I/O-Matrix Trend-Karte: rendert Karte, Takeaway, Legende, Chips, Datenstand, Tabelle', async () => {
		const fetchFn = fakeFetch([
			['/api/wahl/analytik', ANALYTIK],
			['/api/wahl/winners', { winners: [] }],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		render(TrendsKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });

		await expect.element(page.getByTestId('trends-kapitel-canvas')).toBeInTheDocument();
		// Default-Chip SPD ist bereits aktiv (erste FINDER_PARTIES-Partei) und
		// hat einen Trend-Eintrag in der Fixture -> "steigend" im Takeaway.
		await expect.element(page.getByTestId('trends-kapitel-takeaway')).toHaveTextContent('SPD');
		await expect.element(page.getByTestId('trends-kapitel-legende')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('trends-kapitel-datenstand'))
			.toHaveTextContent('Amt für Statistik Berlin-Brandenburg');
		await expect.element(page.getByTestId('trends-kapitel-coverage-hinweis')).toBeInTheDocument();

		await expect
			.element(page.getByTestId('trends-kapitel-partei-SPD'))
			.toHaveAttribute('aria-checked', 'true');

		await page.getByTestId('table-toggle').first().click();
		await expect.element(page.getByTestId('data-table').first()).toHaveTextContent('Hansaviertel');

		// Toggle zu Volatilität: Chips werden deaktiviert, Legende wechselt.
		await page.getByTestId('trends-kapitel-toggle-volatilitaet').click();
		await expect
			.element(page.getByTestId('trends-kapitel-partei-SPD'))
			.toHaveAttribute('aria-disabled', 'true');
		await expect
			.element(page.getByTestId('trends-kapitel-takeaway'))
			.toHaveTextContent('Hansaviertel');
	});

	it('Volatilitäts-Modus: aria-describedby zeigt auf einen sichtbaren Hinweissatz an der Partei-Radiogroup (Review Triage Log #12)', async () => {
		const fetchFn = fakeFetch([
			['/api/wahl/analytik', ANALYTIK],
			['/api/wahl/winners', { winners: [] }],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		render(TrendsKapitelContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('trends-kapitel-canvas')).toBeInTheDocument();
		await expect.element(page.getByTestId('trends-kapitel-partei-hinweis')).not.toBeInTheDocument();

		await page.getByTestId('trends-kapitel-toggle-volatilitaet').click();
		await expect
			.element(page.getByTestId('trends-kapitel-partei-hinweis'))
			.toHaveTextContent('Die Partei-Auswahl gilt nur für die Trend-Ansicht.');
		await expect
			.element(page.getByTestId('trends-kapitel-parteien'))
			.toHaveAttribute('aria-describedby', 'trends-partei-hinweis');
	});

	it('Toggle/Chip-Wechsel ruft tatsächlich setPaintProperty auf der Karte auf (Review Triage Log #14)', async () => {
		const fake = fakeMapFactory();
		const fetchFn = fakeFetch([
			['/api/wahl/analytik', ANALYTIK],
			['/api/wahl/winners', { winners: [] }],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		render(TrendsKapitelContextProbe, {
			reihe: 'agh',
			wahlen: WAHLEN,
			fetchFn,
			mapFactory: fake.factory
		});
		await expect.element(page.getByTestId('trends-kapitel-canvas')).toBeInTheDocument();

		// Style-Load der Fake-Map manuell auslösen, sobald der Controller den
		// `load`-Handler registriert hat (Fake-Map-Naht, Muster
		// `trends-kapitel-maplibre.svelte.test.ts`).
		await vi.waitFor(() => {
			if (typeof fake.handlers['load'] !== 'function') throw new Error('load handler fehlt noch');
		});
		fake.handlers['load']?.();

		// Der `ready`-Übergang selbst löst noch einen Repaint mit dem aktuellen
		// (Default-)Toggle aus (Effect liest `mapCtl.ready` mit) -- deshalb IMMER
		// den LETZTEN `fill-color`-Aufruf prüfen, nicht den ersten Treffer.
		await page.getByTestId('trends-kapitel-toggle-volatilitaet').click();
		await vi.waitFor(() => {
			const call = fake.paintCalls.findLast((c) => c.prop === 'fill-color');
			expect(call?.value).toEqual(['get', VOLATILITAET_FARBE_KEY]);
		});

		await page.getByTestId('trends-kapitel-toggle-trend').click();
		await page.getByTestId('trends-kapitel-partei-CDU').click();
		await vi.waitFor(() => {
			const call = fake.paintCalls.findLast((c) => c.prop === 'fill-color');
			expect(call?.value).toEqual(['get', trendPropKeys('CDU').farbe]);
		});
	});
});
