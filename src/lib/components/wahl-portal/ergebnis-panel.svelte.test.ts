import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import ErgebnisPanelContextProbe from './internal/ergebnis-panel-context-probe.svelte';
import type { WahlPortalListEntry } from '$lib/state/wahl-portal-context.svelte.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const WAHLEN_2023: WahlPortalListEntry[] = [
	{
		slug: '2023-agh-zweitstimme',
		jahr: 2023,
		typ: 'agh',
		isRepeatElection: true,
		sourceName: 'Amt für Statistik Berlin-Brandenburg',
		license: 'dl-de/by-2-0',
		vorlaeufig: false,
		sourceUpdatedAt: null
	},
	{
		slug: '2021-agh-zweitstimme',
		jahr: 2021,
		typ: 'agh',
		isRepeatElection: false,
		sourceName: 'Amt für Statistik Berlin-Brandenburg',
		license: 'dl-de/by-2-0',
		vorlaeufig: false,
		sourceUpdatedAt: null
	}
];

const SERIES_BERLIN = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'berlin',
	gebiet: 'berlin',
	coverage_ab: 2021,
	points: [
		{
			jahr: 2021,
			partei: 'CDU',
			farbe_hex: '#1A1A1A',
			anteil: 0.18,
			stimmen: 95,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2021,
			partei: 'SPD',
			farbe_hex: '#A50C1A',
			anteil: 0.213,
			stimmen: 110,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2023,
			partei: 'CDU',
			farbe_hex: '#1A1A1A',
			anteil: 0.282,
			stimmen: 160,
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme'
		},
		{
			jahr: 2023,
			partei: 'SPD',
			farbe_hex: '#A50C1A',
			anteil: 0.184,
			stimmen: 105,
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme'
		}
	],
	license: 'dl-de/by-2-0',
	source_url: 'https://example.invalid/agh23',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

const SERIES_GEBIET = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'kiez',
	gebiet: 'mitte-zentrum',
	coverage_ab: 2021,
	points: [
		{
			jahr: 2021,
			partei: 'CDU',
			farbe_hex: '#1A1A1A',
			anteil: 0.25,
			stimmen: 30,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2023,
			partei: 'CDU',
			farbe_hex: '#1A1A1A',
			anteil: 0.31,
			stimmen: 40,
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme'
		}
	],
	license: 'dl-de/by-2-0',
	source_url: 'https://example.invalid/agh23',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

function fakeFetch(
	routes: ReadonlyArray<[string, unknown]>,
	onRequest?: (url: string) => void
): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();
		onRequest?.(url);
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

describe('ergebnis-panel.svelte', () => {
	it('rendert Kopf (Wahl-Bezeichnung, Endgültiges Ergebnis, Datenstand/Quelle) und den leeren Beteiligungs-Slot', async () => {
		const fetchFn = fakeFetch([['/api/wahl/series', SERIES_BERLIN]]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});

		await expect.element(page.getByTestId('ergebnis-panel')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('ergebnis-panel-kopf'))
			.toHaveTextContent('Abgeordnetenhaus 2023');
		await expect
			.element(page.getByTestId('ergebnis-panel-kopf'))
			.toHaveTextContent('Endgültiges Ergebnis');
		await expect
			.element(page.getByTestId('ergebnis-panel-datenstand'))
			.toHaveTextContent('Amt für Statistik Berlin-Brandenburg');
		await expect.element(page.getByTestId('ergebnis-panel-beteiligung-slot')).toBeInTheDocument();
		await expect.element(page.getByTestId('ergebnis-panel-beteiligung-slot')).toBeEmptyDOMElement();
	});

	// Review-Fund (i18n Block B): "Sonstige" ist eine Anzeige-, keine
	// Daten-Schluessel-Uebersetzung -- data-testid bleibt "Sonstige".
	it('zeigt "Sonstige" unter en als "Other" an, data-testid bleibt "Sonstige"', async () => {
		overwriteGetLocale(() => 'en');
		const seriesMitSonstige = {
			...SERIES_BERLIN,
			points: [
				...SERIES_BERLIN.points,
				{ ...SERIES_BERLIN.points[2], partei: 'Sonstige' } // points[2] = erster jahr:2023-Punkt
			]
		};
		const fetchFn = fakeFetch([['/api/wahl/series', seriesMitSonstige]]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		const row = page.getByTestId('ergebnis-panel-row-Sonstige');
		await expect.element(row).toBeInTheDocument();
		await expect.element(row).toHaveTextContent('Other');
		await expect.element(row).not.toHaveTextContent('Sonstige');
	});

	it('zeigt Vorläufig-Badge statt „Endgültiges Ergebnis" für ein vorläufiges Jahr (Story: Ingest AGH/BVV 2026)', async () => {
		const wahlen2026: WahlPortalListEntry[] = [
			{
				slug: '2026-agh-zweitstimme',
				jahr: 2026,
				typ: 'agh',
				isRepeatElection: false,
				sourceName: 'Landeswahlleiterin Berlin',
				license: 'dl-de/by-2.0',
				vorlaeufig: true,
				sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
			},
			...WAHLEN_2023
		];
		const seriesMitVorlaeufig = {
			...SERIES_BERLIN,
			points: [
				...SERIES_BERLIN.points,
				{
					jahr: 2026,
					partei: 'Die Linke',
					farbe_hex: '#BE3075',
					anteil: 0.257,
					stimmen: 468060,
					is_repeat_election: false,
					parent_slug: null,
					vorlaeufig: true,
					source_updated_at: '2026-09-21T01:55:55.000Z'
				}
			]
		};
		const fetchFn = fakeFetch([['/api/wahl/series', seriesMitVorlaeufig]]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2026,
			wahlen: wahlen2026,
			fetchFn
		});

		await expect
			.element(page.getByTestId('ergebnis-panel-vorlaeufig'))
			.toHaveTextContent('Vorläufig');
		await expect
			.element(page.getByTestId('ergebnis-panel-vorlaeufig'))
			.toHaveTextContent('21.09.2026');
		await expect
			.element(page.getByTestId('ergebnis-panel-kopf'))
			.not.toHaveTextContent('Endgültiges Ergebnis');
	});

	it('zeigt weiter „Endgültiges Ergebnis" für ein nicht-vorläufiges Jahr derselben Reihe', async () => {
		const seriesMitVorlaeufig = {
			...SERIES_BERLIN,
			points: [
				...SERIES_BERLIN.points,
				{
					jahr: 2026,
					partei: 'Die Linke',
					farbe_hex: '#BE3075',
					anteil: 0.257,
					stimmen: 468060,
					is_repeat_election: false,
					parent_slug: null,
					vorlaeufig: true,
					source_updated_at: '2026-09-21T01:55:55.000Z'
				}
			]
		};
		const fetchFn = fakeFetch([['/api/wahl/series', seriesMitVorlaeufig]]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});

		await expect
			.element(page.getByTestId('ergebnis-panel-kopf'))
			.toHaveTextContent('Endgültiges Ergebnis');
		await expect.element(page.getByTestId('ergebnis-panel-vorlaeufig')).not.toBeInTheDocument();
	});

	it('zeigt Vorläufig-Badge im Kopf schon während die Series noch lädt (Review-Fund: Lade-/Fehlerzustand)', async () => {
		const wahlen2026: WahlPortalListEntry[] = [
			{
				slug: '2026-agh-zweitstimme',
				jahr: 2026,
				typ: 'agh',
				isRepeatElection: false,
				sourceName: 'Landeswahlleiterin Berlin',
				license: 'dl-de/by-2.0',
				vorlaeufig: true,
				sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
			}
		];
		// Fetch, der nie auflöst -> berlinStatus bleibt dauerhaft 'loading'.
		const neverResolves: typeof fetch = () => new Promise(() => {});
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2026,
			wahlen: wahlen2026,
			fetchFn: neverResolves
		});

		await expect.element(page.getByTestId('ergebnis-panel-loading')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('ergebnis-panel-vorlaeufig'))
			.toHaveTextContent('Vorläufig');
		await expect
			.element(page.getByTestId('ergebnis-panel-kopf'))
			.not.toHaveTextContent('Endgültiges Ergebnis');
	});

	it('zeigt Vorläufig-Badge im Kopf auch bei Series-Fehlerzustand (Review-Fund: Lade-/Fehlerzustand)', async () => {
		const wahlen2026: WahlPortalListEntry[] = [
			{
				slug: '2026-agh-zweitstimme',
				jahr: 2026,
				typ: 'agh',
				isRepeatElection: false,
				sourceName: 'Landeswahlleiterin Berlin',
				license: 'dl-de/by-2.0',
				vorlaeufig: true,
				sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
			}
		];
		const failingFetch: typeof fetch = (async () =>
			new Response('boom', { status: 500 })) as typeof fetch;
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2026,
			wahlen: wahlen2026,
			fetchFn: failingFetch
		});

		await expect.element(page.getByTestId('ergebnis-panel-error')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('ergebnis-panel-vorlaeufig'))
			.toHaveTextContent('Vorläufig');
	});

	it('zeigt weder „Vorläufig" noch „Endgültiges Ergebnis" solange die Portal-Wahl-Liste selbst keinen Treffer hat (Status unbekannt)', async () => {
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2026,
			wahlen: [],
			fetchFn: fakeFetch([['/api/wahl/series', SERIES_BERLIN]])
		});

		await expect.element(page.getByTestId('ergebnis-panel-vorlaeufig')).not.toBeInTheDocument();
		await expect
			.element(page.getByTestId('ergebnis-panel-kopf'))
			.not.toHaveTextContent('Endgültiges Ergebnis');
	});

	it('rendert Rows mit Rang, Anteil und Delta-Badge (2023 vs. 2021)', async () => {
		const fetchFn = fakeFetch([['/api/wahl/series', SERIES_BERLIN]]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});

		await expect.element(page.getByTestId('ergebnis-panel-liste')).toBeInTheDocument();
		await expect.element(page.getByTestId('ergebnis-panel-anteil-CDU')).toHaveTextContent('28,2 %');
		await expect
			.element(page.getByTestId('ergebnis-panel-delta-CDU'))
			.toHaveTextContent('+10,2 Pp.');
		await expect
			.element(page.getByTestId('ergebnis-panel-delta-SPD'))
			.toHaveTextContent('−2,9 Pp.');
		await expect
			.element(page.getByTestId('ergebnis-panel-vorjahr-label'))
			.toHaveTextContent('vs. 2021');
	});

	it('erste Wahl der Reihe: Anteile ohne Delta-Badges', async () => {
		const fetchFn = fakeFetch([['/api/wahl/series', SERIES_BERLIN]]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2021,
			wahlen: WAHLEN_2023,
			fetchFn
		});

		await expect.element(page.getByTestId('ergebnis-panel-anteil-CDU')).toBeInTheDocument();
		await expect.element(page.getByTestId('ergebnis-panel-delta-CDU')).not.toBeInTheDocument();
	});

	it('Jahr-Wechsel liest aus dem geladenen Response, kein neuer Series-Request', async () => {
		let requestCount = 0;
		const fetchFn = fakeFetch([['/api/wahl/series', SERIES_BERLIN]], () => requestCount++);
		const { rerender } = render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await expect
			.element(page.getByTestId('ergebnis-panel-delta-CDU'))
			.toHaveTextContent('+10,2 Pp.');
		expect(requestCount).toBe(1);

		await rerender({
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2021,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await expect.element(page.getByTestId('ergebnis-panel-anteil-CDU')).toHaveTextContent('18,0 %');
		expect(requestCount).toBe(1);
	});

	it('Disclosure öffnet per Klick und verlinkt Methodik/Lizenzen', async () => {
		const fetchFn = fakeFetch([['/api/wahl/series', SERIES_BERLIN]]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await page.getByTestId('ergebnis-panel-disclosure-trigger').click();
		await expect.element(page.getByTestId('ergebnis-panel-disclosure-content')).toBeInTheDocument();
		await expect.element(page.getByTestId('ergebnis-panel-methodik-link')).toBeInTheDocument();
		await expect.element(page.getByTestId('ergebnis-panel-lizenzen-link')).toBeInTheDocument();
	});

	it('Kiez-Ebene mit hervorgehobenem Gebiet: zweiter Block mit Gebiets-Werten, Berlin-Block bleibt', async () => {
		const fetchFn = fakeFetch([
			['/api/wahl/series?typ=agh&stimmtyp=zweitstimme&ebene=berlin', SERIES_BERLIN],
			['gebiet=mitte-zentrum', SERIES_GEBIET]
		]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn,
			highlightedSlug: 'mitte-zentrum',
			highlightedName: 'Zentrum',
			anzeigeEbene: 'kiez'
		});

		await expect.element(page.getByTestId('ergebnis-panel-liste')).toBeInTheDocument();
		await expect.element(page.getByTestId('ergebnis-panel-gebiet-block')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('ergebnis-panel-gebiet-block'))
			.toHaveTextContent('Zentrum');
		await expect
			.element(page.getByTestId('ergebnis-panel-gebiet-anteil-CDU'))
			.toHaveTextContent('31,0 %');
		await expect
			.element(page.getByTestId('ergebnis-panel-gebiet-delta-CDU'))
			.toHaveTextContent('+6,0 Pp.');
		await expect
			.element(page.getByTestId('ergebnis-panel-gebiet-vorjahr-label'))
			.toHaveTextContent('vs. 2021');
	});

	it('Gebiet ohne Daten: Gebiets-Block zeigt einen Hinweis statt leerer Liste', async () => {
		const fetchFn = fakeFetch([
			['/api/wahl/series?typ=agh&stimmtyp=zweitstimme&ebene=berlin', SERIES_BERLIN],
			['gebiet=nirgendwo', { ...SERIES_GEBIET, points: [] }]
		]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn,
			highlightedSlug: 'nirgendwo',
			highlightedName: 'Nirgendwo',
			anzeigeEbene: 'kiez'
		});

		await expect.element(page.getByTestId('ergebnis-panel-gebiet-empty')).toBeInTheDocument();
	});

	it('Stimmbezirks-Ebene: Berlin-Block plus Detailseiten-Satz, kein Gebiets-Block', async () => {
		const fetchFn = fakeFetch([['/api/wahl/series', SERIES_BERLIN]]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'stimmbezirk',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn,
			highlightedSlug: '01W100',
			highlightedName: 'Stimmbezirk 01W100',
			anzeigeEbene: 'stimmbezirk'
		});

		await expect.element(page.getByTestId('ergebnis-panel-liste')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('ergebnis-panel-stimmbezirk-hinweis'))
			.toBeInTheDocument();
		await expect.element(page.getByTestId('ergebnis-panel-gebiet-block')).not.toBeInTheDocument();
	});

	it('zeigt einen Lade-Hinweis vor der ersten Antwort und einen Fehler-Hinweis bei 500', async () => {
		const fetchFn = (async () => new Response('boom', { status: 500 })) as typeof fetch;
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await expect.element(page.getByTestId('ergebnis-panel-error')).toBeInTheDocument();
	});

	it('DB-los: leerer Zustand ohne Crash, wenn die Series-API leere Punkte liefert', async () => {
		const fetchFn = fakeFetch([['/api/wahl/series', { ...SERIES_BERLIN, points: [] }]]);
		render(ErgebnisPanelContextProbe, {
			reihe: 'agh',
			ebene: 'kiez',
			jahr: 2023,
			wahlen: WAHLEN_2023,
			fetchFn
		});
		await expect.element(page.getByTestId('ergebnis-panel-empty')).toBeInTheDocument();
	});
});
