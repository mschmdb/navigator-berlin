import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { resolveSpatialLevel } from './resolve-spatial-level.js';
import { _resetManifestCache } from './manifest.js';
import { _resetLayerCache } from './internal/layer-fetch.js';
import { _resetIndexCache } from './internal/spatial-index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = (rel: string) => JSON.parse(readFileSync(join(__dirname, rel), 'utf-8'));

const manifest = load('./__fixtures__/spatial-level-manifest.json');
const bezirke = load('./__fixtures__/spatial-level-bezirke.geojson');
const bezirksregion = load('./__fixtures__/spatial-level-bezirksregion.geojson');

const buildFetchMock = () =>
	vi.fn(async (url: string) => {
		if (url === '/layers/MANIFEST.json')
			return new Response(JSON.stringify(manifest), { status: 200 });
		if (url === '/layers/bezirke.a1b2c3d4.geojson')
			return new Response(JSON.stringify(bezirke), { status: 200 });
		if (url === '/layers/lor-bezirksregion.9479b010.geojson')
			return new Response(JSON.stringify(bezirksregion), { status: 200 });
		return new Response('404', { status: 404 });
	});

beforeEach(() => {
	_resetManifestCache();
	_resetLayerCache();
	_resetIndexCache();
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe('resolveSpatialLevel', () => {
	it('Punkt in Kiez + Bezirk liefert beide Slugs + Namen', async () => {
		const fn = buildFetchMock();
		const ctx = await resolveSpatialLevel(52.53, 13.37, fn as unknown as typeof fetch);
		expect(ctx.kiezName).toBe('Tiergarten Süd');
		expect(ctx.kiezSlug).toBe('tiergarten-sued');
		expect(ctx.bezirkName).toBe('Mitte');
		expect(ctx.bezirkSlug).toBe('mitte');
	});

	it('Punkt im Bezirk aber außerhalb Bezirksregion: Bezirk gesetzt, Kiez null', async () => {
		const fn = buildFetchMock();
		const ctx = await resolveSpatialLevel(52.515, 13.41, fn as unknown as typeof fetch);
		expect(ctx.bezirkSlug).toBe('mitte');
		expect(ctx.kiezSlug).toBeNull();
		expect(ctx.kiezName).toBeNull();
	});

	it('Punkt außerhalb Berlin-Bbox liefert alles null ohne Fetch', async () => {
		const fn = buildFetchMock();
		const ctx = await resolveSpatialLevel(48.0, 11.0, fn as unknown as typeof fetch);
		expect(ctx).toEqual({
			kiezSlug: null,
			kiezName: null,
			bezirkSlug: null,
			bezirkName: null
		});
		expect(fn.mock.calls.length).toBe(0);
	});

	it('Punkt innerhalb Bbox aber außerhalb aller Polygone (Brandenburg-Rand) liefert null', async () => {
		const fn = buildFetchMock();
		const ctx = await resolveSpatialLevel(52.65, 13.6, fn as unknown as typeof fetch);
		expect(ctx.kiezSlug).toBeNull();
		expect(ctx.bezirkSlug).toBeNull();
	});
});
