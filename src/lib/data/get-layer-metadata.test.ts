import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getLayerMetadata } from './get-layer-metadata.js';
import { loadManifest, _resetManifestCache } from './manifest.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mini = JSON.parse(
	readFileSync(join(__dirname, './__fixtures__/mini-manifest.json'), 'utf-8')
);

beforeEach(() => _resetManifestCache());
afterEach(() => vi.restoreAllMocks());

describe('getLayerMetadata', () => {
	it('liefert Metadata fuer bekannten Slug', async () => {
		const fn = vi.fn(async () => new Response(JSON.stringify(mini), { status: 200 }));
		await loadManifest(fn as unknown as typeof fetch);
		const m = getLayerMetadata('bezirke');
		expect(m.slug).toBe('bezirke');
		expect(m.bundleGroup).toBe('A: Boundaries');
	});

	it('wirft bei unknown Slug', async () => {
		const fn = vi.fn(async () => new Response(JSON.stringify(mini), { status: 200 }));
		await loadManifest(fn as unknown as typeof fetch);
		expect(() => getLayerMetadata('unknown-xyz')).toThrow(/Unknown layer/);
	});
});
