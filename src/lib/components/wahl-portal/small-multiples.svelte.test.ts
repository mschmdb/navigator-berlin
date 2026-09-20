import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SmallMultiplesContextProbe from './internal/small-multiples-context-probe.svelte';
import { _resetManifestCache } from '$lib/data/manifest.js';
import { _resetLayerCache } from '$lib/data/internal/layer-fetch.js';
import { _resetWinnersCache } from './internal/winner-map-winners.svelte.js';
import { FINDER_PARTIES } from '$lib/components/atlas/internal/kiez-finder-engine.js';
import type { WahlPortalListEntry } from '$lib/state/wahl-portal-context.svelte.js';

const SHA = 'a'.repeat(64);

function layerMeta(overrides: Record<string, unknown>) {
	return {
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/x/data.geojson',
		fetchedAt: '2026-05-16T06:56:28.400Z',
		license: 'dl-de/zero-2-0',
		sha256: SHA,
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 8, max: 12 },
		geometryType: 'Polygon',
		...overrides
	};
}

const MANIFEST = {
	schemaVersion: 1,
	generatedAt: '2026-05-16T06:56:28.400Z',
	layers: [
		layerMeta({ slug: 'bezirke', filename: 'bezirke.aaaaaaaa.geojson', featureCount: 1 }),
		layerMeta({
			slug: 'lor-bezirksregion',
			filename: 'lor-bezirksregion.bbbbbbbb.geojson',
			featureCount: 2
		})
	]
};

function polygon() {
	return {
		type: 'Polygon' as const,
		coordinates: [
			[
				[13.3, 52.5],
				[13.3, 52.51],
				[13.31, 52.51],
				[13.3, 52.5]
			]
		]
	};
}

const BEZIRKE_FC = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { Gemeinde_name: 'Mitte', Schluessel_gesamt: '11000001' }
		}
	]
};

const KIEZ_FC = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { BZR_ID: '010101', BZR_NAME: 'Hansaviertel', BEZ: '01' }
		},
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { BZR_ID: '010102', BZR_NAME: 'Moabit', BEZ: '01' }
		}
	]
};

const WAHLEN_2023: WahlPortalListEntry[] = [
	{
		slug: '2023-agh-zweitstimme',
		jahr: 2023,
		typ: 'agh',
		isRepeatElection: false,
		sourceName: 'Amt für Statistik Berlin-Brandenburg',
		license: 'dl-de/by-2-0'
	}
];

function fakeFetch(): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();
		if (url.includes('MANIFEST.json')) {
			return new Response(JSON.stringify(MANIFEST), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
		if (url.includes('bezirke.aaaaaaaa.geojson')) {
			return new Response(JSON.stringify(BEZIRKE_FC), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
		if (url.includes('lor-bezirksregion.bbbbbbbb.geojson')) {
			return new Response(JSON.stringify(KIEZ_FC), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
		if (url.includes('/api/wahl/winners')) {
			const parteiMatch = /partei=([^&]+)/.exec(url);
			const partei = parteiMatch ? decodeURIComponent(parteiMatch[1]) : '';
			// BSW hat in dieser Fixture keine Daten (I/O-Matrix "Partei ohne Daten").
			if (partei === 'BSW') {
				return new Response(JSON.stringify({ winners: [] }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			return new Response(
				JSON.stringify({
					winners: [
						{
							jahr: 2023,
							gebiet_slug: 'hansaviertel',
							partei,
							farbe_hex: '#000000',
							anteil: 0.4,
							is_repeat_election: false,
							parent_slug: null
						},
						{
							jahr: 2023,
							gebiet_slug: 'moabit',
							partei,
							farbe_hex: '#000000',
							anteil: 0.2,
							is_repeat_election: false,
							parent_slug: null
						}
					],
					license: 'dl-de/by-2-0',
					source_name: 'Amt für Statistik Berlin-Brandenburg'
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } }
			);
		}
		return new Response('not found', { status: 404 });
	}) as typeof fetch;
}

describe('small-multiples.svelte', () => {
	beforeEach(() => {
		_resetManifestCache();
		_resetLayerCache();
		_resetWinnersCache();
	});

	it('rendert 7 Mini-Karten mit stärkstem/schwächstem Kiez benannt', async () => {
		render(SmallMultiplesContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			wahlen: WAHLEN_2023,
			fetchFn: fakeFetch()
		});
		await expect.element(page.getByTestId('small-multiples')).toBeInTheDocument();
		for (const partei of FINDER_PARTIES) {
			await expect.element(page.getByTestId(`small-multiples-mini-${partei}`)).toBeInTheDocument();
		}
		expect(FINDER_PARTIES.length).toBe(7);
		const spdMini = page.getByTestId('small-multiples-mini-SPD');
		await expect.element(spdMini.getByText('Hansaviertel (40,0 %)')).toBeInTheDocument();
		await expect.element(spdMini.getByText('Moabit (20,0 %)')).toBeInTheDocument();
	});

	it('zeigt für eine Partei ohne Daten (BSW) einen neutralen Hinweis statt einer leeren Karte', async () => {
		render(SmallMultiplesContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			wahlen: WAHLEN_2023,
			fetchFn: fakeFetch()
		});
		await expect
			.element(page.getByTestId('small-multiples-mini-BSW-keine-daten'))
			.toBeInTheDocument();
	});

	it('bietet eine Tabellen-Alternative mit Partei/stärkstem/schwächstem Kiez', async () => {
		render(SmallMultiplesContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			wahlen: WAHLEN_2023,
			fetchFn: fakeFetch()
		});
		await expect.element(page.getByTestId('small-multiples')).toBeInTheDocument();
		await page.getByTestId('table-toggle').click();
		await expect.element(page.getByTestId('data-table')).toBeInTheDocument();
	});

	it('Review-Fund #10: eine fehlgeschlagene Partei (500) blendet nicht alle Minis aus -- 6 Minis + 1 Fehler-Kachel', async () => {
		const failingFetch = (async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('MANIFEST.json')) {
				return new Response(JSON.stringify(MANIFEST), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('bezirke.aaaaaaaa.geojson')) {
				return new Response(JSON.stringify(BEZIRKE_FC), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('lor-bezirksregion.bbbbbbbb.geojson')) {
				return new Response(JSON.stringify(KIEZ_FC), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('/api/wahl/winners')) {
				const parteiMatch = /partei=([^&]+)/.exec(url);
				const partei = parteiMatch ? decodeURIComponent(parteiMatch[1]) : '';
				if (partei === 'SPD') return new Response('fehler', { status: 500 });
				return new Response(
					JSON.stringify({
						winners: [
							{
								jahr: 2023,
								gebiet_slug: 'hansaviertel',
								partei,
								farbe_hex: '#000000',
								anteil: 0.4,
								is_repeat_election: false,
								parent_slug: null
							}
						],
						license: 'dl-de/by-2-0',
						source_name: 'Amt für Statistik Berlin-Brandenburg'
					}),
					{ status: 200, headers: { 'content-type': 'application/json' } }
				);
			}
			return new Response('not found', { status: 404 });
		}) as typeof fetch;

		render(SmallMultiplesContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			wahlen: WAHLEN_2023,
			fetchFn: failingFetch
		});

		await expect.element(page.getByTestId('small-multiples')).toBeInTheDocument();
		await expect.element(page.getByTestId('small-multiples-mini-SPD-error')).toBeInTheDocument();
		for (const partei of FINDER_PARTIES.filter((p) => p !== 'SPD')) {
			await expect.element(page.getByTestId(`small-multiples-mini-${partei}`)).toBeInTheDocument();
		}
	});

	it('Review-Fund #12: nennt eine Methodik-Fußnote mit Link auf /methodik/wahldaten', async () => {
		render(SmallMultiplesContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			wahlen: WAHLEN_2023,
			fetchFn: fakeFetch()
		});
		await expect.element(page.getByTestId('small-multiples-methodik-hinweis')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('small-multiples-methodik-hinweis').getByRole('link'))
			.toHaveAttribute('href', '/methodik/wahldaten');
	});

	it('zeigt einen Kapitel-Hinweis statt leerer Minis, wenn DB-los (alle Parteien ohne Daten)', async () => {
		const emptyFetch = (async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('MANIFEST.json')) {
				return new Response(JSON.stringify(MANIFEST), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('bezirke.aaaaaaaa.geojson')) {
				return new Response(JSON.stringify(BEZIRKE_FC), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('lor-bezirksregion.bbbbbbbb.geojson')) {
				return new Response(JSON.stringify(KIEZ_FC), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('/api/wahl/winners')) {
				return new Response(JSON.stringify({ winners: [] }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			return new Response('not found', { status: 404 });
		}) as typeof fetch;

		render(SmallMultiplesContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			wahlen: WAHLEN_2023,
			fetchFn: emptyFetch
		});
		await expect.element(page.getByTestId('small-multiples-empty')).toBeInTheDocument();
	});

	it('Review-Fund #11: Takeaway nennt die Anzahl der GEMATCHTEN Kieze, nicht die Gesamtzahl der Geometrie-Zellen', async () => {
		const kiezFcMitUnmatched = {
			type: 'FeatureCollection',
			features: [
				...KIEZ_FC.features,
				{
					type: 'Feature',
					geometry: polygon(),
					properties: { BZR_ID: '010103', BZR_NAME: 'Tiergarten Süd', BEZ: '01' }
				}
			]
		};
		const fetchFn = (async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('MANIFEST.json')) {
				return new Response(JSON.stringify(MANIFEST), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('bezirke.aaaaaaaa.geojson')) {
				return new Response(JSON.stringify(BEZIRKE_FC), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('lor-bezirksregion.bbbbbbbb.geojson')) {
				return new Response(JSON.stringify(kiezFcMitUnmatched), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			if (url.includes('/api/wahl/winners')) {
				// Nur Hansaviertel + Moabit haben Daten, "Tiergarten Süd" bleibt
				// bei JEDER Partei ungematched.
				return new Response(
					JSON.stringify({
						winners: [
							{
								jahr: 2023,
								gebiet_slug: 'hansaviertel',
								partei: 'SPD',
								farbe_hex: '#000000',
								anteil: 0.4,
								is_repeat_election: false,
								parent_slug: null
							},
							{
								jahr: 2023,
								gebiet_slug: 'moabit',
								partei: 'SPD',
								farbe_hex: '#000000',
								anteil: 0.2,
								is_repeat_election: false,
								parent_slug: null
							}
						],
						license: 'dl-de/by-2-0',
						source_name: 'Amt für Statistik Berlin-Brandenburg'
					}),
					{ status: 200, headers: { 'content-type': 'application/json' } }
				);
			}
			return new Response('not found', { status: 404 });
		}) as typeof fetch;

		render(SmallMultiplesContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await expect.element(page.getByTestId('small-multiples-takeaway')).toHaveTextContent('2');
		await expect
			.element(page.getByTestId('small-multiples-takeaway'))
			.not.toHaveTextContent('3 Berliner');
	});

	it('Review-Fund #14: Tabellen-Spalten für stärksten/schwächsten Anteil heißen nicht identisch "Anteil"', async () => {
		render(SmallMultiplesContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			wahlen: WAHLEN_2023,
			fetchFn: fakeFetch()
		});
		await page.getByTestId('table-toggle').click();
		const table = page.getByTestId('data-table');
		await expect.element(table.getByText('Anteil (stärkster)')).toBeInTheDocument();
		await expect.element(table.getByText('Anteil (schwächster)')).toBeInTheDocument();
	});
});
