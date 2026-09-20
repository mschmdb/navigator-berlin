import { describe, expect, it } from 'vitest';
import { KbWinnersGate } from './winner-map-kb-gate.svelte.js';
import { KiezBezirkWinnersLoader, _resetWinnersCache } from './winner-map-winners.svelte.js';

function fakeFetch(routes: ReadonlyArray<[string, unknown]>): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();
		for (const [pattern, data] of routes) {
			if (url.includes(pattern)) {
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
		}
		return new Response('not found', { status: 404 });
	}) as typeof fetch;
}

const GEWINNER_RESPONSE = {
	winners: [{ jahr: 2023, gebiet_slug: 'a', partei: 'SPD', farbe_hex: '#000', anteil: 0.4, is_repeat_election: false, parent_slug: null }]
};
const SPD_RESPONSE = {
	winners: [{ jahr: 2023, gebiet_slug: 'a', partei: 'SPD', farbe_hex: '#000', anteil: 0.1, is_repeat_election: false, parent_slug: null }]
};

describe('KbWinnersGate', () => {
	it('triggert den Fetch nur auf kiez/bezirk, nicht auf stimmbezirk', async () => {
		_resetWinnersCache();
		let calls = 0;
		const loader = new KiezBezirkWinnersLoader(
			(async () => {
				calls++;
				return new Response(JSON.stringify(GEWINNER_RESPONSE), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}) as typeof fetch
		);
		const gate = new KbWinnersGate({
			loader,
			getReihe: () => 'agh',
			getStimmtyp: () => 'zweitstimme',
			getAnzeigeEbene: () => 'stimmbezirk',
			getAktivePartei: () => null
		});
		gate.triggerFetch();
		gate.updateEffectiveRows();
		await Promise.resolve();
		expect(calls).toBe(0);
	});

	it('übernimmt die Response, wenn ihre Rows zur aktiven Partei passen (Review-Fund #7)', async () => {
		_resetWinnersCache();
		const loader = new KiezBezirkWinnersLoader(fakeFetch([['partei=SPD', SPD_RESPONSE]]));
		// Erst deterministisch laden (kein Timing-Raten auf Fetch/JSON-Ticks),
		// dann die Gate-Latch-Logik isoliert prüfen: der zweite `load()`-Aufruf
		// innerhalb von `sync()` trifft danach synchron den Cache.
		await loader.load('agh', 'zweitstimme', 'kiez', () => false, 'SPD');
		const gate = new KbWinnersGate({
			loader,
			getReihe: () => 'agh',
			getStimmtyp: () => 'zweitstimme',
			getAnzeigeEbene: () => 'kiez',
			getAktivePartei: () => 'SPD'
		});
		gate.triggerFetch();
		gate.updateEffectiveRows();
		expect(gate.effectiveRows).toEqual(SPD_RESPONSE.winners);
	});

	it('übernimmt eine noch nicht aktualisierte (falsche) Loader-Response NICHT (Review-Fund #7)', () => {
		const loader = new KiezBezirkWinnersLoader(fakeFetch([]));
		// Loader-Response gehört noch zu SPD (vorheriger Tab), aktivePartei ist
		// bereits CDU (neuer Klick, Fetch noch unterwegs) -- ohne Guard würde
		// effectiveRows sofort (fälschlich) auf SPD-Rows springen.
		loader.response = SPD_RESPONSE;
		const gate = new KbWinnersGate({
			loader,
			getReihe: () => 'agh',
			getStimmtyp: () => 'zweitstimme',
			getAnzeigeEbene: () => 'kiez',
			getAktivePartei: () => 'CDU'
		});
		gate.triggerFetch();
		gate.updateEffectiveRows();
		expect(gate.effectiveRows).toEqual([]);
	});
});
