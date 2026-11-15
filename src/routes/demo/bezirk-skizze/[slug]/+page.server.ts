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
import type { PageServerLoad } from './$types';

export const prerender = false;

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
	return {
		profile: {
			slug: base.profile.slug,
			name: base.profile.name,
			einwohner: base.profile.einwohner,
			flaecheHa: base.profile.flaecheHa
		},
		prose: base.profileProse,
		kieze,
		bezirke,
		berlinFigures,
		wahl: { own: wahlOwn, berlin: wahlBerlin }
	};
};
