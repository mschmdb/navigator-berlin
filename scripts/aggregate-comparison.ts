/**
 * scripts/aggregate-comparison.ts (Story 11.4).
 *
 * Build-Step: berechnet pro Score-Metrik den Eltern-Bezirks-Schnitt (Mittel der
 * Kieze im Bezirk) und den Berlin-Median und schreibt sie nach `kiez_comparison`
 * + `bezirk_comparison` (TRUNCATE+Insert, idempotent).
 *
 * Run: `pnpm data:comparison` (nach `data:aggregate-scores`).
 *
 * Nur numerische Score-Metriken (Composite + 5 Dimensionen); kategoriale Cluster
 * (Lärm-Klasse etc.) haben keinen Mittelwert. Liefert Input für Steckbrief-
 * Vergleich (11.4) und FAQ (11.3).
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { closeDb, getDb } from '../src/lib/server/db/index.js';
import {
	kiezScore,
	bezirkScore,
	kiezComparison,
	bezirkComparison
} from '../src/lib/server/db/schema/index.js';
import { mean, median } from './lib/comparison/comparison.js';

const METRIC_KEYS = [
	'composite',
	'ruheLuft',
	'gruenHitze',
	'mobilitaet',
	'versorgung',
	'wohnschutz',
	'kultur'
] as const;
type MetricKey = (typeof METRIC_KEYS)[number];

interface ScoreRow {
	readonly slug: string;
	readonly bezirkSlug: string;
	readonly composite: number | null;
	readonly ruheLuft: number | null;
	readonly gruenHitze: number | null;
	readonly mobilitaet: number | null;
	readonly versorgung: number | null;
	readonly wohnschutz: number | null;
	readonly kultur: number | null;
}

function valueOf(row: { [k in MetricKey]: number | null }, key: MetricKey): number | null {
	return row[key];
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[aggregate-comparison] DATABASE_URL fehlt — abort.\n');
		process.exit(1);
	}
	const db = getDb();

	const kiezRows = (await db
		.select({
			slug: kiezScore.slug,
			bezirkSlug: kiezScore.bezirkSlug,
			composite: kiezScore.composite,
			ruheLuft: kiezScore.ruheLuft,
			gruenHitze: kiezScore.gruenHitze,
			mobilitaet: kiezScore.mobilitaet,
			versorgung: kiezScore.versorgung,
			wohnschutz: kiezScore.wohnschutz,
			kultur: kiezScore.kultur
		})
		.from(kiezScore)) as ScoreRow[];

	const bezirkRows = (await db
		.select({
			slug: bezirkScore.slug,
			bezirkSlug: bezirkScore.slug,
			composite: bezirkScore.composite,
			ruheLuft: bezirkScore.ruheLuft,
			gruenHitze: bezirkScore.gruenHitze,
			mobilitaet: bezirkScore.mobilitaet,
			versorgung: bezirkScore.versorgung,
			wohnschutz: bezirkScore.wohnschutz,
			kultur: bezirkScore.kultur
		})
		.from(bezirkScore)) as ScoreRow[];

	// Berlin-Median je Metrik (über alle Kieze) + Bezirks-Schnitt je (bezirk, metrik).
	const kiezComparisonRows: (typeof kiezComparison.$inferInsert)[] = [];
	const bezirkComparisonRows: (typeof bezirkComparison.$inferInsert)[] = [];

	for (const key of METRIC_KEYS) {
		const berlinMedianKiez = median(kiezRows.map((r) => valueOf(r, key)));
		const berlinMedianBezirk = median(bezirkRows.map((r) => valueOf(r, key)));

		const bezirkMeanBySlug = new Map<string, number | null>();
		const bySlug = new Map<string, number[]>();
		for (const r of kiezRows) {
			const v = valueOf(r, key);
			if (v === null) continue;
			const arr = bySlug.get(r.bezirkSlug) ?? [];
			arr.push(v);
			bySlug.set(r.bezirkSlug, arr);
		}
		for (const [bezirkSlug, arr] of bySlug) bezirkMeanBySlug.set(bezirkSlug, mean(arr));

		for (const r of kiezRows) {
			kiezComparisonRows.push({
				slug: r.slug,
				metricKey: key,
				kiezValue: valueOf(r, key),
				bezirkMean: bezirkMeanBySlug.get(r.bezirkSlug) ?? null,
				berlinMedian: berlinMedianKiez
			});
		}
		for (const r of bezirkRows) {
			bezirkComparisonRows.push({
				slug: r.slug,
				metricKey: key,
				bezirkValue: valueOf(r, key),
				berlinMedian: berlinMedianBezirk
			});
		}
	}

	process.stdout.write(
		`[aggregate-comparison] kiez=${kiezComparisonRows.length} bezirk=${bezirkComparisonRows.length} rows\n`
	);
	await db.execute(sql`TRUNCATE TABLE ${kiezComparison}`);
	await db.execute(sql`TRUNCATE TABLE ${bezirkComparison}`);
	if (kiezComparisonRows.length > 0) await db.insert(kiezComparison).values(kiezComparisonRows);
	if (bezirkComparisonRows.length > 0)
		await db.insert(bezirkComparison).values(bezirkComparisonRows);

	process.stdout.write('[aggregate-comparison] Done.\n');
	await closeDb();
}

main().catch(async (err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[aggregate-comparison] FATAL: ${msg}\n`);
	await closeDb().catch(() => undefined);
	process.exit(1);
});
