/**
 * Build-Step (Story 2.6, Pure-Satori-Pivot 2026-05-16): rendert finale
 * OG-Cards aus Top-3-Aggregat-Werten + Satori-VDOM. Kein Map-Snapshot.
 *
 * Output: `static/og/{type}/{slug}.png` (gitignored).
 *
 * Aggregat-Source: Postgres `bezirk_stats` + `kiez_stats` (Story 2.0). Wenn
 * DATABASE_URL fehlt → Placeholder-Werte, gleiches Pattern wie Story 2.8.
 *
 * Hintergrund Pivot: Headless-Playwright-Snapshot-Pipeline (alte AC-1)
 * verworfen, weil lokale Builds System-OOM gerissen haben und produzierte
 * PNGs unbrauchbar waren. Brand-Color-Background + Plex-Typo + Top-3-Stats
 * tragen die Karte ausreichend.
 */

import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
	buildBezirkTargetsFromGeoJson,
	buildKiezTargetsFromGeoJson,
	buildLayerTargetsFromManifest,
	buildBezirkCodeToSlugMap,
	type BezirkTarget,
	type KiezTarget,
	type LayerTarget,
	type LayerManifestEntry,
	type GeoJsonFeatureCollection
} from '../src/lib/server/og/og-pipeline.js';
import { buildOgPath } from '../src/lib/server/og/filename-resolver.js';
import {
	buildBezirkCardVdom,
	buildKiezCardVdom,
	buildLayerCardVdom
} from '../src/lib/server/og/page-card-template.js';
import { renderPageCardPng } from '../src/lib/server/og/render-page-card.js';
import { selectTopStatsForBezirkOrKiez, type Top3StatCard } from '../src/lib/server/og/top-stats-selector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const STATIC_DIR = path.join(REPO_ROOT, 'static');
const LAYERS_DIR = path.join(STATIC_DIR, 'layers');

interface CliArgs {
	readonly type: 'bezirk' | 'kiez' | 'layer' | 'all';
	readonly slug: string | null;
	readonly force: boolean;
}

function parseArgs(argv: readonly string[]): CliArgs {
	let type: CliArgs['type'] = 'all';
	let slug: string | null = null;
	let force = false;
	for (const arg of argv) {
		if (arg.startsWith('--type=')) {
			const v = arg.slice('--type='.length);
			if (v === 'bezirk' || v === 'kiez' || v === 'layer' || v === 'all') type = v;
		} else if (arg.startsWith('--slug=')) {
			slug = arg.slice('--slug='.length);
		} else if (arg === '--force') {
			force = true;
		}
	}
	return { type, slug, force };
}

async function readManifest(): Promise<{ layers: Array<LayerManifestEntry & { filename: string }> }> {
	const raw = await readFile(path.join(LAYERS_DIR, 'MANIFEST.json'), 'utf8');
	return JSON.parse(raw) as { layers: Array<LayerManifestEntry & { filename: string }> };
}

function manifestEntryByFilename(
	manifest: { layers: Array<LayerManifestEntry & { filename: string }> },
	slug: string
): string {
	const entry = manifest.layers.find((l) => l.slug === slug);
	if (!entry) throw new Error(`manifest: layer "${slug}" missing`);
	return path.join(LAYERS_DIR, entry.filename);
}

async function readGeoJson(filePath: string): Promise<GeoJsonFeatureCollection> {
	const raw = await readFile(filePath, 'utf8');
	return JSON.parse(raw) as GeoJsonFeatureCollection;
}

async function fileExists(p: string): Promise<boolean> {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}

const PLACEHOLDER_STATS: readonly Top3StatCard[] = [
	{ label: 'Lärm', value: '–', layer: null, sourceUpdatedAt: null },
	{ label: 'PET', value: '–', layer: null, sourceUpdatedAt: null },
	{ label: 'Stationen', value: '–', layer: null, sourceUpdatedAt: null }
];

interface BezirkStatsRow {
	readonly slug: string;
	readonly laerm: unknown;
	readonly klima: unknown;
	readonly oepnv: unknown;
}

async function tryLoadBezirkStats(): Promise<Map<string, BezirkStatsRow>> {
	if (!process.env.DATABASE_URL) {
		return new Map();
	}
	try {
		const { getDb } = await import('../src/lib/server/db/index.js');
		const { bezirkStats } = await import('../src/lib/server/db/schema/index.js');
		const rows = await getDb().select().from(bezirkStats);
		const map = new Map<string, BezirkStatsRow>();
		for (const r of rows) map.set(r.slug, r as BezirkStatsRow);
		return map;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[og:images] WARN: bezirk_stats unavailable (${msg}), using placeholders\n`);
		return new Map();
	}
}

async function tryLoadKiezStats(): Promise<Map<string, BezirkStatsRow>> {
	if (!process.env.DATABASE_URL) {
		return new Map();
	}
	try {
		const { getDb } = await import('../src/lib/server/db/index.js');
		const { kiezStats } = await import('../src/lib/server/db/schema/index.js');
		const rows = await getDb().select().from(kiezStats);
		const map = new Map<string, BezirkStatsRow>();
		for (const r of rows) map.set(r.slug, r as BezirkStatsRow);
		return map;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[og:images] WARN: kiez_stats unavailable (${msg}), using placeholders\n`);
		return new Map();
	}
}

async function renderBezirk(
	target: BezirkTarget,
	stats: Map<string, BezirkStatsRow>,
	args: CliArgs
): Promise<'rendered' | 'cached' | 'failed'> {
	const outputPath = buildOgPath(REPO_ROOT, 'bezirk', target.slug);
	if (!args.force && (await fileExists(outputPath))) return 'cached';
	try {
		const row = stats.get(target.slug);
		const topStats = row
			? selectTopStatsForBezirkOrKiez({
					laerm: row.laerm as never,
					klima: row.klima as never,
					oepnv: row.oepnv as never
				})
			: PLACEHOLDER_STATS;
		const vdom = buildBezirkCardVdom({
			bezirkName: target.label,
			slug: target.slug,
			topStats
		});
		const png = await renderPageCardPng(vdom);
		await mkdir(path.dirname(outputPath), { recursive: true });
		await writeFile(outputPath, png);
		return 'rendered';
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[og:images] bezirk/${target.slug} failed: ${msg}\n`);
		return 'failed';
	}
}

async function renderKiez(
	target: KiezTarget,
	stats: Map<string, BezirkStatsRow>,
	bezirkLabels: Map<string, string>,
	args: CliArgs
): Promise<'rendered' | 'cached' | 'failed'> {
	const outputPath = buildOgPath(REPO_ROOT, 'kiez', target.slug);
	if (!args.force && (await fileExists(outputPath))) return 'cached';
	try {
		const row = stats.get(target.slug);
		const topStats = row
			? selectTopStatsForBezirkOrKiez({
					laerm: row.laerm as never,
					klima: row.klima as never,
					oepnv: row.oepnv as never
				})
			: PLACEHOLDER_STATS;
		const parentLabel = bezirkLabels.get(target.parentBezirkSlug) ?? target.parentBezirkSlug;
		const vdom = buildKiezCardVdom({
			kiezName: target.label,
			slug: target.slug,
			parentBezirkName: parentLabel,
			topStats
		});
		const png = await renderPageCardPng(vdom);
		await mkdir(path.dirname(outputPath), { recursive: true });
		await writeFile(outputPath, png);
		return 'rendered';
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[og:images] kiez/${target.slug} failed: ${msg}\n`);
		return 'failed';
	}
}

async function renderLayer(target: LayerTarget, args: CliArgs): Promise<'rendered' | 'cached' | 'failed'> {
	const outputPath = buildOgPath(REPO_ROOT, 'layer', target.slug);
	if (!args.force && (await fileExists(outputPath))) return 'cached';
	try {
		const vdom = buildLayerCardVdom({
			layerSlug: target.slug,
			layerLabel: target.label,
			bundleGroup: target.bundleGroup,
			authority: target.authority,
			license: target.license,
			sourceUpdatedAt: target.sourceUpdatedAt
		});
		const png = await renderPageCardPng(vdom);
		await mkdir(path.dirname(outputPath), { recursive: true });
		await writeFile(outputPath, png);
		return 'rendered';
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[og:images] layer/${target.slug} failed: ${msg}\n`);
		return 'failed';
	}
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	process.stdout.write(`[og:images] cwd=${REPO_ROOT}\n`);

	const manifest = await readManifest();
	const bezirkFc = await readGeoJson(manifestEntryByFilename(manifest, 'bezirke'));
	const kiezFc = await readGeoJson(manifestEntryByFilename(manifest, 'lor-bezirksregion'));

	const bezirkTargets = buildBezirkTargetsFromGeoJson(bezirkFc);
	const bezirkLabels = new Map<string, string>();
	for (const b of bezirkTargets) bezirkLabels.set(b.slug, b.label);
	const bezirkCodeMap = buildBezirkCodeToSlugMap(bezirkTargets);
	const kiezTargets = buildKiezTargetsFromGeoJson(kiezFc, bezirkCodeMap);
	const layerTargets = buildLayerTargetsFromManifest(manifest.layers);

	let bezirks: BezirkTarget[] = [];
	let kieze: KiezTarget[] = [];
	let layers: LayerTarget[] = [];
	if (args.type === 'all' || args.type === 'bezirk') bezirks = bezirkTargets;
	if (args.type === 'all' || args.type === 'kiez') kieze = kiezTargets;
	if (args.type === 'all' || args.type === 'layer') layers = layerTargets;

	if (args.slug) {
		bezirks = bezirks.filter((t) => t.slug === args.slug);
		kieze = kieze.filter((t) => t.slug === args.slug);
		layers = layers.filter((t) => t.slug === args.slug);
	}

	const bezirkStats = bezirks.length > 0 ? await tryLoadBezirkStats() : new Map();
	const kiezStats = kieze.length > 0 ? await tryLoadKiezStats() : new Map();

	let rendered = 0;
	let cached = 0;
	let failed = 0;

	for (const t of bezirks) {
		const r = await renderBezirk(t, bezirkStats, args);
		if (r === 'rendered') rendered++;
		else if (r === 'cached') cached++;
		else failed++;
		process.stdout.write(`[og:images] bezirk/${t.slug}: ${r}\n`);
	}
	for (const t of kieze) {
		const r = await renderKiez(t, kiezStats, bezirkLabels, args);
		if (r === 'rendered') rendered++;
		else if (r === 'cached') cached++;
		else failed++;
		process.stdout.write(`[og:images] kiez/${t.slug}: ${r}\n`);
	}
	for (const t of layers) {
		const r = await renderLayer(t, args);
		if (r === 'rendered') rendered++;
		else if (r === 'cached') cached++;
		else failed++;
		process.stdout.write(`[og:images] layer/${t.slug}: ${r}\n`);
	}

	process.stdout.write(`[og:images] done: rendered=${rendered} cached=${cached} failed=${failed}\n`);
	if (failed > 0) process.exit(1);
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[og:images] FATAL: ${msg}\n`);
	process.exit(1);
});
