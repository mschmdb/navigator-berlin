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

describe('wahl/[slug]/+page.svelte — Vorläufig-Badge (Review-Fund 23.09.)', () => {
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
