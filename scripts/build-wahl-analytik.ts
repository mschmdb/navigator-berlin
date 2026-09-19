/**
 * Build-Zeit-Aggregat für Wahl-Analytik (Wechsel, Trend, Volatilität) pro
 * Kiez und Wahl-Reihe (typ × stimmtyp). Nutzt den pure Rechenkern aus
 * `src/lib/server/wahl/analytik.ts` gegen `wahl_aggregat_kiez` (Story
 * 6.2-Nachfolger) und schreibt nach `wahl_analytik_kiez` + `wahl_trend_kiez`
 * (ADR-013: Build-Time-Cache, kein Live-Rechenpfad).
 *
 * Delete-per-Reihe + INSERT, analog `build-wahl-kiez-aggregat.ts`.
 * `--only=<typ>` beschränkt auf eine Wahl-Art (btw|agh|bvv), da eine
 * „Reihe" hier typ+stimmtyp ist, nicht ein einzelnes Wahljahr.
 */
import 'dotenv/config';
import { eq, and, inArray } from 'drizzle-orm';
import { closeDb, getDb } from '../src/lib/server/db/index.js';
import {
	wahl as wahlTable,
	wahlAggregatKiez,
	wahlAnalytikKiez,
	wahlTrendKiez,
	partei
} from '../src/lib/server/db/schema/index.js';
import {
	computeWechsel,
	computeTrendSlope,
	computeVolatilitaet
} from '../src/lib/server/wahl/analytik.js';
import type { SeriesEntry } from '../src/lib/server/wahl/analytik.js';

type WahlTyp = 'btw' | 'agh' | 'bvv';
type Stimmtyp = 'erststimme' | 'zweitstimme' | 'einstimme';
type Reihe = { typ: WahlTyp; stimmtyp: Stimmtyp };

const REIHEN: Reihe[] = [
	{ typ: 'btw', stimmtyp: 'erststimme' },
	{ typ: 'btw', stimmtyp: 'zweitstimme' },
	{ typ: 'agh', stimmtyp: 'erststimme' },
	{ typ: 'agh', stimmtyp: 'zweitstimme' },
	{ typ: 'bvv', stimmtyp: 'einstimme' }
];

async function processReihe(reihe: Reihe): Promise<void> {
	const db = getDb();

	const wahlenInReihe = await db
		.select({
			id: wahlTable.id,
			jahr: wahlTable.jahr,
			isRepeatElection: wahlTable.isRepeatElection,
			parentElectionId: wahlTable.parentElectionId
		})
		.from(wahlTable)
		.where(and(eq(wahlTable.typ, reihe.typ), eq(wahlTable.stimmtyp, reihe.stimmtyp)));

	if (wahlenInReihe.length === 0) {
		console.log(`[wahl-analytik] ${reihe.typ}/${reihe.stimmtyp} keine Wahlen in DB, skip`);
		return;
	}

	const jahrById = new Map(wahlenInReihe.map((w) => [w.id, w.jahr]));
	const wahlIds = wahlenInReihe.map((w) => w.id);

	const rows = await db
		.select({
			wahlId: wahlAggregatKiez.wahlId,
			kiezSlug: wahlAggregatKiez.kiezSlug,
			parteiId: wahlAggregatKiez.parteiId,
			parteiKurzname: partei.kurzname,
			anteil: wahlAggregatKiez.anteil
		})
		.from(wahlAggregatKiez)
		.innerJoin(partei, eq(partei.id, wahlAggregatKiez.parteiId))
		.where(inArray(wahlAggregatKiez.wahlId, wahlIds));

	if (rows.length === 0) {
		console.log(`[wahl-analytik] ${reihe.typ}/${reihe.stimmtyp} keine Kiez-Aggregat-Rows, skip`);
		return;
	}

	const parteiIdByKurzname = new Map<string, number>();
	const byKiez = new Map<string, Map<number, Map<string, number>>>();
	for (const r of rows) {
		parteiIdByKurzname.set(r.parteiKurzname, r.parteiId);
		let byWahl = byKiez.get(r.kiezSlug);
		if (!byWahl) {
			byWahl = new Map();
			byKiez.set(r.kiezSlug, byWahl);
		}
		let shares = byWahl.get(r.wahlId);
		if (!shares) {
			shares = new Map();
			byWahl.set(r.wahlId, shares);
		}
		shares.set(r.parteiKurzname, r.anteil);
	}

	const analytikRows: (typeof wahlAnalytikKiez.$inferInsert)[] = [];
	const trendRows: (typeof wahlTrendKiez.$inferInsert)[] = [];

	for (const [kiezSlug, byWahl] of byKiez) {
		const points: SeriesEntry[] = [...byWahl.entries()]
			.map(([wahlId, shares]) => {
				const meta = wahlenInReihe.find((w) => w.id === wahlId);
				const parentJahr =
					meta?.isRepeatElection && meta.parentElectionId
						? (jahrById.get(meta.parentElectionId) ?? null)
						: null;
				return {
					jahr: jahrById.get(wahlId) as number,
					isRepeatElection: meta?.isRepeatElection ?? false,
					parentJahr,
					shares
				};
			})
			.sort((a, b) => a.jahr - b.jahr);

		const { wechselCount, wechselJahre } = computeWechsel(points);
		const volatilitaet = computeVolatilitaet(points);

		analytikRows.push({
			kiezSlug,
			typ: reihe.typ,
			stimmtyp: reihe.stimmtyp,
			wechselCount,
			wechselJahre: [...wechselJahre],
			volatilitaet,
			computedAt: new Date()
		});

		const parteienInKiez = new Set<string>();
		for (const p of points) for (const k of p.shares.keys()) parteienInKiez.add(k);

		for (const parteiKurzname of parteienInKiez) {
			const parteiId = parteiIdByKurzname.get(parteiKurzname);
			if (!parteiId) continue;
			trendRows.push({
				kiezSlug,
				typ: reihe.typ,
				stimmtyp: reihe.stimmtyp,
				parteiId,
				slope: computeTrendSlope(points, parteiKurzname),
				computedAt: new Date()
			});
		}
	}

	// Transaktion: ein Absturz zwischen Delete und Insert darf keine leere
	// oder halbe Reihe hinterlassen (das Gate prüft nur die Gesamt-Zeilenzahl).
	await db.transaction(async (tx) => {
		await tx
			.delete(wahlAnalytikKiez)
			.where(
				and(eq(wahlAnalytikKiez.typ, reihe.typ), eq(wahlAnalytikKiez.stimmtyp, reihe.stimmtyp))
			);
		await tx
			.delete(wahlTrendKiez)
			.where(and(eq(wahlTrendKiez.typ, reihe.typ), eq(wahlTrendKiez.stimmtyp, reihe.stimmtyp)));

		if (analytikRows.length > 0) await tx.insert(wahlAnalytikKiez).values(analytikRows);
		if (trendRows.length > 0) await tx.insert(wahlTrendKiez).values(trendRows);
	});

	console.log(
		`[wahl-analytik] ${reihe.typ}/${reihe.stimmtyp} kieze=${analytikRows.length} trend-rows=${trendRows.length}`
	);
}

function parseArgs(argv: readonly string[]): { only?: WahlTyp } {
	for (const arg of argv) {
		if (arg.startsWith('--only=')) return { only: arg.slice('--only='.length) as WahlTyp };
	}
	return {};
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	if (args.only && !REIHEN.some((r) => r.typ === args.only)) {
		throw new Error(`[wahl-analytik] unbekannter --only-Wert: ${args.only} (btw|agh|bvv)`);
	}
	const reihen = args.only ? REIHEN.filter((r) => r.typ === args.only) : REIHEN;

	try {
		for (const reihe of reihen) {
			await processReihe(reihe);
		}
	} finally {
		await closeDb();
	}
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
