/**
 * GET /api/wahl/winners?typ=agh&stimmtyp=zweitstimme&ebene=kiez
 * GET /api/wahl/winners?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=2023
 *
 * Bulk-Winners (kiez/bezirk): stärkste Partei + Anteil pro Jahr × Gebiet
 * einer Wahl-Reihe in einem Response, für die Zeit-Animation (Design Notes:
 * Kiez/Bezirk haben stabile LOR-Geometrie über alle Jahre, Stimmbezirke
 * nicht).
 *
 * Stimmbezirke (Story 5): pro Jahr statt pro Reihe (eine AGH-Reihe wären
 * ~7.000 Rows in einem Response, ein Jahr ~2.200) -- verlangt deshalb einen
 * expliziten `jahr`-Parameter (400 ohne). Response trägt zusätzlich
 * `geo_slug` (Wahl-Generation für die Geometrie, `null` ohne Geometrie für
 * dieses Jahr) und pro Row `gebiet_slug` = DB-`uwbId` statt Kiez/Bezirk-Slug.
 * Briefwahl-Aggregat-Rows (keine Geometrie) werden ausgefiltert.
 *
 * Ohne Datenbank: 200 mit leerer Liste. Ungültiger `typ`/`stimmtyp`/`ebene`
 * → 400 (valibot).
 */

import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { getWahlList, type WahlListItem } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { getWinnersBulk } from '$lib/server/db/queries/wahl/get-winners-bulk.js';
import { getStimmbezirksWinners } from '$lib/server/db/queries/wahl/get-stimmbezirks-winners.js';
import { sourceName } from '$lib/server/wahl/source-label.js';
import { wahlSlugFromTypJahr, geoSlugForWahl } from '$lib/data/wahl-geo-mapping.js';

const QuerySchema = v.object({
	typ: v.picklist(['btw', 'agh', 'bvv']),
	stimmtyp: v.picklist(['erststimme', 'zweitstimme', 'einstimme']),
	ebene: v.picklist(['kiez', 'bezirk', 'stimmbezirk'])
});

const JahrSchema = v.pipe(v.string(), v.regex(/^\d{4}$/), v.transform(Number));

function slugOf(w: { jahr: number; typ: string; stimmtyp: string }): string {
	if (w.typ === 'bvv') return `${w.jahr}-bvv`;
	return `${w.jahr}-${w.typ}-${w.stimmtyp}`;
}

async function handleStimmbezirk(
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme',
	jahrRaw: string | null
): Promise<Response> {
	const jahrParsed = v.safeParse(JahrSchema, jahrRaw);
	if (!jahrParsed.success) {
		throw error(400, 'ebene=stimmbezirk verlangt einen vierstelligen jahr-Parameter');
	}
	const jahr = jahrParsed.output;

	const list = await getWahlList();
	const wahl = list.find((w) => w.typ === typ && w.stimmtyp === stimmtyp && w.jahr === jahr);

	const empty = (w: WahlListItem | undefined) =>
		json(
			{
				typ,
				stimmtyp,
				ebene: 'stimmbezirk',
				jahr,
				geo_slug: null,
				winners: [],
				license: w?.license ?? null,
				source_url: w?.sourceUrl ?? null,
				source_name: w ? sourceName(w.sourceUrl) : null
			},
			{ headers: { 'cache-control': 'public, max-age=3600' } }
		);

	if (!wahl) return empty(undefined);

	const wahlSlug = wahlSlugFromTypJahr(typ, jahr);
	const geoSlug = geoSlugForWahl(wahlSlug);
	if (!geoSlug) return empty(wahl);

	const parentSlug =
		wahl.isRepeatElection && wahl.parentElectionId
			? (() => {
					const parent = list.find((w) => w.id === wahl.parentElectionId);
					return parent ? slugOf(parent) : null;
				})()
			: null;

	const rows = await getStimmbezirksWinners(wahl.id);
	const winners = rows
		.filter((r) => !r.istBriefwahlAggregat)
		.map((r) => ({
			jahr,
			gebiet_slug: r.uwbId,
			partei: r.parteiKurzname,
			farbe_hex: r.farbeHex,
			anteil: r.anteil,
			is_repeat_election: wahl.isRepeatElection,
			parent_slug: parentSlug
		}));

	return json(
		{
			typ,
			stimmtyp,
			ebene: 'stimmbezirk',
			jahr,
			geo_slug: geoSlug,
			winners,
			license: wahl.license,
			source_url: wahl.sourceUrl,
			source_name: sourceName(wahl.sourceUrl)
		},
		{ headers: { 'cache-control': 'public, max-age=3600' } }
	);
}

export const GET: RequestHandler = async ({ url }) => {
	const parsed = v.safeParse(QuerySchema, {
		typ: url.searchParams.get('typ'),
		stimmtyp: url.searchParams.get('stimmtyp'),
		ebene: url.searchParams.get('ebene')
	});
	if (!parsed.success) {
		throw error(
			400,
			'typ, stimmtyp und ebene erforderlich (typ: btw|agh|bvv, ebene: kiez|bezirk|stimmbezirk)'
		);
	}
	const { typ, stimmtyp, ebene } = parsed.output;

	if (ebene === 'stimmbezirk') {
		return handleStimmbezirk(typ, stimmtyp, url.searchParams.get('jahr'));
	}

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
