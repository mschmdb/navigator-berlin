import { describe, expect, it } from 'vitest';
import { AnalytikLoader, _resetAnalytikCache } from './trends-analytik.svelte.js';

const ANALYTIK_BODY = {
	gebiete: [
		{
			kiez_slug: 'hansaviertel',
			wechsel_count: 1,
			wechsel_jahre: [2023],
			volatilitaet: 0.08,
			trends: [{ partei: 'GRÜNE', slope: 0.012 }]
		}
	]
};

function fetchCounter(body: unknown, status = 200) {
	let count = 0;
	const fetchFn = (async () => {
		count++;
		return new Response(JSON.stringify(body), {
			status,
			headers: { 'content-type': 'application/json' }
		});
	}) as typeof fetch;
	return { fetchFn, count: () => count };
}

describe('AnalytikLoader (Modul-Cache + In-Flight-Dedupe)', () => {
	it('zwei Loader-Instanzen, gleicher Key: genau EIN fetch-Aufruf, beide laden erfolgreich', async () => {
		_resetAnalytikCache();
		const { fetchFn, count } = fetchCounter(ANALYTIK_BODY);
		const loaderA = new AnalytikLoader(fetchFn);
		const loaderB = new AnalytikLoader(fetchFn);

		await Promise.all([
			loaderA.load('agh', 'zweitstimme', () => false),
			loaderB.load('agh', 'zweitstimme', () => false)
		]);

		expect(count()).toBe(1);
		expect(loaderA.status).toBe('loaded');
		expect(loaderB.response?.gebiete).toEqual(ANALYTIK_BODY.gebiete);
	});

	it('ein zweiter Aufruf nach erfolgreichem Laden nutzt den Cache, kein zweiter fetch', async () => {
		_resetAnalytikCache();
		const { fetchFn, count } = fetchCounter(ANALYTIK_BODY);
		const loaderA = new AnalytikLoader(fetchFn);
		await loaderA.load('agh', 'zweitstimme', () => false);
		expect(count()).toBe(1);

		const loaderB = new AnalytikLoader(fetchFn);
		await loaderB.load('agh', 'zweitstimme', () => false);
		expect(count()).toBe(1);
		expect(loaderB.status).toBe('loaded');
	});

	it('DB-los/leer: 200 mit leerer Liste setzt status loaded, keine Fehleranzeige', async () => {
		_resetAnalytikCache();
		const { fetchFn } = fetchCounter({ gebiete: [] });
		const loader = new AnalytikLoader(fetchFn);
		await loader.load('agh', 'zweitstimme', () => false);
		expect(loader.status).toBe('loaded');
		expect(loader.response?.gebiete).toEqual([]);
	});

	it('Fehlerfall räumt den In-Flight-Eintrag: ein erneuter load() versucht es neu statt für immer zu hängen', async () => {
		_resetAnalytikCache();
		const failing = fetchCounter({}, 500);
		const loaderA = new AnalytikLoader(failing.fetchFn);
		await loaderA.load('agh', 'zweitstimme', () => false);
		expect(loaderA.status).toBe('error');

		const succeeding = fetchCounter(ANALYTIK_BODY);
		const loaderB = new AnalytikLoader(succeeding.fetchFn);
		await loaderB.load('agh', 'zweitstimme', () => false);
		expect(loaderB.status).toBe('loaded');
	});

	it('Stale-Guard: eine überholte Antwort schreibt weder response noch status', async () => {
		_resetAnalytikCache();
		const { fetchFn } = fetchCounter(ANALYTIK_BODY);
		const loader = new AnalytikLoader(fetchFn);
		await loader.load('agh', 'zweitstimme', () => true);
		expect(loader.status).toBe('loading');
		expect(loader.response).toBeNull();
	});

	it('unterschiedliche Keys (Reihe/Stimmtyp) lösen unabhängige Requests aus', async () => {
		_resetAnalytikCache();
		const { fetchFn, count } = fetchCounter(ANALYTIK_BODY);
		const loaderA = new AnalytikLoader(fetchFn);
		const loaderB = new AnalytikLoader(fetchFn);
		await Promise.all([
			loaderA.load('agh', 'zweitstimme', () => false),
			loaderB.load('bvv', 'einstimme', () => false)
		]);
		expect(count()).toBe(2);
	});
});
