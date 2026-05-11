import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchLayer, _resetLayerCache } from './layer-fetch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mietspiegel = JSON.parse(
	readFileSync(join(__dirname, '../__fixtures__/mini-mietspiegel.geojson'), 'utf-8')
);

const fetchMock = (response: unknown) =>
	vi.fn(async () => new Response(JSON.stringify(response), { status: 200 }));

beforeEach(() => {
	_resetLayerCache();
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe('fetchLayer', () => {
	it('laed GeoJSON via /layers/{filename}', async () => {
		const fn = fetchMock(mietspiegel);
		const fc = await fetchLayer('mietspiegel.abc12345.geojson', fn as unknown as typeof fetch);
		expect(fc.features).toHaveLength(3);
		expect(fn).toHaveBeenCalledWith('/layers/mietspiegel.abc12345.geojson');
	});

	it('cached Result (LRU), kein Re-Fetch beim 2. Aufruf', async () => {
		const fn = fetchMock(mietspiegel);
		await fetchLayer('mietspiegel.abc12345.geojson', fn as unknown as typeof fetch);
		await fetchLayer('mietspiegel.abc12345.geojson', fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('wirft bei HTTP-Error', async () => {
		const fn = vi.fn(async () => new Response('', { status: 500 }));
		await expect(
			fetchLayer('broken.deadbeef.geojson', fn as unknown as typeof fetch)
		).rejects.toThrow(/500/);
	});
});
