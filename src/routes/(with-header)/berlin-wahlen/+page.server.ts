import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { buildWahlSlug, buildWahlFallbackList } from '$lib/data/wahl-slug.js';
import type { PageServerLoad } from './$types';

export const prerender = true;

export type AlleWahlenEntry = {
	readonly slug: string;
	readonly jahr: number;
	readonly typ: 'btw' | 'agh' | 'bvv';
	readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	readonly isRepeatElection: boolean;
};

/**
 * Matze-Entscheidung 24.09. (Review, Intent-Gap „verwaiste Detailseiten"):
 * Block „Alle Wahlen einzeln" im Methodik-Kapitel braucht die Detailseiten-
 * Slugs SERVERSEITIG (prerendered HTML, damit Crawler sie finden) -- die
 * client-seitig geladene `/api/wahl/list`-Liste (`wahl-portal-context.svelte.ts`)
 * steht auf einer prerenderten Seite erst nach dem ersten Mount zur Verfügung.
 * DB-loser Fallback identisch zu `berlin-wahlen/[slug]/+page.server.ts#entries`
 * (`buildWahlFallbackList`), damit der Build auch ohne Postgres durchläuft.
 */
export const load: PageServerLoad = async (): Promise<{ alleWahlen: AlleWahlenEntry[] }> => {
	if (!process.env.DATABASE_URL) {
		return {
			alleWahlen: buildWahlFallbackList().map((s) => ({
				...s,
				slug: buildWahlSlug(s),
				isRepeatElection: false
			}))
		};
	}
	const list = await getWahlList();
	return {
		alleWahlen: list.map((w) => ({
			slug: buildWahlSlug({ jahr: w.jahr, typ: w.typ, stimmtyp: w.stimmtyp }),
			jahr: w.jahr,
			typ: w.typ,
			stimmtyp: w.stimmtyp,
			isRepeatElection: w.isRepeatElection
		}))
	};
};
