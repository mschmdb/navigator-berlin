/**
 * scripts/build-layer-aggregates.ts (Story 8.2a).
 *
 * Build-Time-Pre-Aggregation: pro aggregierbarem Inspector-Layer × {kiez, bezirk, berlin}
 * die Aggregate aus den Source-GeoJSONs rechnen, deterministisch nach
 * `static/layer-aggregates/layer-aggregates.json` schreiben (ADR-014 Abschnitt 8).
 *
 * Run: `pnpm data:layer-aggregate`. Idempotent (außer `generatedAt`).
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Feature, FeatureCollection } from 'geojson';
import type { Manifest, LayerEntry } from './lib/types.js';
import {
	buildLorHierarchy,
	type BezirkLike,
	type BezirksregionLike,
	type PlanungsraumLike
} from './lib/kiez-score/lor-hierarchy.js';
import { buildSpatialTargets } from './lib/layer-aggregate/member-assignment.js';
import { computeLayerEntry, type ComputeContext } from './lib/layer-aggregate/compute.js';
import { getLayerStrategy, isPrecomputed } from './lib/layer-aggregate/strategy.js';
import type { LayerAggregateEntry, LayerAggregatesFile } from './lib/layer-aggregate/types.js';

const LAYERS_DIR = 'static/layers';
const MANIFEST_PATH = `${LAYERS_DIR}/MANIFEST.json`;
const OUTPUT_PATH = 'static/layer-aggregates/layer-aggregates.json';

const SLUG_BEZIRKE = 'bezirke';
const SLUG_BR = 'lor-bezirksregion';
const SLUG_PLR = 'lor-planungsraum';

async function readJson<T>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, 'utf-8')) as T;
}

async function loadFeatures(manifest: Manifest, slug: string): Promise<Feature[]> {
	const entry = manifest.layers.find((l: LayerEntry) => l.slug === slug);
	if (!entry) throw new Error(`Manifest missing layer ${slug}`);
	const fc = await readJson<FeatureCollection>(join(LAYERS_DIR, entry.filename));
	return (fc.features ?? []) as Feature[];
}

function plrLike(f: Feature): PlanungsraumLike {
	const p = (f.properties ?? {}) as Record<string, unknown>;
	if (typeof p.PLR_ID !== 'string') throw new Error('lor-planungsraum ohne PLR_ID');
	if (typeof p.BEZ !== 'string') throw new Error('lor-planungsraum ohne BEZ');
	if (typeof p.GROESSE_M2 !== 'number') throw new Error(`PLR ${p.PLR_ID} ohne GROESSE_M2`);
	return { plrId: p.PLR_ID, bez: p.BEZ, areaM2: p.GROESSE_M2 };
}

function brLike(f: Feature): BezirksregionLike {
	const p = (f.properties ?? {}) as Record<string, unknown>;
	if (typeof p.BZR_ID !== 'string') throw new Error('lor-bezirksregion ohne BZR_ID');
	if (typeof p.BEZ !== 'string') throw new Error('lor-bezirksregion ohne BEZ');
	if (typeof p.BZR_NAME !== 'string') throw new Error(`BR ${p.BZR_ID} ohne BZR_NAME`);
	if (typeof p.GROESSE_m2 !== 'number') throw new Error(`BR ${p.BZR_ID} ohne GROESSE_m2`);
	return { bzrId: p.BZR_ID, bez: p.BEZ, areaM2: p.GROESSE_m2, feature: f, name: p.BZR_NAME };
}

function bezLike(f: Feature): BezirkLike {
	const p = (f.properties ?? {}) as Record<string, unknown>;
	if (typeof p.Gemeinde_name !== 'string') throw new Error('bezirke ohne Gemeinde_name');
	if (typeof p.Schluessel_gesamt !== 'string') throw new Error('bezirke ohne Schluessel_gesamt');
	return { name: p.Gemeinde_name, bezCode: p.Schluessel_gesamt.slice(-2) };
}

export interface BuildResult {
	readonly aggregates: Record<string, LayerAggregateEntry>;
	readonly skipped: readonly string[];
}

export async function buildLayerAggregates(): Promise<BuildResult> {
	const manifest = await readJson<Manifest>(MANIFEST_PATH);
	const [plrF, brF, bezF] = await Promise.all([
		loadFeatures(manifest, SLUG_PLR),
		loadFeatures(manifest, SLUG_BR),
		loadFeatures(manifest, SLUG_BEZIRKE)
	]);

	const hierarchy = buildLorHierarchy(plrF.map(plrLike), brF.map(brLike), bezF.map(bezLike));
	const targets = buildSpatialTargets(brF, bezF, hierarchy);
	const ctx: ComputeContext = { hierarchy, targets };

	const aggregates: Record<string, LayerAggregateEntry> = {};
	const skipped: string[] = [];

	// Deterministische Layer-Reihenfolge.
	const layers = [...manifest.layers].sort((a, b) => a.slug.localeCompare(b.slug, 'de'));
	for (const layer of layers) {
		const strategy = getLayerStrategy(layer.slug, layer.geometryType);
		if (!isPrecomputed(strategy)) {
			skipped.push(layer.slug);
			continue;
		}
		const source = await loadFeatures(manifest, layer.slug);
		console.log(`[layer-aggregate] ${layer.slug} (${strategy.type}, ${source.length} feat)…`);
		aggregates[layer.slug] = computeLayerEntry(strategy, source, ctx);
	}

	return { aggregates, skipped };
}

async function main(): Promise<void> {
	const t0 = Date.now();
	const { aggregates, skipped } = await buildLayerAggregates();
	const file: LayerAggregatesFile = {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		aggregates
	};
	await mkdir(dirname(OUTPUT_PATH), { recursive: true });
	await writeFile(OUTPUT_PATH, JSON.stringify(file), 'utf-8');
	console.log(
		`[layer-aggregate] wrote ${Object.keys(aggregates).length} layers, skipped ${skipped.length}, in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${OUTPUT_PATH}`
	);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error('[layer-aggregate] failed:', err);
		process.exit(1);
	});
}
