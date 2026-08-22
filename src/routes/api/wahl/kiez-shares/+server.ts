/**
 * GET /api/wahl/kiez-shares?election=2025-btw-zweitstimme
 *
 * Bulk-Endpoint für den Kiez-Finder: alle Partei-Anteile einer Wahl auf
 * Kiez-Ebene (143 Bezirksregionen) in einem Rutsch, gekeyt auf BZR_ID,
 * damit der Client sie ohne Slug-Wissen auf PLR_IDs spiegeln kann.
 * Ohne Datenbank: 200 mit leerer Liste (gleiche Semantik wie die übrigen
 * Wahl-Queries).
 */

import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { getKiezSharesForWahl } from '$lib/server/db/queries/wahl/get-kiez-shares-for-wahl.js';
import { loadKiezSlugToBzrId } from '$lib/server/wahl/kiez-slug-to-bzr.js';

const ElectionSlugSchema = v.pipe(v.string(), v.regex(/^\d{4}-(btw|agh|bvv)(-[a-z]+)?$/));

function slugOf(item: { jahr: number; typ: string; stimmtyp: string }): string {
	if (item.typ === 'bvv') return `${item.jahr}-bvv`;
	return `${item.jahr}-${item.typ}-${item.stimmtyp}`;
}

export const GET: RequestHandler = async ({ url }) => {
	const parsed = v.safeParse(ElectionSlugSchema, url.searchParams.get('election'));
	if (!parsed.success) throw error(400, 'election muss z.B. 2025-btw-zweitstimme sein');
	const electionSlug = parsed.output;

	const elections = await getWahlList();
	const match = elections.find((e) => slugOf(e) === electionSlug);
	if (elections.length > 0 && !match) throw error(404, `Unbekannte Wahl: ${electionSlug}`);

	const rows = match ? await getKiezSharesForWahl(match.id) : [];
	const slugToBzr = await loadKiezSlugToBzrId(process.cwd());
	const shares = rows.flatMap((row) => {
		const bzrId = slugToBzr.get(row.kiezSlug);
		return bzrId ? [{ bzrId, partei: row.parteiKurzname, anteil: row.anteil }] : [];
	});

	return json(
		{ election: electionSlug, shares },
		{ headers: { 'cache-control': 'public, max-age=3600' } }
	);
};
