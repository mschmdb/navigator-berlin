/**
 * prebuild-Gate für Wahl-Daten (Story 6.9-Followup).
 *
 * Exit 0 (skip data:wahl-fetch + wahl-geo + wahl-kiez) wenn:
 *   - mind. 20 Wahlen in DB
 *   - jede Wahl hat mind. 100 ergebnis-rows
 *   - mind. 5000 wahl_aggregat_kiez-rows insgesamt
 *   - env WAHL_REFRESH != true
 *
 * Exit 1 (refresh) sonst. prebuild kette nutzt `|| (data:wahl-fetch && …)`
 * um bei exit 1 die volle Pipeline zu fahren.
 *
 * Force-Refresh: Coolify-Build-Arg WAHL_REFRESH=true setzen, läuft 1× durch,
 * danach Env-Var wieder entfernen.
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { getDb, closeDb } from '../src/lib/server/db/index.js';

const MIN_WAHLEN = 20;
const MIN_ERGEBNIS_PER_WAHL = 100;
// Kiez-Aggregat-Threshold bewusst niedrig: nicht alle Wahlen haben
// Kiez-Aggregat (pre-2017 ohne Geometrie + alt-Format-DBs).
const MIN_KIEZ_AGGREGAT = 1000;

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
		const ergebnisCount = await db.execute<{ count: number }>(
			sql`SELECT count(*)::int AS count FROM ergebnis`
		);
		const kiezCount = await db.execute<{ count: number }>(
			sql`SELECT count(*)::int AS count FROM wahl_aggregat_kiez`
		);
		const minPerWahl = await db.execute<{ min: number }>(
			sql`SELECT COALESCE(MIN(c), 0)::int AS min FROM (SELECT count(*) AS c FROM ergebnis GROUP BY wahl_id) sub`
		);

		const w = wahlCount[0]?.count ?? 0;
		const e = ergebnisCount[0]?.count ?? 0;
		const k = kiezCount[0]?.count ?? 0;
		const m = minPerWahl[0]?.min ?? 0;

		console.log(
			`[wahl-check] state: wahlen=${w} ergebnis=${e} kiez-aggregat=${k} min-per-wahl=${m}`
		);

		const ok = w >= MIN_WAHLEN && m >= MIN_ERGEBNIS_PER_WAHL && k >= MIN_KIEZ_AGGREGAT;

		if (ok) {
			console.log('[wahl-check] DB complete · skipping wahl-fetch/wahl-geo/wahl-kiez');
			process.exit(0);
		}
		console.log(
			`[wahl-check] DB incomplete (need wahlen>=${MIN_WAHLEN}, min-per-wahl>=${MIN_ERGEBNIS_PER_WAHL}, kiez>=${MIN_KIEZ_AGGREGAT}) · refreshing`
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
