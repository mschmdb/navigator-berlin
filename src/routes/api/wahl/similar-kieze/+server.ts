/**
 * GET /api/wahl/similar-kieze?kiez=<slug>&typ=btw
 *
 * Zwilling-Kieze: Top-N Kieze mit der ähnlichsten Partei-Anteils-Verteilung
 * zu `kiez`, berechnet zur Laufzeit über den vorhandenen Bulk
 * (`get-kiez-shares-for-wahl`, Design Notes: 143 Vektoren pro Request sind
 * billig, Route cached 3600s). Nutzt die jüngste Wahl der Reihe
 * `typ`+Standard-Stimmtyp (`zweitstimme`, bei BVV `einstimme`); ein eigener
 * `stimmtyp`-Parameter entfällt, da die Ähnlichkeits-Metrik pro Wahl-Typ
 * gedacht ist (Zeitreihen-Vergleich ist Aufgabe von `/series`).
 *
 * Ohne Datenbank: 200 mit leerer Liste. Kiez ohne Daten: leere Liste +
 * `hint`-Feld statt Fehler.
 */

import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { getKiezSharesForWahl } from '$lib/server/db/queries/wahl/get-kiez-shares-for-wahl.js';
import { rankSimilarKieze } from '$lib/server/wahl/similar-kieze.js';
import { sourceName } from '$lib/server/wahl/source-label.js';
import { wahlCacheHeaders } from '$lib/server/wahl/cache-control.js';

const QuerySchema = v.object({
	kiez: v.pipe(v.string(), v.minLength(1)),
	typ: v.picklist(['btw', 'agh', 'bvv'])
});

export const GET: RequestHandler = async ({ url }) => {
	const parsed = v.safeParse(QuerySchema, {
		kiez: url.searchParams.get('kiez'),
		typ: url.searchParams.get('typ')
	});
	if (!parsed.success) throw error(400, 'kiez und typ erforderlich (typ: btw|agh|bvv)');
	const { kiez, typ } = parsed.output;
	const stimmtyp = typ === 'bvv' ? 'einstimme' : 'zweitstimme';

	const list = await getWahlList();
	const latestWahl =
		list
			.filter((w) => w.typ === typ && w.stimmtyp === stimmtyp)
			.sort((a, b) => b.jahr - a.jahr)[0] ?? null;

	const rows = latestWahl ? await getKiezSharesForWahl(latestWahl.id) : [];
	const { results, hint } = rankSimilarKieze(kiez, rows, 5);

	return json(
		{
			kiez,
			typ,
			stimmtyp,
			metric: 'anteil-l1-similarity',
			results: results.map((r) => ({ kiez_slug: r.kiezSlug, score: r.score })),
			hint,
			license: latestWahl?.license ?? null,
			source_url: latestWahl?.sourceUrl ?? null,
			source_name: latestWahl ? sourceName(latestWahl.sourceUrl) : null
		},
		{ headers: wahlCacheHeaders() }
	);
};
