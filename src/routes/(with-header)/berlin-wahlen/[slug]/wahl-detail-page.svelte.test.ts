import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WahlDetailPage from './+page.svelte';
import type { WahlDetailPageData } from './+page.server.js';

function makeData(overrides: Partial<WahlDetailPageData['wahl']> = {}): WahlDetailPageData {
	return {
		slug: '2026-bvv',
		wahl: {
			id: 23,
			jahr: 2026,
			typ: 'bvv',
			stimmtyp: 'einstimme',
			typLabel: 'BVV-Wahl',
			stimmtypLabel: 'Stimme',
			title: 'BVV-Wahl 2026',
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

describe('berlin-wahlen/[slug]/+page.svelte: Vorläufig-Badge (Review-Fund 23.09.)', () => {
	it('zeigt den Vorläufig-Badge mit Stand-Datum wenn vorlaeufig=true', async () => {
		const data = makeData({ vorlaeufig: true, sourceUpdatedAt: '2026-09-20T23:55:55.000Z' });
		render(WahlDetailPage, { data });
		await expect
			.element(page.getByTestId('wahl-detail-vorlaeufig'))
			.toHaveTextContent('Vorläufig · Stand 21.09.2026');
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
		await expect.element(link).toHaveAttribute('aria-describedby', 'wahl-detail-portal-link-hinweis');

		const hinweis = page.getByTestId('wahl-detail-portal-link-hinweis');
		await expect.element(hinweis).toHaveTextContent(
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
		await expect.element(page.getByTestId('wahl-detail-portal-link-hinweis')).not.toBeInTheDocument();
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
		await expect
			.element(page.getByTestId('portal-datenstand'))
			.not.toBeInTheDocument();
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
