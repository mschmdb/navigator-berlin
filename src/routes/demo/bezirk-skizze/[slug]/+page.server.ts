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
import { getKiezNeighborLists, readLayer } from '$lib/server/kiez-neighbors-index.js';
import { buildRegionOutline, type OutlineRegion } from '$lib/seo/region-outline-svg.js';
import { loadFaqByChapter } from '$lib/skizzen/faq.server';
import { bezirkSlugFromName, cleanName } from '$lib/data/region-display-names.js';
import type { PageServerLoad } from './$types';

export const prerender = false;

/** Alle 12 Bezirke als Umriss: der eigene Bezirk klein in der Berlin-Karte. */
async function berlinOutline() {
	const fc = await readLayer('bezirke');
	const regions: OutlineRegion[] = [];
	for (const f of fc.features) {
		const n = f.properties?.Gemeinde_name;
		const g = f.geometry as OutlineRegion['geometry'] | null | undefined;
		if (typeof n === 'string' && g && (g.type === 'Polygon' || g.type === 'MultiPolygon')) {
			regions.push({ id: bezirkSlugFromName(cleanName(n)), geometry: g });
		}
	}
	return buildRegionOutline(regions);
}

export const load: PageServerLoad = async (event) => {
	const base = (await bezirkPageLoad(
		event as unknown as Parameters<typeof bezirkPageLoad>[0]
	)) as BezirkPageData;
	const slug = event.params.slug;
	const [kieze, bezirke, berlinFigures, wahlOwn, wahlBerlin, faq, berlinMap] = await Promise.all([
		loadKiezRegions(),
		loadBezirkRegions(),
		readBerlinFigures(),
		loadWahlBundle('bezirk', slug),
		loadWahlBundle('berlin', null),
		loadFaqByChapter('bezirk', slug),
		berlinOutline()
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
		outline: base.kiezeView.outline,
		berlinMap,
		faq,
		kieze: ownKieze,
		neighborSlugs,
		bezirke,
		berlinFigures,
		wahl: { own: wahlOwn, berlin: wahlBerlin }
	};
};
