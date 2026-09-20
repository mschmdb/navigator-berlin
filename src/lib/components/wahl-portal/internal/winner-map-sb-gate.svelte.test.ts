import { describe, expect, it } from 'vitest';
import { SbWinnersGate } from './winner-map-sb-gate.svelte.js';
import { StimmbezirkLoader } from './winner-map-stimmbezirk.svelte.js';

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

const SPD_RESPONSE = {
	winners: [
		{
			jahr: 2023,
			gebiet_slug: 'a',
			partei: 'SPD',
			farbe_hex: '#000',
			anteil: 0.1,
			is_repeat_election: false,
			parent_slug: null
		}
	]
};

describe('SbWinnersGate', () => {
	it('triggert den Fetch nur auf stimmbezirk mit bekanntem Jahr/wahlSlug', async () => {
		let calls = 0;
		const loader = new StimmbezirkLoader(
			(async () => {
				calls++;
				return new Response(JSON.stringify(SPD_RESPONSE), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}) as typeof fetch
		);
		const gate = new SbWinnersGate({
			loader,
			getReihe: () => 'agh',
			getStimmtyp: () => 'zweitstimme',
			getJahr: () => null,
			getWahlSlug: () => null,
			getAnzeigeEbene: () => 'stimmbezirk',
			getAktivePartei: () => null
		});
		gate.triggerFetch();
		gate.updateEffectiveRows();
		await Promise.resolve();
		expect(calls).toBe(0);
	});

	it('übernimmt die Response, wenn ihre Rows zur aktiven Partei passen (Review-Fund #7)', async () => {
		const loader = new StimmbezirkLoader(fakeFetch([['partei=SPD', SPD_RESPONSE]]));
		// Erst deterministisch laden, dann die Gate-Latch-Logik isoliert prüfen
		// (der zweite `loadWinners()`-Aufruf innerhalb von `sync()` trifft
		// danach synchron den Cache, kein Timing-Raten auf Fetch/JSON-Ticks).
		await loader.loadWinners('agh', 'zweitstimme', 2023, () => false, 'SPD');
		const gate = new SbWinnersGate({
			loader,
			getReihe: () => 'agh',
			getStimmtyp: () => 'zweitstimme',
			getJahr: () => 2023,
			getWahlSlug: () => '2023-agh-zweitstimme',
			getAnzeigeEbene: () => 'stimmbezirk',
			getAktivePartei: () => 'SPD'
		});
		gate.triggerFetch();
		gate.updateEffectiveRows();
		expect(gate.effectiveRows).toEqual(SPD_RESPONSE.winners);
	});

	it('übernimmt eine noch nicht aktualisierte (falsche) Loader-Response NICHT', () => {
		const loader = new StimmbezirkLoader(fakeFetch([]));
		loader.winnersResponse = SPD_RESPONSE;
		const gate = new SbWinnersGate({
			loader,
			getReihe: () => 'agh',
			getStimmtyp: () => 'zweitstimme',
			getJahr: () => 2023,
			getWahlSlug: () => '2023-agh-zweitstimme',
			getAnzeigeEbene: () => 'stimmbezirk',
			getAktivePartei: () => 'CDU'
		});
		gate.triggerFetch();
		gate.updateEffectiveRows();
		expect(gate.effectiveRows).toEqual([]);
	});
});
