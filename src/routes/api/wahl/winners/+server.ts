/**
 * GET /api/wahl/winners?typ=agh&stimmtyp=zweitstimme&ebene=kiez
 *
 * Bulk-Winners: stärkste Partei + Anteil pro Jahr × Gebiet einer Wahl-Reihe
 * in einem Response, für die Zeit-Animation (Design Notes: Kiez/Bezirk
 * haben stabile LOR-Geometrie über alle Jahre, Stimmbezirke nicht).
 *
 * Ohne Datenbank: 200 mit leerer Liste. Ungültiger `typ`/`stimmtyp`/`ebene`
 * → 400 (valibot).
 */

import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { getWinnersBulk } from '$lib/server/db/queries/wahl/get-winners-bulk.js';
import { sourceName } from '$lib/server/wahl/source-label.js';

const QuerySchema = v.object({
	typ: v.picklist(['btw', 'agh', 'bvv']),
	stimmtyp: v.picklist(['erststimme', 'zweitstimme', 'einstimme']),
	ebene: v.picklist(['kiez', 'bezirk'])
});

function slugOf(w: { jahr: number; typ: string; stimmtyp: string }): string {
	if (w.typ === 'bvv') return `${w.jahr}-bvv`;
	return `${w.jahr}-${w.typ}-${w.stimmtyp}`;
}

export const GET: RequestHandler = async ({ url }) => {
	const parsed = v.safeParse(QuerySchema, {
		typ: url.searchParams.get('typ'),
		stimmtyp: url.searchParams.get('stimmtyp'),
		ebene: url.searchParams.get('ebene')
	});
	if (!parsed.success) {
		throw error(400, 'typ, stimmtyp und ebene erforderlich (typ: btw|agh|bvv, ebene: kiez|bezirk)');
	}
	const { typ, stimmtyp, ebene } = parsed.output;

	const list = await getWahlList();
	const wahlById = new Map(list.map((w) => [w.id, w]));
	const wahlenInReihe = list.filter((w) => w.typ === typ && w.stimmtyp === stimmtyp);

	const rows = await getWinnersBulk(ebene, typ, stimmtyp);

	const winners = rows.map((r) => {
		const w = wahlById.get(r.wahlId);
		const parentSlug =
			w?.isRepeatElection && w.parentElectionId
				? (() => {
						const parent = wahlById.get(w.parentElectionId as number);
						return parent ? slugOf(parent) : null;
					})()
				: null;
		return {
			jahr: w?.jahr ?? null,
			gebiet_slug: r.gebietSlug,
			partei: r.parteiKurzname,
			farbe_hex: r.farbeHex,
			anteil: r.anteil,
			is_repeat_election: w?.isRepeatElection ?? false,
			parent_slug: parentSlug
		};
	});

	const latestWahl = wahlenInReihe[0] ?? null;

	return json(
		{
			typ,
			stimmtyp,
			ebene,
			winners,
			license: latestWahl?.license ?? null,
			source_url: latestWahl?.sourceUrl ?? null,
			source_name: latestWahl ? sourceName(latestWahl.sourceUrl) : null
		},
		{ headers: { 'cache-control': 'public, max-age=3600' } }
	);
};
