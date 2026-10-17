import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { readDatasetJsonLd } from '$lib/seo/dataset-jsonld-test-utils.js';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import WahlDetailPage from './+page.svelte';
import type { WahlDetailPageData } from './+page.server.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

function makeData(overrides: Partial<WahlDetailPageData['wahl']> = {}): WahlDetailPageData {
	return {
		slug: '2026-bvv',
		wahl: {
			id: 23,
			jahr: 2026,
			typ: 'bvv',
			stimmtyp: 'einstimme',
			isRepeatElection: false,
			parentSlug: null,
			sourceUrl: 'https://www.wahlen-berlin.de/wahlen/BE2026/x.csv',
			sourceName: 'Landeswahlleiterin Berlin',
			license: 'dl-de/by-2.0',
			vorlaeufig: false,
			sourceUpdatedAt: null,
			...overrides
		},
		berlin: [],
		bezirke: [],
		geoSlug: null,
		winnersByUwb: []
	};
}

describe('berlin-wahlen/[slug]/+page.svelte: Parteinamen in Kurzform (GH-92)', () => {
	it('zeigt die Kurzform, die Langform steht nur im title', async () => {
		const data = {
			...makeData(),
			berlin: [
				{
					kurzname: 'CDU',
					vollname: 'Christlich Demokratische Union Deutschlands',
					farbeHex: '#000000',
					stimmen: 100,
					anteil: 0.3
				}
			]
		};
		render(WahlDetailPage, { data });
		const table = (await page.getByTestId('wahl-detail-berlin-table').element()) as HTMLElement;
		expect(table.textContent).toContain('CDU');
		expect(table.textContent).not.toContain('Christlich Demokratische Union');
		expect(
			table.querySelector('[title="Christlich Demokratische Union Deutschlands"]')
		).not.toBeNull();
	});
});

// Review-Fund (i18n Block B): "Sonstige" ist eine Anzeige-, keine
// Daten-Schluessel-Uebersetzung -- `data-partei`/Sortier-Key bleiben roh.
describe('berlin-wahlen/[slug]/+page.svelte: "Sonstige" in der Berlin-Top-5-Tabelle unter en', () => {
	it('zeigt "Sonstige" als "Other" an', async () => {
		overwriteGetLocale(() => 'en');
		const data = {
			...makeData(),
			berlin: [
				{
					kurzname: 'Sonstige',
					vollname: 'Sonstige',
					farbeHex: '#999999',
					stimmen: 42,
					anteil: 0.05
				}
			]
		};
		render(WahlDetailPage, { data });
		await expect.element(page.getByTestId('wahl-detail-berlin-table')).toHaveTextContent('Other');
		await expect
			.element(page.getByTestId('wahl-detail-berlin-table'))
			.not.toHaveTextContent('Sonstige');
	});
});

// Review-Fund (i18n Block B): der Titel wird seit "Keys liefern, Label im
// Client" komplett client-seitig aus typ/stimmtyp/jahr/isRepeatElection
// zusammengesetzt (`wahlTitel` in +page.svelte) -- direkt gegen den
// gerenderten H1 geprueft, nicht nur implizit ueber andere Tests.
describe('berlin-wahlen/[slug]/+page.svelte: H1-Titel-Komposition (DE)', () => {
	it('AGH-Wiederholungswahl MIT Stimmtyp: "Abgeordnetenhauswahl {jahr} · Zweitstimme · Wiederholungswahl"', async () => {
		const data = makeData({
			typ: 'agh',
			stimmtyp: 'zweitstimme',
			jahr: 2023,
			isRepeatElection: true
		});
		render(WahlDetailPage, { data });
		await expect
			.element(page.getByTestId('wahl-detail-title'))
			.toHaveTextContent('Abgeordnetenhauswahl 2023, Zweitstimme, Wiederholungswahl');
	});

	it('BVV OHNE Stimtyp-Segment: "BVV-Wahl {jahr}" (kein Stimmtyp, keine Wiederholung)', async () => {
		const data = makeData({
			typ: 'bvv',
			stimmtyp: 'einstimme',
			jahr: 2026,
			isRepeatElection: false
		});
		render(WahlDetailPage, { data });
		const h1 = await page.getByTestId('wahl-detail-title').element();
		expect(h1.textContent?.trim()).toBe('BVV-Wahl 2026');
	});
});

describe('berlin-wahlen/[slug]/+page.svelte: Vorläufig-Badge (Review-Fund 23.09.)', () => {
	it('zeigt den Vorläufig-Badge mit Stand-Datum wenn vorlaeufig=true', async () => {
		const data = makeData({ vorlaeufig: true, sourceUpdatedAt: '2026-09-20T23:55:55.000Z' });
		render(WahlDetailPage, { data });
		await expect
			.element(page.getByTestId('wahl-detail-vorlaeufig'))
			.toHaveTextContent('Vorläufig, Stand 21.09.2026');
	});

	it('zeigt keinen Vorläufig-Badge wenn vorlaeufig=false', async () => {
		const data = makeData({ vorlaeufig: false, sourceUpdatedAt: null });
		render(WahlDetailPage, { data });
		await expect.element(page.getByTestId('wahl-detail-vorlaeufig')).not.toBeInTheDocument();
	});
});

describe('berlin-wahlen/[slug]/+page.svelte: Story 16 (Umzug + Portal-Deep-Link)', () => {
	it('Breadcrumb-Link „Wahlen" zeigt auf /berlin-wahlen', async () => {
		render(WahlDetailPage, { data: makeData() });
		const link = page.getByRole('link', { name: 'Wahlen' });
		await expect.element(link).toHaveAttribute('href', '/berlin-wahlen');
	});

	it('Portal-Deep-Link trägt Jahr als Query (Reihe agh = Portal-Default, kein Query-Eintrag)', async () => {
		const data = makeData({ typ: 'agh', stimmtyp: 'zweitstimme', jahr: 2023 });
		render(WahlDetailPage, { data });
		const link = page.getByTestId('wahl-detail-portal-link');
		await expect.element(link).toHaveAttribute('href', '/berlin-wahlen?jahr=2023');
	});

	it('Portal-Deep-Link trägt Reihe wenn abweichend vom Portal-Default (btw)', async () => {
		const data = makeData({ typ: 'btw', stimmtyp: 'zweitstimme', jahr: 2025 });
		render(WahlDetailPage, { data });
		const link = page.getByTestId('wahl-detail-portal-link');
		await expect.element(link).toHaveAttribute('href', '/berlin-wahlen?reihe=btw&jahr=2025');
	});

	it('Portal-Deep-Link nennt Reihe + Jahr im Linktext', async () => {
		const data = makeData({ typ: 'agh', stimmtyp: 'zweitstimme', jahr: 2021 });
		render(WahlDetailPage, { data });
		const link = page.getByTestId('wahl-detail-portal-link');
		await expect.element(link).toHaveTextContent('Abgeordnetenhaus 2021 im Portal ansehen');
	});

	it('Portal-Deep-Link bei Erststimme wechselt NICHT den Stimmtyp; Hinweis steht außerhalb des Links, per aria-describedby verknüpft', async () => {
		const data = makeData({ typ: 'btw', stimmtyp: 'erststimme', jahr: 2025 });
		render(WahlDetailPage, { data });
		const link = page.getByTestId('wahl-detail-portal-link');
		await expect.element(link).toHaveAttribute('href', '/berlin-wahlen?reihe=btw&jahr=2025');
		await expect.element(link).toHaveTextContent('Bundestag 2025 im Portal ansehen');
		await expect.element(link).not.toHaveTextContent('Zweitstimme');
		await expect
			.element(link)
			.toHaveAttribute('aria-describedby', 'wahl-detail-portal-link-hinweis');

		const hinweis = page.getByTestId('wahl-detail-portal-link-hinweis');
		await expect
			.element(hinweis)
			.toHaveTextContent(
				'Das Portal zeigt die Zweitstimme; die Erststimme gibt es nur auf dieser Seite.'
			);
		const hinweisEl = (await hinweis.element()) as HTMLElement;
		expect(hinweisEl.id).toBe('wahl-detail-portal-link-hinweis');
	});

	it('Portal-Deep-Link ohne Erststimme hat keinen aria-describedby und keinen Hinweis-Text', async () => {
		const data = makeData({ typ: 'btw', stimmtyp: 'zweitstimme', jahr: 2025 });
		render(WahlDetailPage, { data });
		const link = page.getByTestId('wahl-detail-portal-link');
		await expect.element(link).not.toHaveAttribute('aria-describedby');
		await expect
			.element(page.getByTestId('wahl-detail-portal-link-hinweis'))
			.not.toBeInTheDocument();
	});

	it('Wiederholungswahl-Link zeigt auf /berlin-wahlen/<parent-slug>', async () => {
		const data = makeData({ isRepeatElection: true, parentSlug: '2021-agh-zweitstimme' });
		render(WahlDetailPage, { data });
		const link = page.getByRole('link', { name: 'Original-Wahl ansehen' });
		await expect.element(link).toHaveAttribute('href', '/berlin-wahlen/2021-agh-zweitstimme');
	});

	it('rendert die drei Kapitel-Sections (Berlin, Karte, Bezirke)', async () => {
		render(WahlDetailPage, { data: makeData() });
		await expect.element(page.getByTestId('wahl-detail-berlin')).toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-detail-choropleth')).toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-detail-bezirke')).toBeInTheDocument();
	});
});

describe('berlin-wahlen/[slug]/+page.svelte: detailseiten-eigene Stand-Zeile (Review-Fund, kein PortalDatenstand)', () => {
	it('zeigt die echte Quelle statt PortalDatenstands fester Quellenliste', async () => {
		const data = makeData({ sourceName: 'Landeswahlleiterin Berlin' });
		render(WahlDetailPage, { data });
		const meta = page.getByTestId('wahl-detail-meta');
		await expect.element(meta).toHaveTextContent('Landeswahlleiterin Berlin');
		// PortalDatenstand rendert immer diese feste, portalweite Quellenliste --
		// die darf auf der Detailseite nicht mehr auftauchen.
		await expect.element(meta).not.toHaveTextContent('Amt für Statistik Berlin-Brandenburg');
		await expect.element(page.getByTestId('portal-datenstand')).not.toBeInTheDocument();
	});

	it('zeigt ein Stand-Datum wenn sourceUpdatedAt gesetzt ist', async () => {
		const data = makeData({ sourceUpdatedAt: '2026-09-20T23:55:55.000Z' });
		render(WahlDetailPage, { data });
		await expect
			.element(page.getByTestId('wahl-detail-meta'))
			.toHaveTextContent('Stand 21.09.2026');
	});

	it('zeigt kein Stand-Datum ohne sourceUpdatedAt', async () => {
		const data = makeData({ sourceUpdatedAt: null });
		render(WahlDetailPage, { data });
		await expect.element(page.getByTestId('wahl-detail-meta')).not.toHaveTextContent('Stand');
	});
});

describe('berlin-wahlen/[slug]/+page.svelte: Dataset-JSON-LD', () => {
	it('mit sourceUpdatedAt: dateModified, temporalCoverage, creator.url, url, spatialCoverage', async () => {
		render(WahlDetailPage, {
			data: makeData({ sourceUpdatedAt: '2026-09-20T23:55:55.000Z' })
		});
		await expect.element(page.getByTestId('wahl-detail-meta')).toBeInTheDocument();
		const ld = readDatasetJsonLd();
		expect(ld.dateModified).toBe('2026-09-20T23:55:55.000Z');
		expect(ld.temporalCoverage).toBe('2026');
		expect(ld.creator.url).toBe('https://www.wahlen-berlin.de');
		expect(ld.url).toMatch(/\/berlin-wahlen\/2026-bvv$/);
		expect(ld['@id']).toBe(`${ld.url}#dataset`);
		expect(ld.spatialCoverage.geo.box).toMatch(/^52\.\d+ 13\.\d+ 52\.\d+ 13\.\d+$/);
	});

	it('ohne sourceUpdatedAt: dateModified fällt auf den 1. Januar des Wahljahrs', async () => {
		render(WahlDetailPage, { data: makeData({ sourceUpdatedAt: null }) });
		await expect.element(page.getByTestId('wahl-detail-meta')).toBeInTheDocument();
		const ld = readDatasetJsonLd();
		expect(ld.dateModified).toBe('2026-01-01');
		expect(ld.temporalCoverage).toBe('2026');
	});
});

describe('berlin-wahlen/[slug]/+page.svelte: Meta-Tags (S6)', () => {
	const party = (kurzname: string, anteil: number) => ({
		kurzname,
		vollname: kurzname,
		farbeHex: '#123456',
		stimmen: 1000,
		anteil
	});

	function metaDescription(): string {
		return document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
	}

	it('EN + Wiederholungswahl: Titel höchstens 60 Zeichen', () => {
		overwriteGetLocale(() => 'en');
		const data = {
			...makeData({ typ: 'agh', stimmtyp: 'erststimme', jahr: 2023, isRepeatElection: true }),
			berlin: [party('CDU', 0.297)]
		};
		render(WahlDetailPage, { data });
		expect(document.title.length).toBeLessThanOrEqual(60);
		expect(document.title).toContain('House of Representatives 2023');
	});

	it('Erst- und Zweitstimme haben verschiedene Beschreibungen', () => {
		const base = { typ: 'agh', jahr: 2021, isRepeatElection: false } as const;
		const berlin = [party('SPD', 0.214)];
		const erst = render(WahlDetailPage, {
			data: { ...makeData({ ...base, stimmtyp: 'erststimme' }), berlin }
		});
		const erstDescription = metaDescription();
		erst.unmount();
		render(WahlDetailPage, {
			data: { ...makeData({ ...base, stimmtyp: 'zweitstimme' }), berlin }
		});
		expect(metaDescription()).not.toBe('');
		expect(metaDescription()).not.toBe(erstDescription);
	});

	it('Dataset-JSON-LD übernimmt die Meta-Beschreibung', () => {
		const data = {
			...makeData({ typ: 'agh', stimmtyp: 'zweitstimme', jahr: 2021 }),
			berlin: [party('SPD', 0.214)]
		};
		render(WahlDetailPage, { data });
		expect(readDatasetJsonLd().description).toBe(metaDescription());
	});

	it('nimmt die erste Partei, die nicht Sonstige ist', () => {
		const data = {
			...makeData({ typ: 'agh', stimmtyp: 'zweitstimme', jahr: 2021 }),
			berlin: [party('Sonstige', 0.3), party('SPD', 0.214)]
		};
		render(WahlDetailPage, { data });
		expect(metaDescription()).toContain('SPD mit 21,4 %');
	});
});

describe('berlin-wahlen/[slug]/+page.svelte: Top-3 je Bezirk als Tabelle (#90)', () => {
	const party = (kurzname: string, anteil: number) => ({
		kurzname,
		vollname: kurzname,
		farbeHex: '#000000',
		stimmen: 100,
		anteil
	});

	it('zeigt je Bezirk eine Tabellenzeile mit Bezirk als Zeilenkopf und drei Parteien', async () => {
		const data = {
			...makeData(),
			bezirke: [
				{
					slug: 'mitte',
					name: 'Mitte',
					top3: [party('SPD', 0.3), party('CDU', 0.25), party('GRÜNE', 0.2)]
				},
				{ slug: 'pankow', name: 'Pankow', top3: [] }
			]
		};
		render(WahlDetailPage, { data });
		await expect.element(page.getByTestId('wahl-detail-bezirke')).toBeInTheDocument();
		const section = document.querySelector('[data-testid="wahl-detail-bezirke"]') as HTMLElement;
		const table = section.querySelector('table') as HTMLTableElement;
		expect(table).not.toBeNull();
		expect(table.querySelectorAll('thead th[scope="col"]')).toHaveLength(4);
		const mitte = table.querySelector('[data-testid="wahl-detail-bezirk-mitte"]') as HTMLElement;
		expect(mitte.tagName).toBe('TR');
		expect(mitte.querySelector('th[scope="row"] a')?.textContent?.trim()).toBe('Mitte');
		expect(mitte.querySelectorAll('td')).toHaveLength(3);
		expect(section.querySelector('.rounded.border')).toBeNull();
	});

	it('füllt fehlende Plätze leer und meldet einen Bezirk ohne Daten über alle drei Spalten', async () => {
		const data = {
			...makeData(),
			bezirke: [
				{ slug: 'mitte', name: 'Mitte', top3: [party('SPD', 0.3)] },
				{ slug: 'pankow', name: 'Pankow', top3: [] }
			]
		};
		render(WahlDetailPage, { data });
		await expect.element(page.getByTestId('wahl-detail-bezirke')).toBeInTheDocument();
		const mitte = document.querySelector('[data-testid="wahl-detail-bezirk-mitte"]') as HTMLElement;
		const cells = mitte.querySelectorAll('td');
		expect(cells).toHaveLength(3);
		expect(cells[1].textContent?.trim()).toBe('');
		const leer = document.querySelector(
			'[data-testid="wahl-detail-bezirk-pankow"] td'
		) as HTMLElement;
		expect(leer.getAttribute('colspan')).toBe('3');
		expect(leer.textContent?.trim()).toBe('Keine Daten.');
	});

	it('zeigt englische Spaltenköpfe', async () => {
		overwriteGetLocale(() => 'en');
		const data = {
			...makeData(),
			bezirke: [{ slug: 'mitte', name: 'Mitte', top3: [party('SPD', 0.3)] }]
		};
		render(WahlDetailPage, { data });
		await expect.element(page.getByTestId('wahl-detail-bezirke')).toBeInTheDocument();
		const heads = [
			...document.querySelectorAll('[data-testid="wahl-detail-bezirke"] thead th')
		].map((th) => th.textContent?.trim());
		expect(heads).toEqual(['District', 'Rank 1', 'Rank 2', 'Rank 3']);
	});
});
