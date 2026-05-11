import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getLayersAtPoint, _resetLayerHitCache } from './get-layers-at-point.js';
import { _resetManifestCache } from './manifest.js';
import { _resetLayerCache } from './internal/layer-fetch.js';
import { _resetIndexCache } from './internal/spatial-index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = (rel: string) => JSON.parse(readFileSync(join(__dirname, rel), 'utf-8'));

const miniManifest = load('./__fixtures__/mini-manifest.json');
const miniBezirke = load('./__fixtures__/mini-bezirke.geojson');
const miniMietspiegel = load('./__fixtures__/mini-mietspiegel.geojson');
const miniTrinkbrunnen = load('./__fixtures__/mini-trinkbrunnen.geojson');

const buildFetchMock = () => {
	return vi.fn(async (url: string) => {
		if (url === '/layers/MANIFEST.json')
			return new Response(JSON.stringify(miniManifest), { status: 200 });
		if (url === '/layers/bezirke.a1b2c3d4.geojson')
			return new Response(JSON.stringify(miniBezirke), { status: 200 });
		if (url === '/layers/mietspiegel-wohnlage.f9e8d7c6.geojson')
			return new Response(JSON.stringify(miniMietspiegel), { status: 200 });
		if (url === '/layers/trinkbrunnen.beefdead.geojson')
			return new Response(JSON.stringify(miniTrinkbrunnen), { status: 200 });
		return new Response('404', { status: 404 });
	});
};

beforeEach(() => {
	_resetManifestCache();
	_resetLayerCache();
	_resetIndexCache();
	_resetLayerHitCache();
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe('getLayersAtPoint', () => {
	it('liefert Hits fuer Punkt in Mitte (Mietspiegel + Bezirk Mitte)', async () => {
		const fn = buildFetchMock();
		const hits = await getLayersAtPoint(52.52, 13.38, fn as unknown as typeof fetch);
		const slugs = hits.map((h) => h.layer).sort();
		expect(slugs).toContain('bezirke');
		expect(slugs).toContain('mietspiegel-wohnlage');
		const mietspiegelHit = hits.find((h) => h.layer === 'mietspiegel-wohnlage');
		expect(mietspiegelHit?.value).toEqual({ wohnlage: 'einfach' });
		expect(mietspiegelHit?.license).toBe('dl-de/by-2-0');
	});

	it('liefert no-coverage fuer Polygon-Layer ausserhalb Coverage', async () => {
		const fn = buildFetchMock();
		const hits = await getLayersAtPoint(52.55, 13.5, fn as unknown as typeof fetch);
		const mietspiegel = hits.find((h) => h.layer === 'mietspiegel-wohnlage');
		expect(mietspiegel).toBeDefined();
		expect(mietspiegel?.value).toBeNull();
		expect(mietspiegel?.reason).toBe('no-coverage');
	});

	it('Punkt ausserhalb Berlin-Bbox liefert leeres Array', async () => {
		const fn = buildFetchMock();
		const hits = await getLayersAtPoint(48.0, 11.0, fn as unknown as typeof fetch);
		expect(hits).toEqual([]);
	});

	it('Point-Layer Trinkbrunnen liefert Hit bei nahem Punkt (innerhalb 50m)', async () => {
		const fn = buildFetchMock();
		const hits = await getLayersAtPoint(52.5225, 13.4025, fn as unknown as typeof fetch);
		const brunnen = hits.find((h) => h.layer === 'trinkbrunnen');
		expect(brunnen).toBeDefined();
		expect(brunnen?.reason).not.toBe('seasonal');
	});

	it('cached Result, kein Re-Fetch bei zweitem Lookup auf gleichem Punkt', async () => {
		const fn = buildFetchMock();
		await getLayersAtPoint(52.52, 13.38, fn as unknown as typeof fetch);
		const callsBefore = fn.mock.calls.length;
		await getLayersAtPoint(52.52, 13.38, fn as unknown as typeof fetch);
		expect(fn.mock.calls.length).toBe(callsBefore);
	});

	it('Trinkbrunnen ausserhalb Saison liefert reason seasonal', async () => {
		const fn = buildFetchMock();
		const winterDate = new Date('2026-01-15T12:00:00Z');
		vi.setSystemTime(winterDate);
		const hits = await getLayersAtPoint(52.5225, 13.4025, fn as unknown as typeof fetch);
		const brunnen = hits.find((h) => h.layer === 'trinkbrunnen');
		expect(brunnen?.reason).toBe('seasonal');
		expect(brunnen?.value).toBeNull();
		vi.useRealTimers();
	});

	it('Bezirk-Hit traegt source + updatedAt + license aus Manifest (MUST-Rule #12)', async () => {
		const fn = buildFetchMock();
		const hits = await getLayersAtPoint(52.52, 13.38, fn as unknown as typeof fetch);
		const bezirk = hits.find((h) => h.layer === 'bezirke');
		expect(bezirk?.source).toBe('https://daten.odis-berlin.de/de/dataset/bezirksgrenzen');
		expect(bezirk?.updatedAt).toBe('2026-05-11T14:21:33.000Z');
		expect(bezirk?.license).toBe('dl-de/zero-2-0');
	});
});
