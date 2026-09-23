import { describe, expect, it } from 'vitest';
import { StimmbezirkLoader } from './winner-map-stimmbezirk.svelte.js';
import { _resetManifestCache } from '$lib/data/manifest.js';
import { _resetLayerCache } from '$lib/data/internal/layer-fetch.js';

const SHA = 'a'.repeat(64);

const MANIFEST = {
	schemaVersion: 1,
	generatedAt: '2026-05-16T06:56:28.400Z',
	layers: [
		{
			slug: 'wahlgruppen-ah21',
			filename: 'wahlgruppen-ah21.cccccccc.geojson',
			sourceUrl: 'https://example.invalid/x.zip',
			fetchedAt: '2026-05-16T06:56:28.400Z',
			license: 'dl-de/by-2-0',
			sha256: SHA,
			bundleGroup: 'H: Wahldaten',
			zoomThresholds: { min: 13, max: 17 },
			geometryType: 'Polygon',
			featureCount: 1
		}
	]
};

const GEO_FC = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[13.3, 52.5],
						[13.3, 52.51],
						[13.31, 52.51],
						[13.3, 52.5]
					]
				]
			},
			properties: { BEZ: '01', UWB3: '100', BWB3: '1A', BWK: '75', MEMBERS: '100' }
		}
	]
};

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

const geoRoutes: ReadonlyArray<[string, unknown]> = [
	['MANIFEST.json', MANIFEST],
	['wahlgruppen-ah21', GEO_FC]
];

describe('StimmbezirkLoader.loadGeometry', () => {
	it('übernimmt den wahlSlug des AKTUELLEN Aufrufs auch bei Cache-Hit (Review-Fund: ah21 wird von btw21 und agh21/23 geteilt)', async () => {
		_resetManifestCache();
		_resetLayerCache();
		const loader = new StimmbezirkLoader(fakeFetch(geoRoutes));
		await loader.loadGeometry('ah21', 'agh23', () => false);
		expect(loader.geometry?.wahlSlug).toBe('agh23');

		await loader.loadGeometry('ah21', 'btw21', () => false);
		expect(loader.geometry?.wahlSlug).toBe('btw21');
		expect(loader.geometry?.geoSlug).toBe('ah21');
	});

	it('setzt error-Status bei fehlendem Layer und respektiert isStale', async () => {
		_resetManifestCache();
		_resetLayerCache();
		const loader = new StimmbezirkLoader(fakeFetch([['MANIFEST.json', MANIFEST]]));
		await loader.loadGeometry('bt25', 'btw25', () => false);
		expect(loader.geometryStatus).toBe('error');

		const stale = new StimmbezirkLoader(fakeFetch(geoRoutes));
		await stale.loadGeometry('ah21', 'agh23', () => true);
		expect(stale.geometry).toBeNull();
	});
});

describe('StimmbezirkLoader.loadWinners', () => {
	const WINNERS = {
		winners: [
			{
				jahr: 2023,
				gebiet_slug: '01B1A',
				partei: 'SPD',
				farbe_hex: '#000000',
				anteil: 0.4,
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			}
		]
	};

	it('cached pro typ×stimmtyp×jahr und liefert aus dem Cache', async () => {
		let calls = 0;
		const fetchFn = (async () => {
			calls++;
			return new Response(JSON.stringify(WINNERS), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;
		const loader = new StimmbezirkLoader(fetchFn);
		await loader.loadWinners('agh', 'zweitstimme', 2023, () => false);
		await loader.loadWinners('agh', 'zweitstimme', 2023, () => false);
		expect(calls).toBe(1);
		expect(loader.winnersResponse?.winners[0].partei).toBe('SPD');
	});

	it('Story 9: partei-Param hängt an die URL an und cached unabhängig vom Gewinner-Key', async () => {
		let calls = 0;
		let lastUrl = '';
		const fetchFn = (async (input: RequestInfo | URL) => {
			calls++;
			lastUrl = typeof input === 'string' ? input : input.toString();
			return new Response(JSON.stringify(WINNERS), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;
		const loader = new StimmbezirkLoader(fetchFn);
		await loader.loadWinners('agh', 'zweitstimme', 2023, () => false, 'CDU');
		expect(lastUrl).toContain('partei=CDU');
		await loader.loadWinners('agh', 'zweitstimme', 2023, () => false);
		expect(calls).toBe(2);
	});

	it('Review-Fund #9: zwei parallele loadWinners desselben Keys feuern nur EINEN Fetch (In-Flight-Dedupe)', async () => {
		let calls = 0;
		const fetchFn = (async () => {
			calls++;
			await new Promise((r) => setTimeout(r, 0));
			return new Response(JSON.stringify(WINNERS), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;
		const loader = new StimmbezirkLoader(fetchFn);
		await Promise.all([
			loader.loadWinners('agh', 'zweitstimme', 2023, () => false),
			loader.loadWinners('agh', 'zweitstimme', 2023, () => false)
		]);
		expect(calls).toBe(1);
		expect(loader.winnersResponse?.winners[0].partei).toBe('SPD');
	});

	it('malformed Response führt in den error-Status statt zu crashen', async () => {
		const fetchFn = (async () =>
			new Response(JSON.stringify({ nope: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})) as typeof fetch;
		const loader = new StimmbezirkLoader(fetchFn);
		await loader.loadWinners('agh', 'zweitstimme', 2023, () => false);
		expect(loader.winnersStatus).toBe('error');
	});
});

describe('StimmbezirkLoader.resolveAddress', () => {
	it('liefert die Gruppen-ID im Format des aktuellen wahlSlug, null außerhalb (Story 17)', async () => {
		_resetManifestCache();
		_resetLayerCache();
		const loader = new StimmbezirkLoader(fakeFetch(geoRoutes));
		await loader.loadGeometry('ah21', 'agh23', () => false);
		expect(loader.resolveAddress(52.505, 13.305)).toBe('01B1A');
		expect(loader.resolveAddress(52.39, 13.06)).toBeNull();

		// Nach Reihe-Wechsel auf BTW liefert dieselbe Geometrie das BTW-Format.
		await loader.loadGeometry('ah21', 'btw21', () => false);
		expect(loader.resolveAddress(52.505, 13.305)).toBe('075-01-1A-5');
	});
});

describe('StimmbezirkLoader.resolveAddressLabel', () => {
	it('liefert den Gruppen-Anzeige-Namen statt der rohen Gruppen-ID (Review-Fund: Adress-Hinweis zeigte bisher die uwbId)', async () => {
		_resetManifestCache();
		_resetLayerCache();
		const loader = new StimmbezirkLoader(fakeFetch(geoRoutes));
		await loader.loadGeometry('ah21', 'agh23', () => false);
		expect(loader.resolveAddressLabel(52.505, 13.305)).toBe('Stimmbezirk 100 und Briefwahl 1A');
		expect(loader.resolveAddressLabel(52.39, 13.06)).toBeNull();

		// BTW-Format: Gruppen-ID '075-01-1A-5' -> Briefwahl-Code '1A', nicht die volle ID.
		await loader.loadGeometry('ah21', 'btw21', () => false);
		expect(loader.resolveAddressLabel(52.505, 13.305)).toBe('Stimmbezirk 100 und Briefwahl 1A');
	});
});
