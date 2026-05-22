import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import miniManifest from './__fixtures__/mini-manifest.json' with { type: 'json' };
import { loadManifest, getLayerEntry, getLayersByBundle, _resetManifestCache } from './manifest.js';
import { validateManifest } from './manifest-schema.js';

const fetchMock = (response: unknown, status = 200) =>
	vi.fn(async () =>
		Promise.resolve(
			new Response(JSON.stringify(response), {
				status,
				headers: { 'content-type': 'application/json' }
			})
		)
	);

beforeEach(() => {
	_resetManifestCache();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('committed MANIFEST.json', () => {
	it('validiert gegen das Schema (fängt invalide Layer-Entries vor dem Deploy)', () => {
		const raw = JSON.parse(readFileSync('static/layers/MANIFEST.json', 'utf-8'));
		expect(() => validateManifest(raw)).not.toThrow();
	});
});

describe('loadManifest', () => {
	it('laed Manifest via fetch und validated mit valibot', async () => {
		const fn = fetchMock(miniManifest);
		const manifest = await loadManifest(fn as unknown as typeof fetch);
		expect(manifest.schemaVersion).toBe(1);
		expect(manifest.layers).toHaveLength(4);
		expect(fn).toHaveBeenCalledWith('/layers/MANIFEST.json', { cache: 'no-cache' });
	});

	it('cached Result, kein Re-Fetch beim zweiten Aufruf', async () => {
		const fn = fetchMock(miniManifest);
		await loadManifest(fn as unknown as typeof fetch);
		await loadManifest(fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('wirft bei HTTP-Error', async () => {
		const fn = vi.fn(async () => new Response('not found', { status: 404 }));
		await expect(loadManifest(fn as unknown as typeof fetch)).rejects.toThrow(/404/);
	});

	it('wirft bei Schema-Mismatch', async () => {
		const fn = fetchMock({ schemaVersion: 99, generatedAt: 'foo', layers: [] });
		await expect(loadManifest(fn as unknown as typeof fetch)).rejects.toThrow();
	});
});

describe('getLayerEntry', () => {
	it('liefert Layer per Slug', async () => {
		const fn = fetchMock(miniManifest);
		await loadManifest(fn as unknown as typeof fetch);
		const entry = getLayerEntry('mietspiegel-wohnlage');
		expect(entry?.slug).toBe('mietspiegel-wohnlage');
		expect(entry?.license).toBe('dl-de/by-2-0');
	});

	it('undefined bei unknown slug', async () => {
		const fn = fetchMock(miniManifest);
		await loadManifest(fn as unknown as typeof fetch);
		expect(getLayerEntry('unknown-layer')).toBeUndefined();
	});
});

describe('getLayersByBundle', () => {
	it('filtert nach Bundle', async () => {
		const fn = fetchMock(miniManifest);
		await loadManifest(fn as unknown as typeof fetch);
		const wohnB = getLayersByBundle('B: Wohn-Daten');
		expect(wohnB).toHaveLength(1);
		expect(wohnB[0].slug).toBe('mietspiegel-wohnlage');
		const boundariesA = getLayersByBundle('A: Boundaries');
		expect(boundariesA.map((l) => l.slug)).toEqual(['bezirke']);
	});
});
