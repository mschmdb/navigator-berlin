import type { PageServerLoad } from './$types';
import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
import {
	mapHomeUpdateEntry,
	type HomeUpdateTeaser
} from '$lib/content/updates/map-home-update-entry.js';

// SSR statt prerender: Die Hitze-Subdomain reroutet `/` → `/hitze` per reroute-Hook.
// Prerenderte Seiten werden als statische Assets ausgeliefert und durchlaufen den
// reroute-Hook NICHT (SvelteKit-Docs). Damit der Host-basierte Reroute auf `/` greift,
// muss die Homepage serverseitig gerendert werden. Load ist soft (leere Arrays ohne DB).
export const prerender = false;

/**
 * Story 2.11: Hero-Landing-Move auf „/".
 *
 * Atlas-Page-Tree wurde nach `/explore` verschoben (Memory
 * `project_atlas_explore_route`). „/" ist SSR-Hero-Landing mit
 * redaktionellen Slots; Welcome-Overlay verworfen.
 *
 * Loader liefert die Top-3-Updates für `home-updates-teaser.svelte`. Die
 * Quelle ist soft: Fehler → leeres Array, die Komponente rendert sich selbst aus.
 */

const UPDATES_TEASER = 3;

export interface HomePageData {
	readonly updates: readonly HomeUpdateTeaser[];
}

const UPDATE_MODULES = import.meta.glob('/_content/updates/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, unknown>;

/**
 * i18n Block B2, Entscheidung Matze 26.09. 2A: `title_en`/`summary_en` wo
 * vorhanden, sonst DE-Fallback -- siehe `mapHomeUpdateEntry` (eigenes,
 * getestetes Modul: SvelteKit erlaubt in `+page.server.ts` nur
 * `load`/`prerender`/etc. als Export, ein zusätzlicher Named-Export lässt
 * den Build fehlschlagen).
 */
async function loadUpdates(locale: Locale): Promise<HomeUpdateTeaser[]> {
	try {
		const { loadUpdatesFromModules } = await import('$lib/content/updates/load-updates.js');
		const entries = loadUpdatesFromModules(UPDATE_MODULES);
		return entries.slice(0, UPDATES_TEASER).map((e) => mapHomeUpdateEntry(e, locale));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[home] WARN: updates unavailable (${msg})\n`);
		return [];
	}
}

export const load: PageServerLoad = async () => {
	const data: HomePageData = { updates: await loadUpdates(getLocale()) };
	return data;
};
