import type { PageServerLoad } from './$types';
import { fetchBerlinHeatWarning } from '$lib/server/dwd-warnings.js';

// Story 16.2: Hitze-Home dynamisch (nicht prerendered), damit die Live-DWD-Warnlage
// pro Request abgerufen wird. fetchBerlinHeatWarning degradiert intern zu null (AC-3).
export const prerender = false;

export const load: PageServerLoad = async () => {
	return { warning: await fetchBerlinHeatWarning() };
};
