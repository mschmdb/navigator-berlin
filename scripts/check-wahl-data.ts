/**
 * prebuild-Gate für Wahl-Daten (Story 6.9-Followup).
 *
 * Exit 0 (skip data:wahl-fetch + wahl-geo + wahl-kiez + wahl-analytik) wenn:
 *   - mind. 20 Wahlen in DB
 *   - jede Wahl hat mind. 100 ergebnis-rows
 *   - mind. 15 distinct wahl_ids in wahl_aggregat_kiez (alle Wahlen
 *     mit Geometrie: BTW 17/21/25 ×2 + AGH 16/21/23 ×2 + BVV 16/21/23)
 *   - mind. 400 Rows in wahl_analytik_kiez (5 Reihen × ~142 Kieze,
 *     Build-Zeit-Aggregat aus `build-wahl-analytik.ts`)
 *   - env WAHL_REFRESH != true
 *
 * Exit 1 (refresh) sonst. prebuild-Kette nutzt `|| (data:wahl-fetch && …)`
 * um bei exit 1 die volle Pipeline (inkl. wahl-analytik) zu fahren.
 *
 * Force-Refresh: Coolify-Build-Arg WAHL_REFRESH=true setzen, läuft 1×
 * durch, danach Env-Var wieder entfernen.
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { getDb, closeDb } from '../src/lib/server/db/index.js';

const MIN_WAHLEN = 20;
const MIN_ERGEBNIS_PER_WAHL = 100;
const MIN_WAHLEN_WITH_KIEZ_AGGREGAT = 15;
const MIN_ANALYTIK_ROWS = 400;

async function main(): Promise<void> {
	if (process.env.WAHL_REFRESH === 'true') {
		console.log('[wahl-check] WAHL_REFRESH=true · forcing refresh');
		process.exit(1);
	}
	if (!process.env.DATABASE_URL) {
		console.log('[wahl-check] no DATABASE_URL · forcing refresh');
		process.exit(1);
	}

	try {
		const db = getDb();
		const wahlCount = await db.execute<{ count: number }>(
			sql`SELECT count(*)::int AS count FROM wahl`
		);
		const distinctKiezWahlen = await db.execute<{ count: number }>(
			sql`SELECT count(DISTINCT wahl_id)::int AS count FROM wahl_aggregat_kiez`
		);
		const minPerWahl = await db.execute<{ min: number }>(
			sql`SELECT COALESCE(MIN(c), 0)::int AS min FROM (SELECT count(*) AS c FROM ergebnis GROUP BY wahl_id) sub`
		);
		const analytikRows = await db.execute<{ count: number }>(
			sql`SELECT count(*)::int AS count FROM wahl_analytik_kiez`
		);

		const w = wahlCount[0]?.count ?? 0;
		const kw = distinctKiezWahlen[0]?.count ?? 0;
		const m = minPerWahl[0]?.min ?? 0;
		const ar = analytikRows[0]?.count ?? 0;

		console.log(
			`[wahl-check] state: wahlen=${w} wahlen-mit-kiez-aggregat=${kw} min-ergebnis-per-wahl=${m} analytik-rows=${ar}`
		);

		const ok =
			w >= MIN_WAHLEN &&
			m >= MIN_ERGEBNIS_PER_WAHL &&
			kw >= MIN_WAHLEN_WITH_KIEZ_AGGREGAT &&
			ar >= MIN_ANALYTIK_ROWS;

		if (ok) {
			console.log(
				'[wahl-check] DB complete · skipping wahl-fetch/wahl-geo/wahl-kiez/wahl-analytik'
			);
			process.exit(0);
		}
		console.log(
			`[wahl-check] DB incomplete (need wahlen>=${MIN_WAHLEN}, min-per-wahl>=${MIN_ERGEBNIS_PER_WAHL}, wahlen-mit-kiez>=${MIN_WAHLEN_WITH_KIEZ_AGGREGAT}, analytik-rows>=${MIN_ANALYTIK_ROWS}) · refreshing`
		);
		process.exit(1);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error(`[wahl-check] error · forcing refresh: ${msg}`);
		process.exit(1);
	} finally {
		await closeDb();
	}
}

main();
