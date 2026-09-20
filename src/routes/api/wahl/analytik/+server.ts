/**
 * GET /api/wahl/analytik?ebene=kiez&typ=agh&stimmtyp=zweitstimme
 *
 * Wechsel/Trend/Volatilität pro Kiez für eine Wahl-Reihe, gelesen aus dem
 * Build-Zeit-Aggregat (ADR-013, `scripts/build-wahl-analytik.ts`). Phase 1
 * nur Kiez-Ebene: `ebene` ist daher fest auf `kiez`, kein Bezirk-Aggregat
 * gebaut (siehe Story-Notes).
 *
 * Ohne Datenbank: 200 mit leerer Liste.
 */

import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import {
	getAnalytikForReihe,
	getTrendForReihe
} from '$lib/server/db/queries/wahl/get-analytik-for-reihe.js';
import { sourceName } from '$lib/server/wahl/source-label.js';
import { wahlCacheHeaders } from '$lib/server/wahl/cache-control.js';

const QuerySchema = v.object({
	ebene: v.literal('kiez'),
	typ: v.picklist(['btw', 'agh', 'bvv']),
	stimmtyp: v.picklist(['erststimme', 'zweitstimme', 'einstimme'])
});

export const GET: RequestHandler = async ({ url }) => {
	const parsed = v.safeParse(QuerySchema, {
		ebene: url.searchParams.get('ebene'),
		typ: url.searchParams.get('typ'),
		stimmtyp: url.searchParams.get('stimmtyp')
	});
	if (!parsed.success) {
		throw error(400, 'ebene=kiez, typ und stimmtyp erforderlich (typ: btw|agh|bvv)');
	}
	const { ebene, typ, stimmtyp } = parsed.output;

	const [analytikRows, trendRows, list] = await Promise.all([
		getAnalytikForReihe(typ, stimmtyp),
		getTrendForReihe(typ, stimmtyp),
		getWahlList()
	]);

	const trendsByKiez = new Map<string, { partei: string; slope: number }[]>();
	for (const t of trendRows) {
		const arr = trendsByKiez.get(t.kiezSlug) ?? [];
		arr.push({ partei: t.parteiKurzname, slope: t.slope });
		trendsByKiez.set(t.kiezSlug, arr);
	}

	const gebiete = analytikRows.map((a) => ({
		kiez_slug: a.kiezSlug,
		wechsel_count: a.wechselCount,
		wechsel_jahre: a.wechselJahre,
		volatilitaet: a.volatilitaet,
		trends: trendsByKiez.get(a.kiezSlug) ?? []
	}));

	const latestWahl = list.filter((w) => w.typ === typ && w.stimmtyp === stimmtyp)[0] ?? null;

	return json(
		{
			ebene,
			typ,
			stimmtyp,
			gebiete,
			license: latestWahl?.license ?? null,
			source_url: latestWahl?.sourceUrl ?? null,
			source_name: latestWahl ? sourceName(latestWahl.sourceUrl) : null
		},
		{ headers: wahlCacheHeaders() }
	);
};
