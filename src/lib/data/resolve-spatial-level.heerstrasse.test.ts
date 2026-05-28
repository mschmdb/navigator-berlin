import { describe, expect, it, beforeEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { resolveSpatialLevel } from './resolve-spatial-level.js';
import { _resetManifestCache } from './manifest.js';
import { _resetLayerCache } from './internal/layer-fetch.js';
import { _resetIndexCache } from './internal/spatial-index.js';

/**
 * Integration gegen echte static/layers-Daten: ein Punkt im Duplikat-Kiez
 * "Heerstraße" muss den Bezirk-suffixed kiezSlug liefern, damit Karten-Links
 * + Wahl-DB-Lookup (suffixed-keyed) treffen (8.2b-Mismatch-Fix).
 */
const fsFetch = (async (input: string) => {
	const path = typeof input === 'string' ? input : String(input);
	if (path.startsWith('/layers/')) {
		const file = resolve(process.cwd(), 'static', path.replace(/^\//, ''));
		const body = await readFile(file, 'utf-8');
		return new Response(body, { status: 200 });
	}
	return new Response('404', { status: 404 });
}) as unknown as typeof fetch;

beforeEach(() => {
	_resetManifestCache();
	_resetLayerCache();
	_resetIndexCache();
});

describe('resolveSpatialLevel · Heerstraße-Disambiguierung', () => {
	it('Punkt in Heerstraße/Spandau liefert suffixed kiezSlug', async () => {
		const ctx = await resolveSpatialLevel(52.5158, 13.15298, fsFetch);
		expect(ctx.kiezName).toBe('Heerstraße');
		expect(ctx.bezirkName).toBe('Spandau');
		expect(ctx.kiezSlug).toBe('heerstrasse-spandau');
	});

	it('Punkt in Heerstraße/Charlottenburg-Wilmersdorf liefert suffixed kiezSlug', async () => {
		const ctx = await resolveSpatialLevel(52.49747, 13.23055, fsFetch);
		expect(ctx.kiezName).toBe('Heerstraße');
		expect(ctx.bezirkName).toBe('Charlottenburg-Wilmersdorf');
		expect(ctx.kiezSlug).toBe('heerstrasse-charlottenburg-wilmersdorf');
	});
});
