import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SankeyWahljahreContextProbe from './internal/sankey-wahljahre-context-probe.svelte';
import { _resetWinnersCache } from './internal/winner-map-winners.svelte.js';
import type { WahlPortalListEntry } from '$lib/state/wahl-portal-context.svelte.js';

const WAHLEN: WahlPortalListEntry[] = [
	{
		slug: '2023-agh-zweitstimme',
		jahr: 2023,
		typ: 'agh',
		isRepeatElection: true,
		sourceName: 'Amt für Statistik Berlin-Brandenburg',
		license: 'dl-de/by-2-0'
	}
];

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

beforeEach(() => {
	_resetWinnersCache();
});

afterEach(() => {
	_resetWinnersCache();
});

describe('sankey-wahljahre.svelte', () => {
	it('zeigt einen Lade-Hinweis vor der Winners-Antwort', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', { winners: [] }]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-loading')).toBeInTheDocument();
	});

	it('DB-los/leer: zeigt einen Hinweis statt leerer Grafik, kein Crash', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', { winners: [] }]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-empty')).toBeInTheDocument();
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).not.toBeInTheDocument();
	});

	it('zeigt eine Fehlermeldung, wenn die Winners-API fehlschlägt', async () => {
		const fetchFn = (async () => new Response('boom', { status: 500 })) as typeof fetch;
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-error')).toBeInTheDocument();
	});

	it('I/O-Matrix Sankey AGH Kiez: rendert gebündelte Bänder, 2021 erscheint nicht als eigene Spalte, Fußnoten sichtbar', async () => {
		const winners = {
			winners: [
				{
					jahr: 2016,
					gebiet_slug: 'a',
					partei: 'SPD',
					farbe_hex: '#A50C1A',
					anteil: 0.4,
					is_repeat_election: false,
					parent_slug: null
				},
				{
					jahr: 2021,
					gebiet_slug: 'a',
					partei: 'GRÜNE',
					farbe_hex: '#0F6E2C',
					anteil: 0.35,
					is_repeat_election: false,
					parent_slug: null
				},
				{
					jahr: 2023,
					gebiet_slug: 'a',
					partei: 'GRÜNE',
					farbe_hex: '#0F6E2C',
					anteil: 0.38,
					is_repeat_election: true,
					parent_slug: '2021-agh-zweitstimme'
				}
			],
			license: 'dl-de/by-2.0',
			source_name: 'Amt für Statistik Berlin-Brandenburg'
		};
		const fetchFn = fakeFetch([['/api/wahl/winners', winners]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });

		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();
		const labels = page.getByTestId('sankey-column-label');
		await expect.element(labels.first()).toHaveTextContent('2016');
		await expect.element(labels.nth(1)).toHaveTextContent('2023');
		await expect.element(labels.nth(1)).toHaveTextContent('·W');

		await expect.element(page.getByTestId('sankey-band')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('sankey-wahljahre-datenstand'))
			.toHaveTextContent('Amt für Statistik Berlin-Brandenburg');
		await expect
			.element(page.getByTestId('sankey-wahljahre-footnote-wiederholung'))
			.toHaveTextContent('Wiederholungswahl-Regel');
		await expect.element(page.getByTestId('sankey-wahljahre-footnote-coverage')).toBeInTheDocument();

		// Review Triage Log #4: Farbe allein ist kein Label -- mindestens ein
		// sichtbarer Knoten-Label-Text mit Partei-Namen.
		const nodeLabels = page.getByTestId('sankey-node-label');
		await expect.element(nodeLabels.first()).toBeInTheDocument();
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toHaveAttribute(
			'aria-label',
			'Sankey der Partei-Übergänge, Ebene Kiez, 2016 bis 2023, 1 Gebiete'
		);

		await page.getByTestId('table-toggle').click();
		await expect.element(page.getByTestId('data-table')).toHaveTextContent('SPD');
		await expect.element(page.getByTestId('data-table')).toHaveTextContent('GRÜNE');
	});

	it('Coverage-Fußnote nur auf Kiez-Ebene (Review Triage Log #3)', async () => {
		const winners = {
			winners: [
				{
					jahr: 2016,
					gebiet_slug: 'a',
					partei: 'SPD',
					farbe_hex: '#A50C1A',
					anteil: 0.4,
					is_repeat_election: false,
					parent_slug: null
				},
				{
					jahr: 2021,
					gebiet_slug: 'a',
					partei: 'GRÜNE',
					farbe_hex: '#0F6E2C',
					anteil: 0.35,
					is_repeat_election: false,
					parent_slug: null
				}
			]
		};
		const fetchFn = fakeFetch([['/api/wahl/winners', winners]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });

		await expect.element(page.getByTestId('sankey-wahljahre-footnote-coverage')).toBeInTheDocument();
		await page.getByTestId('sankey-ebene-bezirk').click();
		await expect.element(page.getByTestId('sankey-wahljahre-footnote-coverage')).not.toBeInTheDocument();
	});

	it('Ebenen-Toggle: Klick auf Bezirk lädt einen eigenen (gecachten) Winners-Request', async () => {
		let winnersRequestCount = 0;
		const fetchFn = (async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('/api/wahl/winners')) {
				winnersRequestCount++;
				return new Response(JSON.stringify({ winners: [] }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			return new Response('not found', { status: 404 });
		}) as typeof fetch;
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-empty')).toBeInTheDocument();
		expect(winnersRequestCount).toBe(1);

		await page.getByTestId('sankey-ebene-bezirk').click();
		await expect.element(page.getByTestId('sankey-ebene-bezirk')).toHaveAttribute('aria-checked', 'true');
		expect(winnersRequestCount).toBe(2);

		// Rückwechsel zu kiez: gecacht, kein dritter Request.
		await page.getByTestId('sankey-ebene-kiez').click();
		expect(winnersRequestCount).toBe(2);
	});
});
