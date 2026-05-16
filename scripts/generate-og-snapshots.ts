/**
 * Build-Step (Story 2.6 AC-1): rendert Karten-Snapshots (1200×630 PNG) für
 * Bezirke, Kieze und Layer via Headless Playwright + MapLibre.
 *
 * Output: `static/og/snapshots/{type}-{slug}.png` (gitignored).
 * Cache: skipped pro File, falls bereits vorhanden + Force-Flag nicht gesetzt.
 *
 * Invocation:
 *   pnpm og:snapshots                 # alle Targets
 *   pnpm og:snapshots --type=bezirk   # nur Bezirke
 *   pnpm og:snapshots --slug=mitte    # einzelner Slug (kombiniert mit --type)
 *   pnpm og:snapshots --force         # ignoriert Cache
 */

import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
	buildBezirkTargetsFromGeoJson,
	buildKiezTargetsFromGeoJson,
	buildLayerTargetsFromManifest,
	buildBezirkCodeToSlugMap,
	type OgTarget,
	type BezirkTarget,
	type KiezTarget,
	type LayerTarget,
	type LayerManifestEntry,
	type GeoJsonFeatureCollection
} from '../src/lib/server/og/og-pipeline.js';
import { buildSnapshotPath } from '../src/lib/server/og/filename-resolver.js';
import { renderMapSnapshotPng, _resolveDefaultMapStylePath } from '../src/lib/server/og/snapshot-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const STATIC_DIR = path.join(REPO_ROOT, 'static');
const LAYERS_DIR = path.join(STATIC_DIR, 'layers');
const SNAPSHOTS_DIR = path.join(STATIC_DIR, 'og', 'snapshots');

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

async function readManifest(): Promise<{ layers: LayerManifestEntry[] }> {
	const raw = await readFile(path.join(LAYERS_DIR, 'MANIFEST.json'), 'utf8');
	const json = JSON.parse(raw) as { layers: LayerManifestEntry[] };
	return json;
}

function manifestEntryByFilename(manifest: { layers: Array<LayerManifestEntry & { filename: string }> }, slug: string): string {
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

async function renderTarget(
	target: OgTarget,
	highlightGeoJsonPath: string | null,
	highlightFilter: { property: string; value: string } | null,
	args: CliArgs
): Promise<{ status: 'rendered' | 'cached' | 'failed'; outputPath: string; error?: string }> {
	const outputPath = buildSnapshotPath(REPO_ROOT, target.type, target.slug);
	if (!args.force && (await fileExists(outputPath))) {
		return { status: 'cached', outputPath };
	}
	try {
		const result = await renderMapSnapshotPng({
			mapStylePath: _resolveDefaultMapStylePath(REPO_ROOT),
			highlightGeoJsonPath: highlightGeoJsonPath ?? undefined,
			highlightFeatureFilter: highlightFilter ?? undefined,
			bbox: target.type === 'layer' ? undefined : target.bbox,
			padding: 40
		});
		await mkdir(path.dirname(outputPath), { recursive: true });
		await writeFile(outputPath, result.png);
		return { status: 'rendered', outputPath };
	} catch (err) {
		return {
			status: 'failed',
			outputPath,
			error: err instanceof Error ? err.message : String(err)
		};
	}
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	process.stdout.write(`[og:snapshots] cwd=${REPO_ROOT}\n`);

	const manifest = await readManifest();
	const bezirkGeoJsonPath = manifestEntryByFilename(manifest as { layers: Array<LayerManifestEntry & { filename: string }> }, 'bezirke');
	const kiezGeoJsonPath = manifestEntryByFilename(manifest as { layers: Array<LayerManifestEntry & { filename: string }> }, 'lor-bezirksregion');
	const bezirkFc = await readGeoJson(bezirkGeoJsonPath);
	const kiezFc = await readGeoJson(kiezGeoJsonPath);

	const bezirkTargets = buildBezirkTargetsFromGeoJson(bezirkFc);
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

	const total = bezirks.length + kieze.length + layers.length;
	process.stdout.write(`[og:snapshots] targets: ${bezirks.length} bezirke, ${kieze.length} kieze, ${layers.length} layer (total ${total})\n`);

	let rendered = 0;
	let cached = 0;
	let failed = 0;

	for (const t of bezirks) {
		const r = await renderTarget(t, bezirkGeoJsonPath, { property: 'Gemeinde_name', value: t.label }, args);
		if (r.status === 'rendered') rendered++;
		else if (r.status === 'cached') cached++;
		else failed++;
		process.stdout.write(`[og:snapshots] bezirk/${t.slug}: ${r.status}${r.error ? ` (${r.error})` : ''}\n`);
	}
	for (const t of kieze) {
		const r = await renderTarget(t, kiezGeoJsonPath, { property: 'BZR_NAME', value: t.label }, args);
		if (r.status === 'rendered') rendered++;
		else if (r.status === 'cached') cached++;
		else failed++;
		process.stdout.write(`[og:snapshots] kiez/${t.slug}: ${r.status}${r.error ? ` (${r.error})` : ''}\n`);
	}
	for (const t of layers) {
		// Layer-Snapshots ohne Boundary-Highlight, ohne fitBounds → Berlin-Default-Style
		const r = await renderTarget(t, null, null, args);
		if (r.status === 'rendered') rendered++;
		else if (r.status === 'cached') cached++;
		else failed++;
		process.stdout.write(`[og:snapshots] layer/${t.slug}: ${r.status}${r.error ? ` (${r.error})` : ''}\n`);
	}

	process.stdout.write(`[og:snapshots] done: rendered=${rendered} cached=${cached} failed=${failed}\n`);
	if (failed > 0) process.exit(1);
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	const stack = err instanceof Error ? err.stack : '';
	process.stderr.write(`[og:snapshots] FATAL: ${msg}\n${stack}\n`);
	process.exit(1);
});
