import type { PageLoad } from './$types';

// Story 16.1: statische Landing, keine Server-Daten (Berlin-Umriss ist ein importiertes Modul).
export const prerender = true;

export const load: PageLoad = () => {
	return {};
};
