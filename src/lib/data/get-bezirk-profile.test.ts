import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getBezirkProfile } from './get-bezirk-profile.js';
import { _resetManifestCache } from './manifest.js';
import { _resetLayerCache } from './internal/layer-fetch.js';
import { _resetIndexCache } from './internal/spatial-index.js';
import { _resetLayerHitCache } from './get-layers-at-point.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = (rel: string) => JSON.parse(readFileSync(join(__dirname, rel), 'utf-8'));
const miniManifest = load('./__fixtures__/mini-manifest.json');
const miniBezirke = load('./__fixtures__/mini-bezirke.geojson');
const miniMietspiegel = load('./__fixtures__/mini-mietspiegel.geojson');
const miniTrinkbrunnen = load('./__fixtures__/mini-trinkbrunnen.geojson');
const miniStrassenlaerm = load('./__fixtures__/mini-strassenlaerm.geojson');

const fetchMock = () =>
	vi.fn(async (url: string) => {
		if (url === '/layers/MANIFEST.json')
			return new Response(JSON.stringify(miniManifest), { status: 200 });
		if (url === '/layers/bezirke.a1b2c3d4.geojson')
			return new Response(JSON.stringify(miniBezirke), { status: 200 });
		if (url === '/layers/mietspiegel-wohnlage.f9e8d7c6.geojson')
			return new Response(JSON.stringify(miniMietspiegel), { status: 200 });
		if (url === '/layers/trinkbrunnen.beefdead.geojson')
			return new Response(JSON.stringify(miniTrinkbrunnen), { status: 200 });
		if (url === '/layers/strassenlaerm-2022.deadcafe.geojson')
			return new Response(JSON.stringify(miniStrassenlaerm), { status: 200 });
		return new Response('404', { status: 404 });
	});

beforeEach(() => {
	_resetManifestCache();
	_resetLayerCache();
	_resetIndexCache();
	_resetLayerHitCache();
});
afterEach(() => vi.restoreAllMocks());

describe('getBezirkProfile', () => {
	it('liefert Profile fuer bekannten Slug "mitte"', async () => {
		const fn = fetchMock();
		const p = await getBezirkProfile('de', 'mitte', fn as unknown as typeof fetch);
		expect(p.slug).toBe('mitte');
		expect(p.name).toBe('Mitte');
		expect(p.einwohner).toBe(384172);
		expect(p.flaecheHa).toBe(3947);
		expect(p.centroid).toHaveLength(2);
		expect(p.layerCoverage.length).toBeGreaterThan(0);
	});

	it('case-insensitive Slug-Lookup', async () => {
		const fn = fetchMock();
		const p = await getBezirkProfile('de', 'FRIEDRICHSHAIN-KREUZBERG', fn as unknown as typeof fetch);
		expect(p.slug).toBe('friedrichshain-kreuzberg');
	});

	it('wirft 404-Error bei unknown Slug', async () => {
		const fn = fetchMock();
		await expect(
			getBezirkProfile('de', 'foo-bar-baz', fn as unknown as typeof fetch)
		).rejects.toThrow();
	});
});
