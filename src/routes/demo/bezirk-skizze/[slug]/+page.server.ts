import {
	load as bezirkPageLoad,
	type BezirkPageData
} from '../../../(with-header)/bezirk/[slug]/+page.server';
import {
	loadBezirkRegions,
	loadKiezRegions,
	readBerlinFigures
} from '$lib/skizzen/load-regions.server';
import { loadWahlBundle } from '$lib/skizzen/wahl.server';
import { neighborBezirke } from '$lib/skizzen/bezirk-neighbors';
import { getKiezNeighborLists } from '$lib/server/kiez-neighbors-index.js';
import { bezirkSlugFromName } from '$lib/data/region-display-names.js';
import { median } from '$lib/skizzen/stats';
import { DIMS, type Dim } from '$lib/skizzen/types';
import type { PageServerLoad } from './$types';

export const prerender = false;

/** Berlin-Median aller Kieze je Dimension: Bezug für die Kiezliste des Bezirks. */
function kiezMedians(all: Awaited<ReturnType<typeof loadKiezRegions>>) {
	return Object.fromEntries(DIMS.map((d) => [d, median(all.map((k) => k.dims[d]))])) as Record<
		Dim,
		number | null
	>;
}

export const load: PageServerLoad = async (event) => {
	const base = (await bezirkPageLoad(
		event as unknown as Parameters<typeof bezirkPageLoad>[0]
	)) as BezirkPageData;
	const slug = event.params.slug;
	const [kieze, bezirke, berlinFigures, wahlOwn, wahlBerlin] = await Promise.all([
		loadKiezRegions(),
		loadBezirkRegions(),
		readBerlinFigures(),
		loadWahlBundle('bezirk', slug),
		loadWahlBundle('berlin', null)
	]);
	const ownKieze = kieze.filter((k) => k.parentSlug === slug);
	const lists = new Map(
		await Promise.all(
			ownKieze.map(async (k) => [k.slug, await getKiezNeighborLists(k.slug)] as const)
		)
	);
	const neighborSlugs = neighborBezirke(
		ownKieze.map((k) => k.slug),
		base.profile.name,
		(s) => lists.get(s)?.neighbors ?? []
	)
		.map(bezirkSlugFromName)
		.filter((s) => s !== slug);
	return {
		profile: {
			slug: base.profile.slug,
			name: base.profile.name,
			einwohner: base.profile.einwohner,
			flaecheHa: base.profile.flaecheHa
		},
		prose: base.profileProse,
		kieze: ownKieze,
		kiezMedians: kiezMedians(kieze),
		neighborSlugs,
		bezirke,
		berlinFigures,
		wahl: { own: wahlOwn, berlin: wahlBerlin }
	};
};
