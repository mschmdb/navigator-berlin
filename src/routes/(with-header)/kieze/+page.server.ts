import type { OverviewBezirk } from '$lib/data/region-overview.js';
import { loadRegionOverview } from '$lib/server/profile/region-overview-loader.js';
import type { PageServerLoad } from './$types';

export const prerender = true;

export type KiezeOverviewData = {
	readonly bezirke: readonly OverviewBezirk[];
};

/** Alle Kieze nach Bezirk gruppiert, Scores DB-frei aus dem statischen Composite-JSON. */
export const load: PageServerLoad = async ({ fetch }) => {
	const data: KiezeOverviewData = { bezirke: await loadRegionOverview(fetch, { scope: 'kieze' }) };
	return data;
};
