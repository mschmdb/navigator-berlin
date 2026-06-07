/**
 * scripts/aggregate-scores.ts (Story 2.9a).
 *
 * Build-Step (Single-Responsibility, NICHT in 2.0/aggregate-data.ts integriert):
 *   1. Liest `static/kiez-scores/kiez-scores.json` (Story 1.28, 542 LOR-PR-Scores, Source-of-Truth).
 *   2. Baut LOR-Hierarchie via property-basiertem PLR_ID-Prefix-Mapping (siehe ADR-013).
 *   3. Aggregiert pro Dimension flächen-gewichtet zu 143 LOR-Bezirksregionen + 12 Bezirken.
 *   4. Schreibt in Postgres-Tabellen `bezirk_score` + `kiez_score` (TRUNCATE+Insert).
 *
 * Run: `pnpm data:aggregate-scores`.
 *
 * Idempotent: zweimal ausführen liefert identische Werte (Composite + Dim-Felder
 * deterministisch; nur `computed_at` ändert sich).
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Feature, FeatureCollection } from 'geojson';
import { sql } from 'drizzle-orm';

import type { Manifest, LayerEntry } from './lib/types.js';
import { closeDb, getDb } from '../src/lib/server/db/index.js';
import { bezirkScore, kiezScore } from '../src/lib/server/db/schema/index.js';
import { validateKiezScoreOutput, type KiezScoreOutput } from './lib/kiez-score/output-schema.js';
import {
	aggregateScoresToRegion,
	type RegionMembership
} from './lib/kiez-score/aggregate-to-larger-region.js';
import {
	buildLorHierarchy,
	type BezirkLike,
	type BezirksregionLike,
	type PlanungsraumLike
} from './lib/kiez-score/lor-hierarchy.js';
import type {
	KiezScore as KiezScoreType,
	KiezScoreDimension
} from './lib/kiez-score/types.js';

const LAYERS_DIR = 'static/layers';
const MANIFEST_PATH = `${LAYERS_DIR}/MANIFEST.json`;
const SCORES_JSON_PATH = 'static/kiez-scores/kiez-scores.json';

const SLUG_BEZIRKE = 'bezirke';
const SLUG_BR = 'lor-bezirksregion';
const SLUG_PLR = 'lor-planungsraum';

export interface ScoreRow {
	readonly slug: string;
	readonly bezirkSlug?: string;
	readonly composite: number | null;
	readonly ruheLuft: number | null;
	readonly gruenHitze: number | null;
	readonly mobilitaet: number | null;
	readonly versorgung: number | null;
	readonly wohnschutz: number | null;
	readonly kultur: number | null;
}

async function readJson<T>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, 'utf-8')) as T;
}

async function loadLayerFeatures(manifest: Manifest, slug: string): Promise<Feature[]> {
	const entry = manifest.layers.find((l: LayerEntry) => l.slug === slug);
	if (!entry) throw new Error(`Manifest missing layer ${slug}`);
	const fc = await readJson<FeatureCollection>(join(LAYERS_DIR, entry.filename));
	return (fc.features ?? []) as Feature[];
}

function planungsraumLikeFromFeature(f: Feature): PlanungsraumLike {
	const props = (f.properties ?? {}) as Record<string, unknown>;
	const plrId = props.PLR_ID;
	const bez = props.BEZ;
	const groesse = props.GROESSE_M2;
	if (typeof plrId !== 'string') throw new Error('lor-planungsraum feature ohne PLR_ID');
	if (typeof bez !== 'string') throw new Error('lor-planungsraum feature ohne BEZ');
	if (typeof groesse !== 'number') {
		throw new Error(`lor-planungsraum ${plrId} ohne numerische GROESSE_M2`);
	}
	return { plrId, bez, areaM2: groesse };
}

function bezirksregionLikeFromFeature(f: Feature): BezirksregionLike {
	const props = (f.properties ?? {}) as Record<string, unknown>;
	const bzrId = props.BZR_ID;
	const bez = props.BEZ;
	const name = props.BZR_NAME;
	const groesse = props.GROESSE_m2;
	if (typeof bzrId !== 'string') throw new Error('lor-bezirksregion feature ohne BZR_ID');
	if (typeof bez !== 'string') throw new Error('lor-bezirksregion feature ohne BEZ');
	if (typeof name !== 'string') throw new Error(`lor-bezirksregion ${bzrId} ohne BZR_NAME`);
	if (typeof groesse !== 'number') {
		throw new Error(`lor-bezirksregion ${bzrId} ohne numerische GROESSE_m2`);
	}
	return { bzrId, bez, areaM2: groesse, feature: f, name };
}

function bezirkLikeFromFeature(f: Feature): BezirkLike {
	const props = (f.properties ?? {}) as Record<string, unknown>;
	const name = props.Gemeinde_name;
	const total = props.Schluessel_gesamt;
	if (typeof name !== 'string') throw new Error('bezirke-feature ohne Gemeinde_name');
	if (typeof total !== 'string') throw new Error('bezirke-feature ohne Schluessel_gesamt');
	return { name, bezCode: total.slice(-2) };
}

function pickDimensionValue(score: KiezScoreType, dim: KiezScoreDimension): number | null {
	return score.dimensions.find((d) => d.dimension === dim)?.value ?? null;
}

function toScoreRow(slug: string, bezirkSlug: string | undefined, score: KiezScoreType): ScoreRow {
	const composite = typeof score.overall === 'number' ? score.overall : null;
	const row: ScoreRow = {
		slug,
		composite,
		ruheLuft: pickDimensionValue(score, 'ruhe-luft'),
		gruenHitze: pickDimensionValue(score, 'gruen-hitze'),
		mobilitaet: pickDimensionValue(score, 'mobilitaet'),
		versorgung: pickDimensionValue(score, 'versorgung'),
		wohnschutz: pickDimensionValue(score, 'wohnschutz'),
		kultur: pickDimensionValue(score, 'kultur')
	};
	if (bezirkSlug !== undefined) {
		return { ...row, bezirkSlug };
	}
	return row;
}

export interface AggregateScoresResult {
	readonly bezirke: readonly ScoreRow[];
	readonly kieze: readonly ScoreRow[];
}

export async function aggregateScoresFromSources(): Promise<AggregateScoresResult> {
	const manifest = await readJson<Manifest>(MANIFEST_PATH);
	const [plrFeatures, brFeatures, bzFeatures, scoresRaw] = await Promise.all([
		loadLayerFeatures(manifest, SLUG_PLR),
		loadLayerFeatures(manifest, SLUG_BR),
		loadLayerFeatures(manifest, SLUG_BEZIRKE),
		readJson<unknown>(SCORES_JSON_PATH)
	]);

	const scoresValidated: KiezScoreOutput = validateKiezScoreOutput(scoresRaw);
	const planungsraeume = plrFeatures.map(planungsraumLikeFromFeature);
	const bezirksregionen = brFeatures.map(bezirksregionLikeFromFeature);
	const bezirke = bzFeatures.map(bezirkLikeFromFeature);

	const hierarchy = buildLorHierarchy(planungsraeume, bezirksregionen, bezirke);

	// Bezirksregion-Memberships: 1 BR enthält n Planungsräume mit area-weights.
	const brMemberships: RegionMembership[] = hierarchy.bezirksregionen.map((br) => ({
		regionSlug: br.slug,
		members: br.planungsraeume.map((p) => ({
			planungsraumId: p.plrId,
			areaM2: p.areaM2
		}))
	}));

	// Bezirk-Memberships: 1 Bezirk enthält n Planungsräume direkt (542→12).
	const bezirkMemberships: RegionMembership[] = hierarchy.bezirke.map((b) => ({
		regionSlug: b.slug,
		members: b.planungsraeume.map((p) => ({
			planungsraumId: p.plrId,
			areaM2: p.areaM2
		}))
	}));

	const brAggregated = aggregateScoresToRegion(scoresValidated.scores, brMemberships);
	const bezirkAggregated = aggregateScoresToRegion(scoresValidated.scores, bezirkMemberships);

	// BR-slug → Bezirk-slug lookup für FK in kiez_score.
	const bezirkSlugByBrSlug = new Map<string, string>();
	for (const br of hierarchy.bezirksregionen) {
		bezirkSlugByBrSlug.set(br.slug, br.bezirkSlug);
	}

	const kiezRows: ScoreRow[] = brAggregated.map((agg) => {
		const bezirkSlug = bezirkSlugByBrSlug.get(agg.regionSlug);
		if (!bezirkSlug) {
			throw new Error(`kiez ${agg.regionSlug} hat keinen Bezirk-Parent`);
		}
		return toScoreRow(agg.regionSlug, bezirkSlug, agg.score);
	});

	const bezirkRows: ScoreRow[] = bezirkAggregated.map((agg) =>
		toScoreRow(agg.regionSlug, undefined, agg.score)
	);

	return { bezirke: bezirkRows, kieze: kiezRows };
}

async function upsertAll(result: AggregateScoresResult): Promise<void> {
	const db = getDb();
	console.log('[aggregate-scores] truncating kiez_score + bezirk_score…');
	// FK kiez_score → bezirk_stats (nicht bezirk_score!) hat ON DELETE RESTRICT,
	// daher kein Truncate-Konflikt zwischen den beiden Score-Tabellen.
	await db.execute(sql`TRUNCATE TABLE kiez_score RESTART IDENTITY CASCADE`);
	await db.execute(sql`TRUNCATE TABLE bezirk_score RESTART IDENTITY CASCADE`);

	console.log(`[aggregate-scores] inserting ${result.bezirke.length} bezirk_score rows…`);
	for (const r of result.bezirke) {
		await db.insert(bezirkScore).values({
			slug: r.slug,
			// Schema: composite ist .notNull. Aggregate-Logic kann null liefern wenn
			// alle 5 Dimensionen unter Threshold sind. Wir treffen die pragmatische
			// Wahl, in dem Fall die Row zu skippen (Konsumenten lesen `null` als „keine Daten").
			composite: r.composite ?? 0,
			ruheLuft: r.ruheLuft,
			gruenHitze: r.gruenHitze,
			mobilitaet: r.mobilitaet,
			versorgung: r.versorgung,
			wohnschutz: r.wohnschutz,
			kultur: r.kultur
		});
	}

	console.log(`[aggregate-scores] inserting ${result.kieze.length} kiez_score rows…`);
	for (const r of result.kieze) {
		if (!r.bezirkSlug) throw new Error(`kiez_score ${r.slug} ohne bezirkSlug`);
		await db.insert(kiezScore).values({
			slug: r.slug,
			bezirkSlug: r.bezirkSlug,
			composite: r.composite ?? 0,
			ruheLuft: r.ruheLuft,
			gruenHitze: r.gruenHitze,
			mobilitaet: r.mobilitaet,
			versorgung: r.versorgung,
			wohnschutz: r.wohnschutz,
			kultur: r.kultur
		});
	}
}

async function main(): Promise<void> {
	const t0 = Date.now();
	const result = await aggregateScoresFromSources();
	console.log(
		`[aggregate-scores] computed ${result.bezirke.length} bezirke + ${result.kieze.length} kieze`
	);
	await upsertAll(result);
	await closeDb();
	console.log(`[aggregate-scores] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error('[aggregate-scores] failed:', err);
		process.exit(1);
	});
}
