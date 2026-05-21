import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLayerAggregates, _resetLayerAggregatesCache } from './get-layer-aggregates.js';

const sample = {
	schemaVersion: 1,
	generatedAt: '2026-05-20T00:00:00.000Z',
	aggregates: { 'laerm-2023': { type: 'ordinal-distribution', kiez: {}, bezirk: {}, berlin: {} } }
};

beforeEach(() => _resetLayerAggregatesCache());
afterEach(() => vi.restoreAllMocks());

describe('loadLayerAggregates', () => {
	it('lädt + parsed die Aggregat-JSON', async () => {
		const fn = vi.fn(async () => new Response(JSON.stringify(sample), { status: 200 }));
		const r = await loadLayerAggregates(fn as unknown as typeof fetch);
		expect(r.schemaVersion).toBe(1);
		expect(r.aggregates['laerm-2023']).toBeDefined();
	});

	it('cached: zweiter Aufruf ohne Re-Fetch', async () => {
		const fn = vi.fn(async () => new Response(JSON.stringify(sample), { status: 200 }));
		await loadLayerAggregates(fn as unknown as typeof fetch);
		await loadLayerAggregates(fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('wirft bei HTTP-Fehler', async () => {
		const fn = vi.fn(async () => new Response('nope', { status: 404 }));
		await expect(loadLayerAggregates(fn as unknown as typeof fetch)).rejects.toThrow();
	});

	it('wirft bei falschem Schema', async () => {
		const fn = vi.fn(async () => new Response(JSON.stringify({ foo: 1 }), { status: 200 }));
		await expect(loadLayerAggregates(fn as unknown as typeof fetch)).rejects.toThrow();
	});
});
