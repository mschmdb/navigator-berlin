import {
	load as kiezPageLoad,
	type KiezPageData
} from '../../../(with-header)/kiez/[slug]/+page.server';
import {
	loadBezirkRegions,
	loadKiezRegions,
	readBerlinFigures
} from '$lib/skizzen/load-regions.server';
import { loadWahlBundle } from '$lib/skizzen/wahl.server';
import type { PageServerLoad } from './$types';

// Skizze, kein Prerender: /demo ist noindex und läuft nur im Dev-Server bzw. per SSR.
export const prerender = false;

export const load: PageServerLoad = async (event) => {
	// Bestehenden Kiez-Loader wiederverwenden statt Daten nachzubauen.
	const base = (await kiezPageLoad(
		event as unknown as Parameters<typeof kiezPageLoad>[0]
	)) as KiezPageData;
	const bezirkSlug = base.bezirkSlug;
	const [regions, bezirke, berlinFigures, wahlOwn, wahlBerlin, wahlBezirk] = await Promise.all([
		loadKiezRegions(),
		loadBezirkRegions(),
		readBerlinFigures(),
		loadWahlBundle('kiez', event.params.slug),
		loadWahlBundle('berlin', null),
		bezirkSlug ? loadWahlBundle('bezirk', bezirkSlug) : Promise.resolve(null)
	]);
	return {
		profile: {
			slug: base.profile.slug,
			name: base.profile.name,
			bezirk: base.profile.bezirk,
			einwohner: base.profile.einwohner,
			flaecheHa: base.profile.flaecheHa
		},
		bezirkSlug,
		neighbors: base.neighbors,
		similar: base.similar,
		prose: base.profileProse,
		einwohnerStichtag: base.einwohnerStichtag,
		regions,
		bezirkRegion: bezirke.find((b) => b.slug === bezirkSlug) ?? null,
		berlinFigures,
		wahl: { own: wahlOwn, berlin: wahlBerlin, bezirk: wahlBezirk }
	};
};
