import type { PageServerLoad } from './$types';
import { fetchBerlinColdWarnings } from '$lib/server/dwd-kaelte-warnings.js';

// Issue #60: Kälte-Seite dynamisch (nicht prerendered), damit die Live-DWD-Warnlage pro Request
// abgerufen wird. fetchBerlinColdWarnings degradiert intern zu einer leeren Liste.
export const prerender = false;

export const load: PageServerLoad = async () => {
	return { warnings: await fetchBerlinColdWarnings() };
};
