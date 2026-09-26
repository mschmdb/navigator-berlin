import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
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
		license: 'dl-de/by-2-0',
		vorlaeufig: false,
		sourceUpdatedAt: null
	}
];

function winnerRow(
	jahr: number,
	gebiet_slug: string,
	partei: string,
	overrides: Record<string, unknown> = {}
) {
	return {
		jahr,
		gebiet_slug,
		partei,
		farbe_hex: '#000000',
		anteil: 0.4,
		is_repeat_election: false,
		parent_slug: null,
		...overrides
	};
}

/** Zwei Bänder (Fixture für Hover-/Dimm-/Tooltip-Tests): 2016 SPD -> 2021
 * GRÜNE (a, b -- Band-Wert 2) und 2016 SPD -> 2021 CDU (c -- Band-Wert 1).
 * DOM-Reihenfolge der Bänder folgt der Einfüge-Reihenfolge in
 * `computeUebergaengeFromRows` (erstes Gebiet zuerst) -- Band 0 = GRÜNE. */
const WINNERS_ZWEI_BAENDER = {
	winners: [
		winnerRow(2016, 'a', 'SPD'),
		winnerRow(2016, 'b', 'SPD'),
		winnerRow(2016, 'c', 'SPD'),
		winnerRow(2021, 'a', 'GRÜNE'),
		winnerRow(2021, 'b', 'GRÜNE'),
		winnerRow(2021, 'c', 'CDU')
	]
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
	_resetWinnersCache();
});

afterEach(() => {
	_resetWinnersCache();
	overwriteGetLocale(() => 'de');
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
		await expect
			.element(page.getByTestId('sankey-wahljahre-footnote-coverage'))
			.toBeInTheDocument();

		// Review Triage Log #4: Farbe allein ist kein Label -- mindestens ein
		// sichtbarer Knoten-Label-Text mit Partei-Namen.
		const nodeLabels = page.getByTestId('sankey-node-label');
		await expect.element(nodeLabels.first()).toBeInTheDocument();
		await expect
			.element(page.getByTestId('sankey-wahljahre-svg'))
			.toHaveAttribute(
				'aria-label',
				'Sankey der Partei-Übergänge, Ebene Kiez, 2016 bis 2023, 1 Gebiete'
			);

		// Story 11 (Sankey-Rework): Erklär-Satz benennt die Sieger-Semantik.
		await expect
			.element(page.getByTestId('sankey-wahljahre-erklaerung'))
			.toHaveTextContent('stärkste Kraft');

		await page.getByTestId('table-toggle').click();
		await expect.element(page.getByTestId('data-table')).toHaveTextContent('SPD');
		await expect.element(page.getByTestId('data-table')).toHaveTextContent('GRÜNE');
	});

	// Review-Fund (i18n Block B): "Sonstige" ist eine Anzeige-, keine
	// Daten-Schluessel-Uebersetzung -- `data-partei` bleibt "Sonstige".
	it('zeigt "Sonstige" im Knoten-Label + Node-Aria-Label unter en als "Other" an', async () => {
		overwriteGetLocale(() => 'en');
		try {
			const winners = {
				winners: [
					winnerRow(2016, 'a', 'SPD'),
					winnerRow(2021, 'a', 'Sonstige')
				],
				license: 'dl-de/by-2.0',
				source_name: 'Amt für Statistik Berlin-Brandenburg'
			};
			const fetchFn = fakeFetch([['/api/wahl/winners', winners]]);
			render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });

			await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();
			const nodeLabels = page.getByTestId('sankey-node-label');
			await expect.element(nodeLabels.nth(1)).toHaveTextContent('Other');
			const sonstigeNode = page.getByTestId('sankey-node').nth(1);
			await expect.element(sonstigeNode).toHaveAttribute('data-partei', 'Sonstige');
			const nodeEl = (await sonstigeNode.element()) as SVGRectElement;
			expect(nodeEl.getAttribute('aria-label')).toContain('Other');
			expect(nodeEl.getAttribute('aria-label')).not.toContain('Sonstige');
		} finally {
			overwriteGetLocale(() => 'de');
		}
	});

	it('Hover auf einem Partei-Band zeigt den Tooltip und hebt das Band hervor', async () => {
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

		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();
		// `.hover()` verlangt eine von Playwright als sichtbar/stabil erkannte
		// Bounding-Box; im isolierten Komponenten-Test ohne volles Layout ist
		// das für SVG-Pfade unzuverlässig -- ein direktes `pointermove`-Event
		// prüft denselben Handler ohne die Actionability-Heuristik (der echte
		// Hover-Smoke läuft zusätzlich als E2E-Test im echten Browser-Layout).
		const band = (await page.getByTestId('sankey-band').element()) as SVGPathElement;
		band.dispatchEvent(
			new PointerEvent('pointermove', { bubbles: true, clientX: 10, clientY: 10 })
		);
		await expect.element(page.getByTestId('sankey-tooltip')).toBeInTheDocument();
		await expect.element(page.getByTestId('sankey-tooltip-title')).toHaveTextContent('SPD → GRÜNE');
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

		await expect
			.element(page.getByTestId('sankey-wahljahre-footnote-coverage'))
			.toBeInTheDocument();
		await page.getByTestId('sankey-ebene-bezirk').click();
		await expect
			.element(page.getByTestId('sankey-wahljahre-footnote-coverage'))
			.not.toBeInTheDocument();
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
		await expect
			.element(page.getByTestId('sankey-ebene-bezirk'))
			.toHaveAttribute('aria-checked', 'true');
		expect(winnersRequestCount).toBe(2);

		// Rückwechsel zu kiez: gecacht, kein dritter Request.
		await page.getByTestId('sankey-ebene-kiez').click();
		expect(winnersRequestCount).toBe(2);
	});

	it('Fehlerpfad Lazy-Load: rejectende d3-sankey-Factory zeigt den Fehler-Zustand (Review Triage Log #2)', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', WINNERS_ZWEI_BAENDER]]);
		const sankeyFactory = async () => {
			throw new Error('Chunk-404');
		};
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn, sankeyFactory });
		await expect.element(page.getByTestId('sankey-wahljahre-error')).toBeInTheDocument();
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).not.toBeInTheDocument();
	});

	it('Zwei-Bänder-Fixture: Hover dimmt das andere Band (stroke-opacity dreistufig), pointerleave stellt zurück', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', WINNERS_ZWEI_BAENDER]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();

		const bands = page.getByTestId('sankey-band');
		const bandA = (await bands.first().element()) as SVGPathElement;
		const bandB = (await bands.nth(1).element()) as SVGPathElement;

		// Band A trägt den Wert 2 (Gebiete a+b) -- Bandbreite > 1px.
		expect(Number(bandA.getAttribute('stroke-width'))).toBeGreaterThan(1);

		bandA.dispatchEvent(
			new PointerEvent('pointermove', { bubbles: true, clientX: 10, clientY: 10 })
		);
		await expect.element(bands.first()).toHaveAttribute('stroke-opacity', '0.85');
		await expect.element(bands.nth(1)).toHaveAttribute('stroke-opacity', '0.15');
		await expect.element(page.getByTestId('sankey-tooltip')).toBeInTheDocument();

		bandA.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
		await expect.element(page.getByTestId('sankey-tooltip')).not.toBeInTheDocument();
		await expect.element(bands.first()).toHaveAttribute('stroke-opacity', '0.5');
		await expect.element(bands.nth(1)).toHaveAttribute('stroke-opacity', '0.5');
		void bandB;
	});

	it('Escape schließt den Tooltip ohne Fokus-Verlust (WCAG 1.4.13)', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', WINNERS_ZWEI_BAENDER]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();

		const band = (await page.getByTestId('sankey-band').first().element()) as SVGPathElement;
		band.dispatchEvent(
			new PointerEvent('pointermove', { bubbles: true, clientX: 10, clientY: 10 })
		);
		await expect.element(page.getByTestId('sankey-tooltip')).toBeInTheDocument();

		band.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await expect.element(page.getByTestId('sankey-tooltip')).not.toBeInTheDocument();
	});

	it('Fokus auf einem Band zeigt den Tooltip, blur schließt ihn', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', WINNERS_ZWEI_BAENDER]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();

		const band = (await page.getByTestId('sankey-band').first().element()) as SVGPathElement;
		band.focus();
		await expect.element(page.getByTestId('sankey-tooltip')).toBeInTheDocument();
		await expect.element(page.getByTestId('sankey-tooltip-title')).toHaveTextContent('SPD → GRÜNE');

		band.blur();
		await expect.element(page.getByTestId('sankey-tooltip')).not.toBeInTheDocument();
	});

	it('Knoten-Tooltip nennt „stärkste Kraft in N von M Gebieten"', async () => {
		const winners = {
			winners: [
				winnerRow(2016, 'a', 'SPD'),
				winnerRow(2016, 'b', 'CDU'),
				winnerRow(2021, 'a', 'SPD'),
				winnerRow(2021, 'b', 'CDU')
			]
		};
		const fetchFn = fakeFetch([['/api/wahl/winners', winners]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();

		const node = (await page.getByTestId('sankey-node').first().element()) as SVGRectElement;
		node.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 5, clientY: 5 }));
		await expect
			.element(page.getByTestId('sankey-tooltip-detail'))
			.toHaveTextContent('stärkste Kraft in 1 von 2 Gebieten');
	});

	it('Rollen: Band trägt role="img" (keine Aktions-Semantik), äußeres svg role="group"', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', WINNERS_ZWEI_BAENDER]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toHaveAttribute('role', 'group');
		await expect.element(page.getByTestId('sankey-band').first()).toHaveAttribute('role', 'img');
		await expect.element(page.getByTestId('sankey-node').first()).toHaveAttribute('role', 'img');
	});

	it('Erste Spalte: Label links vom Knoten verankert; übrige Spalten rechts (Review Triage Log #4)', async () => {
		const fetchFn = fakeFetch([['/api/wahl/winners', WINNERS_ZWEI_BAENDER]]);
		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();

		const labels = page.getByTestId('sankey-node-label');
		await expect.element(labels.first()).toHaveAttribute('text-anchor', 'end');
		await expect.element(labels.nth(1)).toHaveAttribute('text-anchor', 'start');
	});

	it('Interaktions-Reset bei Graph-Wechsel: Ebenen-Wechsel löscht Hover/Tooltip der alten Ebene (Review Triage Log #6)', async () => {
		const winnersBezirk = {
			winners: [
				winnerRow(2016, 'bezirk-a', 'SPD'),
				winnerRow(2016, 'bezirk-b', 'CDU'),
				winnerRow(2021, 'bezirk-a', 'GRÜNE'),
				winnerRow(2021, 'bezirk-b', 'CDU')
			]
		};
		const fetchFn = (async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('/api/wahl/winners')) {
				const ebene = new URL(url, 'http://localhost').searchParams.get('ebene');
				const body = ebene === 'bezirk' ? winnersBezirk : WINNERS_ZWEI_BAENDER;
				return new Response(JSON.stringify(body), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			return new Response('not found', { status: 404 });
		}) as typeof fetch;

		render(SankeyWahljahreContextProbe, { reihe: 'agh', wahlen: WAHLEN, fetchFn });
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();

		const band = (await page.getByTestId('sankey-band').first().element()) as SVGPathElement;
		band.dispatchEvent(
			new PointerEvent('pointermove', { bubbles: true, clientX: 10, clientY: 10 })
		);
		await expect.element(page.getByTestId('sankey-tooltip')).toBeInTheDocument();

		await page.getByTestId('sankey-ebene-bezirk').click();
		await expect.element(page.getByTestId('sankey-wahljahre-svg')).toBeInTheDocument();

		await expect.element(page.getByTestId('sankey-tooltip')).not.toBeInTheDocument();
		const bandsAfter = page.getByTestId('sankey-band');
		await expect.element(bandsAfter.first()).toHaveAttribute('stroke-opacity', '0.5');
	});
});
