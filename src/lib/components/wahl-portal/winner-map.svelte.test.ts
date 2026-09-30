import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WinnerMapContextProbe from './internal/winner-map-context-probe.svelte';
import { _resetManifestCache } from '$lib/data/manifest.js';
import { _resetLayerCache } from '$lib/data/internal/layer-fetch.js';
import { _resetWinnersCache } from './internal/winner-map-winners.svelte.js';
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
		layerMeta({ slug: 'bezirke', filename: 'bezirke.aaaaaaaa.geojson', featureCount: 2 }),
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
		},
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { Gemeinde_name: 'Pankow', Schluessel_gesamt: '11000003' }
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
			properties: { BZR_ID: '030101', BZR_NAME: 'Prenzlauer Berg Nord', BEZ: '03' }
		}
	]
};

const WINNERS_LOADED = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'kiez',
	winners: [
		{
			jahr: 2023,
			gebiet_slug: 'hansaviertel',
			partei: 'SPD',
			farbe_hex: '#000000',
			anteil: 0.4,
			is_repeat_election: false,
			parent_slug: null
		}
	],
	license: 'dl-de/by-2-0',
	source_url: 'https://example.invalid',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

const WAHLEN_2023: WahlPortalListEntry[] = [
	{
		slug: '2023-agh-zweitstimme',
		jahr: 2023,
		typ: 'agh',
		isRepeatElection: false,
		sourceName: 'Amt für Statistik Berlin-Brandenburg',
		license: 'dl-de/by-2-0',
		vorlaeufig: false,
		sourceUpdatedAt: null
	}
];

// Story 17: Gruppen-Fixture (dissolvierte Gruppen-Fläche) im AGH-Format
// (BEZ+B+BWB3, gruppeIdFromGeo('agh23') -> `${BEZ}B${BWB3}`). agh23 mappt
// per geoSlugForWahl auf die ah21-Geometrie (Wiederholungswahl-Bestand).
const STIMMBEZIRK_FC = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { BEZ: '01', BWB3: '1A', MEMBERS: '100,101' }
		},
		{
			type: 'Feature',
			geometry: polygon(),
			properties: { BEZ: '01', BWB3: '2B', MEMBERS: '200' }
		}
	]
};

const WINNERS_STIMMBEZIRK_2023 = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'stimmbezirk',
	jahr: 2023,
	geo_slug: 'ah21',
	winners: [
		{
			jahr: 2023,
			gebiet_slug: '01B1A',
			partei: 'SPD',
			farbe_hex: '#000000',
			anteil: 0.4,
			is_repeat_election: false,
			parent_slug: null
		}
	],
	license: 'dl-de/by-2-0',
	source_url: 'https://example.invalid',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

const MANIFEST_WITH_STIMMBEZIRK = {
	...MANIFEST,
	layers: [
		...MANIFEST.layers,
		layerMeta({
			slug: 'wahlgruppen-ah21',
			filename: 'wahlgruppen-ah21.cccccccc.geojson',
			featureCount: 2
		})
	]
};

// bvv11 hat keine Stimmbezirks-Geometrie (WAHL_TO_GEO-Lücke, docs/wahldaten-methodik.md).
const WAHLEN_BVV_2011: WahlPortalListEntry[] = [
	{
		slug: '2011-bvv',
		jahr: 2011,
		typ: 'bvv',
		isRepeatElection: false,
		sourceName: 'Amt für Statistik Berlin-Brandenburg',
		license: 'dl-de/by-2-0',
		vorlaeufig: false,
		sourceUpdatedAt: null
	}
];

const WINNERS_BEZIRK_2011 = {
	typ: 'bvv',
	stimmtyp: 'einstimme',
	ebene: 'bezirk',
	winners: [
		{
			jahr: 2011,
			gebiet_slug: 'mitte',
			partei: 'CDU',
			farbe_hex: '#000000',
			anteil: 0.3,
			is_repeat_election: false,
			parent_slug: null
		}
	],
	license: 'dl-de/by-2-0',
	source_url: 'https://example.invalid',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

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
	_resetManifestCache();
	_resetLayerCache();
	_resetWinnersCache();
});

afterEach(() => {
	_resetManifestCache();
	_resetLayerCache();
	_resetWinnersCache();
});

describe('winner-map.svelte', () => {
	it('zeigt einen Lade-Hinweis bevor die Winners-Antwort da ist', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', WINNERS_LOADED]]);
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await expect.element(page.getByTestId('winner-map-loading')).toBeInTheDocument();
	});

	it('zeigt den Leerzustand ohne Karten-Init, wenn die API leer ist (DB-los)', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', { ...WINNERS_LOADED, winners: [] }]]);
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await expect.element(page.getByTestId('winner-map-empty')).toBeInTheDocument();
		await expect.element(page.getByTestId('winner-map-canvas')).not.toBeInTheDocument();
	});

	it('zeigt eine Fehlermeldung, wenn die Winners-API fehlschlägt', async () => {
		const fetchFn = (async () => new Response('boom', { status: 500 })) as typeof fetch;
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await expect.element(page.getByTestId('winner-map-error')).toBeInTheDocument();
	});

	it('rendert Karten-Container, Legende, Takeaway und Tabellen-Alternative mit Rows bei geladenen Daten', async () => {
		const fetchFn = fakeFetch([
			['/api/wahl/winners', WINNERS_LOADED],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});

		const canvas = page.getByTestId('winner-map-canvas');
		await expect.element(canvas).toBeInTheDocument();
		const canvasEl = (await canvas.element()) as HTMLElement;
		expect(canvasEl.getAttribute('role')).toBe('img');
		expect(canvasEl.getAttribute('aria-label')).toBeTruthy();

		await expect.element(page.getByTestId('winner-map-takeaway')).toHaveTextContent(/SPD/);

		const toggle = page.getByTestId('table-toggle');
		await expect.element(toggle).toBeInTheDocument();
		await toggle.click();
		await expect.element(page.getByTestId('data-table')).toBeInTheDocument();
		await expect.element(page.getByTestId('data-table')).toHaveTextContent('Hansaviertel');
		await expect.element(page.getByTestId('data-table')).toHaveTextContent('SPD');

		await expect.element(page.getByTestId('winner-map-legende')).toBeInTheDocument();

		await expect
			.element(page.getByTestId('winner-map-aggregation-hinweis'))
			.toHaveTextContent('143 Berliner Kieze aggregiert');
		await expect
			.element(page.getByTestId('winner-map-aggregation-hinweis'))
			.toHaveTextContent('Methodik Wahldaten');
	});

	it('Adress-Auswahl: Punkt im Gebiet hebt hervor und benennt es, Punkt außerhalb gibt Hinweis', async () => {
		const fetchFn = fakeFetch([
			['/api/wahl/winners', WINNERS_LOADED],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		// Treffer 1 liegt im Hansaviertel-Fixture-Polygon, Treffer 2 außerhalb Berlins.
		const geocodeFn = async (q: string) => [
			q.includes('drau')
				? {
						id: '2',
						displayName: 'Draußen 1, Potsdam',
						lat: 52.39,
						lng: 13.06,
						type: 'house',
						addresstype: 'house'
					}
				: {
						id: '1',
						displayName: 'Hansaviertel 1, Berlin',
						lat: 52.505,
						lng: 13.305,
						type: 'house',
						addresstype: 'house'
					}
		];
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn,
			geocodeFn
		});
		await expect.element(page.getByTestId('winner-map-canvas')).toBeInTheDocument();

		// bits-ui-Combobox-Items sind im Haus-Testmuster nicht klickbar (Portal);
		// Auswahl per Tastatur wie ein echter Nutzer.
		const input = page.getByRole('combobox');
		await input.click();
		await input.fill('Hansaviertel');
		await new Promise((r) => setTimeout(r, 400));
		await userEvent.keyboard('{ArrowDown}{Enter}');
		await expect
			.element(page.getByTestId('winner-map-address-hint'))
			.toHaveTextContent('Hansaviertel hervorgehoben.');
		// Highlight-Outcome beobachtbar (Review: Hint-Text allein beweist das
		// Karten-Highlight nicht): Controller-Slug am Container-Attribut.
		await expect
			.element(page.getByTestId('winner-map-canvas'))
			.toHaveAttribute('data-highlighted-slug', 'hansaviertel');
	});

	it('Adress-Auswahl auf Kiez-Ebene verdrahtet das Ergebnis-Panel: Gebiets-Block mit Series-Daten', async () => {
		// Review-Fund (Verification Gap): Adresse -> gebietSlug -> Panel-Gebiets-Block
		// war nur isoliert getestet, nie durch den echten Komponenten-Baum.
		const seriesBerlin = {
			typ: 'agh',
			stimmtyp: 'zweitstimme',
			ebene: 'berlin',
			gebiet: 'berlin',
			coverage_ab: 2021,
			points: [
				{
					jahr: 2023,
					partei: 'SPD',
					farbe_hex: '#000000',
					anteil: 0.184,
					stimmen: 100,
					is_repeat_election: false,
					parent_slug: null
				}
			],
			license: 'dl-de/by-2-0',
			source_url: 'https://example.invalid',
			source_name: 'Amt für Statistik Berlin-Brandenburg'
		};
		const seriesGebiet = {
			...seriesBerlin,
			ebene: 'kiez',
			gebiet: 'hansaviertel',
			points: [
				{
					jahr: 2023,
					partei: 'SPD',
					farbe_hex: '#000000',
					anteil: 0.42,
					stimmen: 40,
					is_repeat_election: false,
					parent_slug: null
				}
			]
		};
		const fetchFn = fakeFetch([
			['/api/wahl/winners', WINNERS_LOADED],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC],
			['gebiet=hansaviertel', seriesGebiet],
			['ebene=berlin', seriesBerlin]
		]);
		const geocodeFn = async () => [
			{
				id: '1',
				displayName: 'Hansaviertel 1, Berlin',
				lat: 52.505,
				lng: 13.305,
				type: 'house',
				addresstype: 'house'
			}
		];
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn,
			geocodeFn
		});
		await expect.element(page.getByTestId('winner-map-canvas')).toBeInTheDocument();
		await expect.element(page.getByTestId('ergebnis-panel-gebiet-block')).not.toBeInTheDocument();

		// Debounce-Race-Stabilisierung wie im Kein-Gebiet-Test: bis zu 3 Versuche.
		const input = page.getByRole('combobox');
		for (let versuch = 0; versuch < 3; versuch++) {
			await input.click();
			await input.fill('');
			await input.fill('Hansaviertel');
			await new Promise((r) => setTimeout(r, 600));
			await userEvent.keyboard('{ArrowDown}{Enter}');
			const hint = document.querySelector('[data-testid="winner-map-address-hint"]');
			if (hint?.textContent?.includes('hervorgehoben')) break;
		}
		await expect
			.element(page.getByTestId('winner-map-address-hint'))
			.toHaveTextContent('Hansaviertel hervorgehoben.');

		await expect.element(page.getByTestId('ergebnis-panel-gebiet-block')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('ergebnis-panel-gebiet-block'))
			.toHaveTextContent('Hansaviertel');
		await expect
			.element(page.getByTestId('ergebnis-panel-gebiet-anteil-SPD'))
			.toHaveTextContent('42,0 %');
	});

	it('Adress-Auswahl außerhalb Berlins zeigt den Kein-Gebiet-Hinweis ohne Exception', async () => {
		const fetchFn = fakeFetch([
			['/api/wahl/winners', WINNERS_LOADED],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		const geocodeFn = async () => [
			{
				id: '2',
				displayName: 'Draußen 1, Potsdam',
				lat: 52.39,
				lng: 13.06,
				type: 'house',
				addresstype: 'house'
			}
		];
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn,
			geocodeFn
		});
		await expect.element(page.getByTestId('winner-map-canvas')).toBeInTheDocument();
		// Debounce-Race-Stabilisierung: die Combobox-Liste öffnet zeitabhängig;
		// bis zu 3 Versuche, bevor der Hint asserted wird (bekannter Flake).
		const input = page.getByRole('combobox');
		for (let versuch = 0; versuch < 3; versuch++) {
			await input.click();
			await input.fill('');
			await input.fill('draussen');
			await new Promise((r) => setTimeout(r, 600));
			await userEvent.keyboard('{ArrowDown}{Enter}');
			const hint = document.querySelector('[data-testid="winner-map-address-hint"]');
			if (hint?.textContent?.includes('kein Gebiet')) break;
		}
		await expect
			.element(page.getByTestId('winner-map-address-hint'))
			.toHaveTextContent('kein Gebiet');
	});

	it('trägt bei Wiederholungswahl den Hinweis in die Caption ein', async () => {
		const repeatWinners = {
			...WINNERS_LOADED,
			winners: WINNERS_LOADED.winners.map((w) => ({ ...w, is_repeat_election: true }))
		};
		const fetchFn = fakeFetch([
			['/api/wahl/winners', repeatWinners],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await expect
			.element(page.getByTestId('winner-map-wiederholung'))
			.toHaveTextContent('Wiederholungswahl');
	});

	it('Muster-Toggle auf der gemounteten Karte schaltet die Legenden-Vorschau um', async () => {
		const winnersMitCdu = {
			...WINNERS_LOADED,
			winners: [
				...WINNERS_LOADED.winners,
				{
					jahr: 2023,
					gebiet_slug: 'prenzlauer-berg-nord',
					partei: 'CDU',
					farbe_hex: '#000000',
					anteil: 0.35,
					is_repeat_election: false,
					parent_slug: null
				}
			]
		};
		const fetchFn = fakeFetch([
			['/api/wahl/winners', winnersMitCdu],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC],
			['lor-bezirksregion.bbbbbbbb.geojson', KIEZ_FC]
		]);
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		const swatch = page.getByTestId('winner-map-swatch-CDU');
		await expect.element(swatch).toBeInTheDocument();
		let el = (await swatch.element()) as HTMLElement;
		expect(el.getAttribute('style')).toContain('background-color');
		expect(el.getAttribute('style')).not.toContain('background-image');

		await page.getByTestId('winner-map-muster-toggle').click();
		el = (await page.getByTestId('winner-map-swatch-CDU').element()) as HTMLElement;
		// CDU-Pattern ist 'stripes' -> mit aktivem Toggle Pattern-Vorschau.
		expect(el.getAttribute('style')).toContain('background-image');
	});

	it('rendert die Stimmbezirks-Karte auf der Default-Ebene mit Gruppen-Tabellen-Labels (Story 17)', async () => {
		const fetchFn = fakeFetch([
			['ebene=stimmbezirk', WINNERS_STIMMBEZIRK_2023],
			['MANIFEST.json', MANIFEST_WITH_STIMMBEZIRK],
			['wahlgruppen-ah21', STIMMBEZIRK_FC]
		]);
		render(WinnerMapContextProbe, {
			reihe: 'agh',
			ebene: 'stimmbezirk',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});

		await expect.element(page.getByTestId('winner-map-canvas')).toBeInTheDocument();
		await expect.element(page.getByTestId('winner-map-takeaway')).toHaveTextContent(/SPD/);
		await expect
			.element(page.getByTestId('winner-map-aggregation-hinweis'))
			.toHaveTextContent(/Briefwahl-Gruppen/);
		await expect.element(page.getByTestId('winner-map-fallback-hinweis')).not.toBeInTheDocument();

		await page.getByTestId('table-toggle').click();
		await expect
			.element(page.getByTestId('data-table'))
			.toHaveTextContent('Stimmbezirke 100, 101 und Briefwahl 1A');
	});

	it('zeigt den Fallback-Hinweis und rendert Bezirke, wenn dem Jahr die Stimmbezirks-Geometrie fehlt', async () => {
		const fetchFn = fakeFetch([
			['ebene=bezirk', WINNERS_BEZIRK_2011],
			['MANIFEST.json', MANIFEST],
			['bezirke.aaaaaaaa.geojson', BEZIRKE_FC]
		]);
		render(WinnerMapContextProbe, {
			reihe: 'bvv',
			ebene: 'stimmbezirk',
			jahr: 2011,
			wahlen: WAHLEN_BVV_2011,
			fetchFn
		});

		await expect
			.element(page.getByTestId('winner-map-fallback-hinweis'))
			.toHaveTextContent('2011: keine Stimmbezirks-Daten, Karte zeigt Bezirke.');
		await expect.element(page.getByTestId('winner-map-canvas')).toBeInTheDocument();
		await expect.element(page.getByTestId('winner-map-takeaway')).toHaveTextContent(/CDU/);
	});
});

// Review-Fund (i18n Block B): der Fallback-Hinweis nutzte vorher
// `jahr ?? 0` (zeigte "0:" statt eines Jahres) und `${label}e`-Anhaengen
// fuer den Plural (auf EN nicht uebertragbar, z. B. "Polling districte").
// Beide Baustellen sind jetzt eigene Message-Keys je Ebene mit fest
// eingebautem Plural + einer eigenen jahrlosen Variante -- direkt an den
// Messages geprueft (das Svelte-Ternary selbst ist trivial).
describe('wahl_portal_fallback_hinweis_* Messages (Review-Fund)', () => {
	it('DE: "ohne Jahr"-Varianten zeigen keine Jahreszahl (kein "0:")', async () => {
		const { m } = await import('$lib/paraglide/messages.js');
		expect(m.wahl_portal_fallback_hinweis_bezirk_ohne_jahr(undefined, { locale: 'de' })).toBe(
			'Keine Stimmbezirks-Daten, Karte zeigt Bezirke.'
		);
		expect(m.wahl_portal_fallback_hinweis_kiez_ohne_jahr(undefined, { locale: 'de' })).toBe(
			'Keine Stimmbezirks-Daten, Karte zeigt Kieze.'
		);
	});

	it('EN: "mit Jahr"/"ohne Jahr"-Varianten je Ebene mit korrektem, fest eingebautem Plural', async () => {
		const { m } = await import('$lib/paraglide/messages.js');
		expect(m.wahl_portal_fallback_hinweis_bezirk_mit_jahr({ jahr: 2011 }, { locale: 'en' })).toBe(
			'2011: no polling district data, map shows Bezirke.'
		);
		expect(m.wahl_portal_fallback_hinweis_kiez_ohne_jahr(undefined, { locale: 'en' })).toBe(
			'No polling district data, map shows Kieze.'
		);
	});
});
