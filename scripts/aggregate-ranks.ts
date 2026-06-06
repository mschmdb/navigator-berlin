/**
 * scripts/aggregate-ranks.ts (Story 11.0).
 *
 * Build-Step: liest `kiez_score`/`bezirk_score` (Dimensionen) + `kiez_stats`/
 * `bezirk_stats` (numerische Metriken) aus Postgres, berechnet pro Metrik Rang +
 * Quartil über das jeweilige Feld (143 Kieze, 12 Bezirke) und schreibt nach
 * `kiez_rank`/`bezirk_rank` (TRUNCATE+Insert, idempotent).
 *
 * Run: `pnpm data:rank` (nach `data:aggregate-scores` + `data:aggregate`).
 *
 * Rang 1 = bester Wert je Metrik-Richtung. Score-Dimensionen + Amenity-Counts
 * sind `higher-better`, Hitze (PET) ist `lower-better`. Anti-Stigma (ADR-015):
 * Quartil rang-basiert, Render zeigt Quartil statt letztem Rang bei schwachen Werten.
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { closeDb, getDb } from '../src/lib/server/db/index.js';
import {
	kiezScore,
	bezirkScore,
	kiezStats,
	bezirkStats,
	kiezRank,
	bezirkRank
} from '../src/lib/server/db/schema/index.js';
import { rankBy, type RankDirection, type RankInput } from './lib/ranking/ranking.js';
import type {
	GruenAggregat,
	OepnvAggregat,
	BildungAggregat,
	KlimaAggregat,
	HeritageAggregat
} from '../src/lib/server/db/schema/aggregate-types.js';

interface MetricSpec {
	readonly key: string;
	readonly direction: RankDirection;
	readonly pick: (row: ScoreStatsRow) => number | null;
}

interface ScoreStatsRow {
	readonly slug: string;
	readonly composite: number | null;
	readonly ruheLuft: number | null;
	readonly gruenHitze: number | null;
	readonly mobilitaet: number | null;
	readonly versorgung: number | null;
	readonly wohnschutz: number | null;
	readonly gruen: GruenAggregat | null;
	readonly oepnv: OepnvAggregat | null;
	readonly bildung: BildungAggregat | null;
	readonly klima: KlimaAggregat | null;
	readonly heritage: HeritageAggregat | null;
}

function av(value: { value: number } | null | undefined): number | null {
	return value && typeof value.value === 'number' ? value.value : null;
}

const METRICS: readonly MetricSpec[] = [
	{ key: 'composite', direction: 'higher-better', pick: (r) => r.composite },
	{ key: 'ruheLuft', direction: 'higher-better', pick: (r) => r.ruheLuft },
	{ key: 'gruenHitze', direction: 'higher-better', pick: (r) => r.gruenHitze },
	{ key: 'mobilitaet', direction: 'higher-better', pick: (r) => r.mobilitaet },
	{ key: 'versorgung', direction: 'higher-better', pick: (r) => r.versorgung },
	{ key: 'wohnschutz', direction: 'higher-better', pick: (r) => r.wohnschutz },
	{ key: 'gruenanlagenCount', direction: 'higher-better', pick: (r) => av(r.gruen?.gruenanlagenCount) },
	{ key: 'spielplaetzeCount', direction: 'higher-better', pick: (r) => av(r.gruen?.spielplaetzeCount) },
	{ key: 'stopsPerKm2', direction: 'higher-better', pick: (r) => av(r.oepnv?.stopsPerKm2) },
	{ key: 'kitasPerKm2', direction: 'higher-better', pick: (r) => av(r.bildung?.kitasPerKm2) },
	{ key: 'schulenPerKm2', direction: 'higher-better', pick: (r) => av(r.bildung?.schulenPerKm2) },
	{ key: 'meanPet', direction: 'lower-better', pick: (r) => av(r.klima?.meanPet) },
	{ key: 'denkmalPerKm2', direction: 'higher-better', pick: (r) => av(r.heritage?.denkmalPerKm2) },
	{
		key: 'stolpersteinePerKm2',
		direction: 'higher-better',
		pick: (r) => av(r.heritage?.stolpersteinePerKm2)
	}
];

interface RankRow {
	readonly slug: string;
	readonly metricKey: string;
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
}

function computeRanks(rows: readonly ScoreStatsRow[]): RankRow[] {
	const out: RankRow[] = [];
	for (const metric of METRICS) {
		const inputs: RankInput[] = rows.map((r) => ({ slug: r.slug, value: metric.pick(r) }));
		const ranked = rankBy(inputs, metric.direction);
		for (const r of ranked) {
			out.push({
				slug: r.slug,
				metricKey: metric.key,
				rang: r.rang,
				quartil: r.quartil,
				total: r.total
			});
		}
	}
	return out;
}

async function loadKiezRows(): Promise<ScoreStatsRow[]> {
	const db = getDb();
	const scores = await db
		.select({
			slug: kiezScore.slug,
			composite: kiezScore.composite,
			ruheLuft: kiezScore.ruheLuft,
			gruenHitze: kiezScore.gruenHitze,
			mobilitaet: kiezScore.mobilitaet,
			versorgung: kiezScore.versorgung,
			wohnschutz: kiezScore.wohnschutz
		})
		.from(kiezScore);
	const stats = await db
		.select({
			slug: kiezStats.slug,
			gruen: kiezStats.gruen,
			oepnv: kiezStats.oepnv,
			bildung: kiezStats.bildung,
			klima: kiezStats.klima,
			heritage: kiezStats.heritage
		})
		.from(kiezStats);
	return joinScoreStats(scores, stats);
}

async function loadBezirkRows(): Promise<ScoreStatsRow[]> {
	const db = getDb();
	const scores = await db
		.select({
			slug: bezirkScore.slug,
			composite: bezirkScore.composite,
			ruheLuft: bezirkScore.ruheLuft,
			gruenHitze: bezirkScore.gruenHitze,
			mobilitaet: bezirkScore.mobilitaet,
			versorgung: bezirkScore.versorgung,
			wohnschutz: bezirkScore.wohnschutz
		})
		.from(bezirkScore);
	const stats = await db
		.select({
			slug: bezirkStats.slug,
			gruen: bezirkStats.gruen,
			oepnv: bezirkStats.oepnv,
			bildung: bezirkStats.bildung,
			klima: bezirkStats.klima,
			heritage: bezirkStats.heritage
		})
		.from(bezirkStats);
	return joinScoreStats(scores, stats);
}

type ScoreSel = {
	slug: string;
	composite: number | null;
	ruheLuft: number | null;
	gruenHitze: number | null;
	mobilitaet: number | null;
	versorgung: number | null;
	wohnschutz: number | null;
};
type StatsSel = {
	slug: string;
	gruen: GruenAggregat;
	oepnv: OepnvAggregat;
	bildung: BildungAggregat;
	klima: KlimaAggregat;
	heritage: HeritageAggregat;
};

function joinScoreStats(scores: ScoreSel[], stats: StatsSel[]): ScoreStatsRow[] {
	const statsBySlug = new Map(stats.map((s) => [s.slug, s]));
	return scores.map((s) => {
		const st = statsBySlug.get(s.slug);
		return {
			...s,
			gruen: st?.gruen ?? null,
			oepnv: st?.oepnv ?? null,
			bildung: st?.bildung ?? null,
			klima: st?.klima ?? null,
			heritage: st?.heritage ?? null
		};
	});
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[aggregate-ranks] DATABASE_URL fehlt — abort.\n');
		process.exit(1);
	}
	const db = getDb();
	process.stdout.write('[aggregate-ranks] Loading score + stats rows ...\n');
	const [kiezRows, bezirkRows] = await Promise.all([loadKiezRows(), loadBezirkRows()]);

	const kiezRankRows = computeRanks(kiezRows);
	const bezirkRankRows = computeRanks(bezirkRows);
	process.stdout.write(
		`[aggregate-ranks] kiez=${kiezRows.length} rows → ${kiezRankRows.length} rank-entries; ` +
			`bezirk=${bezirkRows.length} rows → ${bezirkRankRows.length} rank-entries\n`
	);

	await db.execute(sql`TRUNCATE TABLE ${kiezRank}`);
	await db.execute(sql`TRUNCATE TABLE ${bezirkRank}`);
	if (kiezRankRows.length > 0) await db.insert(kiezRank).values(kiezRankRows);
	if (bezirkRankRows.length > 0) await db.insert(bezirkRank).values(bezirkRankRows);

	process.stdout.write('[aggregate-ranks] Done.\n');
	await closeDb();
}

main().catch(async (err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[aggregate-ranks] FATAL: ${msg}\n`);
	await closeDb().catch(() => undefined);
	process.exit(1);
});

export { computeRanks, METRICS, type ScoreStatsRow };
