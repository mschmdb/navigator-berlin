import type { RequestHandler } from './$types';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { hasGeometry, wahlSlugFromTypJahr } from '$lib/data/wahl-geo-mapping.js';

function buildSlug(jahr: number, typ: 'btw' | 'agh' | 'bvv', stimmtyp: string): string {
	if (typ === 'bvv') return `${jahr}-bvv`;
	return `${jahr}-${typ}-${stimmtyp}`;
}

function sourceName(sourceUrl: string): string {
	return sourceUrl.includes('bundeswahlleiterin')
		? 'Bundeswahlleiterin'
		: 'Amt für Statistik Berlin-Brandenburg';
}

export const GET: RequestHandler = async () => {
	const list = await getWahlList();
	const parentIdToSlug = new Map<number, string>();
	for (const w of list) {
		parentIdToSlug.set(w.id, buildSlug(w.jahr, w.typ, w.stimmtyp));
	}
	const elections = list.map((w) => ({
		slug: buildSlug(w.jahr, w.typ, w.stimmtyp),
		jahr: w.jahr,
		typ: w.typ,
		stimmtyp: w.stimmtyp,
		is_repeat_election: w.isRepeatElection,
		parent_slug: w.parentElectionId ? (parentIdToSlug.get(w.parentElectionId) ?? null) : null,
		has_stimmbezirks_geometry: hasGeometry(wahlSlugFromTypJahr(w.typ, w.jahr)),
		source_name: sourceName(w.sourceUrl),
		source_url: w.sourceUrl,
		license: w.license
	}));
	return new Response(JSON.stringify({ elections }), {
		status: 200,
		headers: {
			'content-type': 'application/json',
			'cache-control': 'public, max-age=300'
		}
	});
};
