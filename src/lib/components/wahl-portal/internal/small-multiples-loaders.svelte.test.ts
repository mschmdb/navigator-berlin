import { describe, expect, it } from 'vitest';
import { SmallMultiplesLoaders } from './small-multiples-loaders.svelte.js';
import { _resetWinnersCache } from './winner-map-winners.svelte.js';
import { FINDER_PARTIES } from '$lib/components/atlas/internal/kiez-finder-engine.js';

function fetchCounter() {
	let count = 0;
	const seenUrls: string[] = [];
	const fetchFn = (async (input: RequestInfo | URL) => {
		count++;
		seenUrls.push(typeof input === 'string' ? input : input.toString());
		return new Response(JSON.stringify({ winners: [] }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}) as typeof fetch;
	return { fetchFn, count: () => count, seenUrls };
}

describe('SmallMultiplesLoaders', () => {
	it('lädt alle 7 FINDER_PARTIES parallel, ein Request je Partei', async () => {
		_resetWinnersCache();
		const { fetchFn, count, seenUrls } = fetchCounter();
		const loaders = new SmallMultiplesLoaders(fetchFn);
		await loaders.loadAll('agh', 'zweitstimme', () => false);
		expect(count()).toBe(7);
		for (const partei of FINDER_PARTIES) {
			expect(seenUrls.some((u) => u.includes(`partei=${encodeURIComponent(partei)}`))).toBe(true);
		}
	});

	it('teilt sich den Cache mit einem bereits geladenen Partei-Tab (kein zweiter Request)', async () => {
		_resetWinnersCache();
		const { fetchFn, count } = fetchCounter();
		const { KiezBezirkWinnersLoader } = await import('./winner-map-winners.svelte.js');
		const tabLoader = new KiezBezirkWinnersLoader(fetchFn);
		await tabLoader.load('agh', 'zweitstimme', 'kiez', () => false, 'CDU');
		expect(count()).toBe(1);

		const loaders = new SmallMultiplesLoaders(fetchFn);
		await loaders.loadAll('agh', 'zweitstimme', () => false);
		// CDU kam aus dem Cache (kein neuer Request), die restlichen 6 schon.
		expect(count()).toBe(7);
		expect(loaders.byPartei['CDU'].status).toBe('loaded');
	});

	it('allLoaded/anyError spiegeln den aggregierten Zustand', async () => {
		_resetWinnersCache();
		const { fetchFn } = fetchCounter();
		const loaders = new SmallMultiplesLoaders(fetchFn);
		expect(loaders.allLoaded).toBe(false);
		await loaders.loadAll('agh', 'zweitstimme', () => false);
		expect(loaders.allLoaded).toBe(true);
		expect(loaders.anyError).toBe(false);
	});

	it('Review-Fund #10: statusFor/allFailed unterscheiden eine einzelne fehlgeschlagene Partei von einem Alles-scheitert-Zustand', async () => {
		_resetWinnersCache();
		const fetchFn = (async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('partei=SPD')) return new Response('fehler', { status: 500 });
			return new Response(JSON.stringify({ winners: [] }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;
		const loaders = new SmallMultiplesLoaders(fetchFn);
		await loaders.loadAll('agh', 'zweitstimme', () => false);
		expect(loaders.statusFor('SPD')).toBe('error');
		expect(loaders.statusFor('CDU')).toBe('loaded');
		expect(loaders.anyError).toBe(true);
		expect(loaders.allFailed).toBe(false);
	});
});
