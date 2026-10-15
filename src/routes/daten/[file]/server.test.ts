import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadManifest } from '$lib/data/manifest.js';
import type { Manifest } from '$lib/data/types.js';

const manifest: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-10-15T00:00:00.000Z',
	layers: [
		{
			slug: 'laerm-2023',
			filename: 'laerm-2023.aaaa1111.geojson',
			sourceUrl: 'https://example.com/laerm.geojson',
			fetchedAt: '2026-10-01T00:00:00.000Z',
			license: 'dl-de/zero-2-0',
			sha256: 'a',
			bundleGroup: 'C: Umwelt',
			zoomThresholds: { min: 8, max: 16 },
			geometryType: 'Polygon',
			featureCount: 1
		},
		{
			slug: 'klima-pet-2022',
			filename: 'klima-pet-2022.bbbb2222.pmtiles',
			sourceUrl: 'https://example.com/pet',
			fetchedAt: '2026-10-01T00:00:00.000Z',
			license: 'dl-de/by-2-0',
			sha256: 'b',
			bundleGroup: 'C: Umwelt',
			zoomThresholds: { min: 8, max: 16 },
			geometryType: 'Polygon',
			featureCount: 1,
			format: 'pmtiles'
		}
	]
};

vi.mock('$lib/data/manifest.js', () => ({
	loadManifest: vi.fn(async () => manifest)
}));

async function call(file: string): Promise<Response> {
	const mod = await import('./+server.js');
	return mod.GET({
		params: { file },
		fetch: globalThis.fetch
	} as Parameters<typeof mod.GET>[0]);
}

beforeEach(() => {
	vi.resetModules();
});

describe('GET /daten/[file]', () => {
	it('leitet mit 302 auf die aktuelle Hash-Datei', { timeout: 20_000 }, async () => {
		const res = await call('laerm-2023.geojson');
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('/layers/laerm-2023.aaaa1111.geojson');
	});

	it('leitet pmtiles-Layer auf die pmtiles-Datei', async () => {
		const res = await call('klima-pet-2022.pmtiles');
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('/layers/klima-pet-2022.bbbb2222.pmtiles');
	});

	it('liefert 404 fuer unbekannten Slug', async () => {
		expect((await call('gibt-es-nicht.geojson')).status).toBe(404);
	});

	it('liefert 404 bei falscher Endung fuer das Layer-Format', async () => {
		expect((await call('laerm-2023.pmtiles')).status).toBe(404);
		expect((await call('klima-pet-2022.geojson')).status).toBe(404);
	});

	it('liefert 404 fuer ungueltige Dateinamen', async () => {
		expect((await call('laerm-2023')).status).toBe(404);
		expect((await call('..%2Fsecret.geojson')).status).toBe(404);
		expect((await call('laerm-2023.exe')).status).toBe(404);
	});

	it('setzt no-cache auf den Redirect', async () => {
		const res = await call('laerm-2023.geojson');
		expect(res.headers.get('cache-control')).toBe('no-cache');
	});

	it('liefert 503 ohne Cache, wenn das Manifest nicht ladbar ist', async () => {
		vi.mocked(loadManifest).mockRejectedValueOnce(new Error('HTTP 500'));
		const res = await call('laerm-2023.geojson');
		expect(res.status).toBe(503);
		expect(res.headers.get('cache-control')).toBe('no-store');
	});

	it('deaktiviert Prerendering', async () => {
		const mod = await import('./+server.js');
		expect(mod.prerender).toBe(false);
	});
});
