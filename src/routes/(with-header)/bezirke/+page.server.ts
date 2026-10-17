import type { OverviewBezirk } from '$lib/data/region-overview.js';
import { readEinwohnerStichtag } from '$lib/server/profile/meta-sources.js';
import { loadRegionOverview } from '$lib/server/profile/region-overview-loader.js';
import type { PageServerLoad } from './$types';

export const prerender = true;

export type BezirkeOverviewData = {
	readonly bezirke: readonly OverviewBezirk[];
	readonly einwohnerStichtag: string | null;
};

/** Alle Bezirke mit Einwohnerzahl und Kiez-Score, DB-frei. */
export const load: PageServerLoad = async ({ fetch }) => {
	const [bezirke, einwohnerStichtag] = await Promise.all([
		loadRegionOverview(fetch, { scope: 'bezirke', withEinwohner: true }),
		readEinwohnerStichtag()
	]);
	const data: BezirkeOverviewData = { bezirke, einwohnerStichtag };
	return data;
};
