/**
 * GET /api/wahl/series?typ=agh&stimmtyp=zweitstimme&ebene=kiez&gebiet=<slug>
 * GET /api/wahl/series?typ=agh&stimmtyp=zweitstimme&ebene=berlin
 *
 * Zeitreihe eines Gebiets (Kiez, Bezirk oder Berlin gesamt) über alle Jahre
 * einer Wahl-Reihe: ein Punkt je Jahr × Partei, inkl. Wiederholungswahl-Flag
 * + `parent_slug` (Boundaries: Zeitreihen führen 2021 UND 2023 für
 * Wiederholungswahlen, geflaggt). `coverage_ab` nennt das früheste Jahr mit
 * Daten für dieses Gebiet (Kiez-Aggregat startet erst 2016/2017, siehe
 * `docs/wahldaten-methodik.md`).
 *
 * Story 6: `ebene=berlin` ist additiv -- `gebiet` entfällt dann (wird
 * ignoriert, falls trotzdem mitgeschickt), die Response nennt `gebiet:
 * 'berlin'`. `kiez`/`bezirk` verlangen weiter `gebiet` (400 sonst).
 *
 * Ohne Datenbank: 200 mit leeren Punkten. Unbekanntes Gebiet (kiez/bezirk):
 * 404, aber nur wenn die Wahl-Reihe selbst Daten in der DB hat (gleiche
 * Semantik wie `kiez-shares`). Für `ebene=berlin` entfällt der 404-Zweig --
 * Berlin gesamt existiert immer, auch ohne Berechnung (leere Punkte).
 */

import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import {
	getSeriesForGebiet,
	type GebietEbene
} from '$lib/server/db/queries/wahl/get-series-for-gebiet.js';
import { sourceName } from '$lib/server/wahl/source-label.js';
import { wahlCacheHeaders } from '$lib/server/wahl/cache-control.js';

const QuerySchema = v.object({
	typ: v.picklist(['btw', 'agh', 'bvv']),
	stimmtyp: v.picklist(['erststimme', 'zweitstimme', 'einstimme']),
	ebene: v.picklist(['kiez', 'bezirk', 'berlin']),
	// Nur für kiez/bezirk Pflicht; für berlin optional/ignoriert (Check unten,
	// weil valibot picklist-übergreifende Pflichtfelder nicht deklarativ kann).
	gebiet: v.nullable(v.string())
});

function slugOf(w: { jahr: number; typ: string; stimmtyp: string }): string {
	if (w.typ === 'bvv') return `${w.jahr}-bvv`;
	return `${w.jahr}-${w.typ}-${w.stimmtyp}`;
}

export const GET: RequestHandler = async ({ url }) => {
	const parsed = v.safeParse(QuerySchema, {
		typ: url.searchParams.get('typ'),
		stimmtyp: url.searchParams.get('stimmtyp'),
		ebene: url.searchParams.get('ebene'),
		gebiet: url.searchParams.get('gebiet')
	});
	if (!parsed.success) {
		throw error(
			400,
			'typ, stimmtyp und ebene erforderlich; gebiet zusätzlich für ebene=kiez|bezirk (typ: btw|agh|bvv, ebene: kiez|bezirk|berlin)'
		);
	}
	const { typ, stimmtyp, ebene, gebiet } = parsed.output;
	if (ebene !== 'berlin' && (!gebiet || gebiet.length < 1)) {
		throw error(
			400,
			'typ, stimmtyp und ebene erforderlich; gebiet zusätzlich für ebene=kiez|bezirk (typ: btw|agh|bvv, ebene: kiez|bezirk|berlin)'
		);
	}

	const list = await getWahlList();
	const wahlById = new Map(list.map((w) => [w.id, w]));
	const wahlenInReihe = list.filter((w) => w.typ === typ && w.stimmtyp === stimmtyp);

	const rows = await getSeriesForGebiet(
		ebene === 'berlin' ? null : gebiet,
		ebene as GebietEbene,
		typ,
		stimmtyp
	);

	if (ebene !== 'berlin' && wahlenInReihe.length > 0 && rows.length === 0) {
		throw error(404, `Unbekanntes Gebiet: ${gebiet}`);
	}

	const points = rows.map((r) => {
		const w = wahlById.get(r.wahlId);
		const parentSlug =
			w?.isRepeatElection && w.parentElectionId
				? (() => {
						const parent = wahlById.get(w.parentElectionId as number);
						return parent ? slugOf(parent) : null;
					})()
				: null;
		return {
			jahr: r.jahr,
			partei: r.parteiKurzname,
			farbe_hex: r.farbeHex,
			anteil: r.anteil,
			stimmen: r.stimmen,
			is_repeat_election: w?.isRepeatElection ?? false,
			parent_slug: parentSlug
		};
	});

	const coverageAb = points.length > 0 ? Math.min(...points.map((p) => p.jahr)) : null;
	const latestWahl = wahlenInReihe[0] ?? null;

	return json(
		{
			typ,
			stimmtyp,
			ebene,
			gebiet: ebene === 'berlin' ? 'berlin' : gebiet,
			coverage_ab: coverageAb,
			points,
			license: latestWahl?.license ?? null,
			source_url: latestWahl?.sourceUrl ?? null,
			source_name: latestWahl ? sourceName(latestWahl.sourceUrl) : null
		},
		{ headers: wahlCacheHeaders() }
	);
};
