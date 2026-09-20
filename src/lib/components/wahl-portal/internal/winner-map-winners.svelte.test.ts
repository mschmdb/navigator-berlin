import { describe, expect, it } from 'vitest';
import { KiezBezirkWinnersLoader, _resetWinnersCache } from './winner-map-winners.svelte.js';

const WINNERS_BODY = {
	winners: [
		{
			jahr: 2023,
			gebiet_slug: 'a',
			partei: 'SPD',
			farbe_hex: '#000000',
			anteil: 0.4,
			is_repeat_election: false,
			parent_slug: null
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

describe('KiezBezirkWinnersLoader (Modul-Cache + In-Flight-Dedupe)', () => {
	it('zwei Loader-Instanzen, gleicher Key: genau EIN fetch-Aufruf, beide laden erfolgreich (AC "genau EIN Request")', async () => {
		_resetWinnersCache();
		const { fetchFn, count } = fetchCounter(WINNERS_BODY);
		const loaderA = new KiezBezirkWinnersLoader(fetchFn);
		const loaderB = new KiezBezirkWinnersLoader(fetchFn);

		await Promise.all([
			loaderA.load('agh', 'zweitstimme', 'kiez', () => false),
			loaderB.load('agh', 'zweitstimme', 'kiez', () => false)
		]);

		expect(count()).toBe(1);
		expect(loaderA.status).toBe('loaded');
		expect(loaderB.status).toBe('loaded');
		expect(loaderA.response?.winners).toEqual(WINNERS_BODY.winners);
		expect(loaderB.response?.winners).toEqual(WINNERS_BODY.winners);
	});

	it('ein zweiter Aufruf nach erfolgreichem Laden nutzt den Cache, kein zweiter fetch', async () => {
		_resetWinnersCache();
		const { fetchFn, count } = fetchCounter(WINNERS_BODY);
		const loaderA = new KiezBezirkWinnersLoader(fetchFn);
		await loaderA.load('agh', 'zweitstimme', 'kiez', () => false);
		expect(count()).toBe(1);

		const loaderB = new KiezBezirkWinnersLoader(fetchFn);
		await loaderB.load('agh', 'zweitstimme', 'kiez', () => false);
		expect(count()).toBe(1);
		expect(loaderB.status).toBe('loaded');
	});

	it('Fehlerfall räumt den In-Flight-Eintrag: ein erneuter load() versucht es neu statt für immer zu hängen', async () => {
		_resetWinnersCache();
		const failing = fetchCounter({}, 500);
		const loaderA = new KiezBezirkWinnersLoader(failing.fetchFn);
		await loaderA.load('agh', 'zweitstimme', 'kiez', () => false);
		expect(loaderA.status).toBe('error');
		expect(failing.count()).toBe(1);

		const succeeding = fetchCounter(WINNERS_BODY);
		const loaderB = new KiezBezirkWinnersLoader(succeeding.fetchFn);
		await loaderB.load('agh', 'zweitstimme', 'kiez', () => false);
		expect(loaderB.status).toBe('loaded');
		expect(succeeding.count()).toBe(1);
	});

	it('unterschiedliche Keys (Reihe/Stimmtyp/Ebene) lösen unabhängige Requests aus', async () => {
		_resetWinnersCache();
		const { fetchFn, count } = fetchCounter(WINNERS_BODY);
		const loaderA = new KiezBezirkWinnersLoader(fetchFn);
		const loaderB = new KiezBezirkWinnersLoader(fetchFn);
		await Promise.all([
			loaderA.load('agh', 'zweitstimme', 'kiez', () => false),
			loaderB.load('agh', 'zweitstimme', 'bezirk', () => false)
		]);
		expect(count()).toBe(2);
	});

	it('Story 9: partei-Param hängt an die URL an und erweitert den Cache-Key (eigener Request pro Partei)', async () => {
		_resetWinnersCache();
		const { fetchFn, count } = fetchCounter(WINNERS_BODY);
		let lastUrl = '';
		const spyFetch = (async (url: string) => {
			lastUrl = url;
			return fetchFn(url);
		}) as typeof fetch;
		const loader = new KiezBezirkWinnersLoader(spyFetch);
		await loader.load('agh', 'zweitstimme', 'kiez', () => false, 'CDU');
		expect(lastUrl).toContain('partei=CDU');
		expect(count()).toBe(1);
	});

	it('Story 9: Gewinner-Tab (kein partei) und Partei-Tab teilen sich NICHT denselben Cache-Eintrag', async () => {
		_resetWinnersCache();
		const { fetchFn, count } = fetchCounter(WINNERS_BODY);
		const loaderA = new KiezBezirkWinnersLoader(fetchFn);
		const loaderB = new KiezBezirkWinnersLoader(fetchFn);
		await Promise.all([
			loaderA.load('agh', 'zweitstimme', 'kiez', () => false),
			loaderB.load('agh', 'zweitstimme', 'kiez', () => false, 'CDU')
		]);
		expect(count()).toBe(2);
	});

	it('Story 9: zwei Aufrufer mit demselben Partei-Key teilen sich einen In-Flight-Request', async () => {
		_resetWinnersCache();
		const { fetchFn, count } = fetchCounter(WINNERS_BODY);
		const loaderA = new KiezBezirkWinnersLoader(fetchFn);
		const loaderB = new KiezBezirkWinnersLoader(fetchFn);
		await Promise.all([
			loaderA.load('agh', 'zweitstimme', 'kiez', () => false, 'SPD'),
			loaderB.load('agh', 'zweitstimme', 'kiez', () => false, 'SPD')
		]);
		expect(count()).toBe(1);
	});
});
