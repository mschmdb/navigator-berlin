/**
 * Build-Step (Story 2.6, Score-Card-Pivot 2026-05-16): rendert OG-Cards aus
 * Postgres `bezirk_score` / `kiez_score` (Story 2.9a) + Brand-Logo. Kein
 * Map-Snapshot, kein Headless-Playwright.
 *
 * Output: `static/og/{type}/{slug}.png` (gitignored).
 *
 * Bezirk + Kiez: Composite-Score + 4 Dimensionen (Ruhe / Grün / Mob /
 * Versorgung). Soziale-Lage bewusst off-card per Stigma-Schutz (User-Lock
 * 2026-05-16).
 *
 * Layer-Card: Authority + License + Stand (unverändert aus Story 2.6).
 *
 * Brand-Logo: `static/logo-mark.svg` als data:image/svg+xml-URI in Top-Left.
 *
 * Wenn DATABASE_URL fehlt → Placeholder-Werte „–" in allen Slots.
 */

import 'dotenv/config';
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
import { buildScoreCardData, type ScoreCardData } from '../src/lib/server/og/score-card-data.js';
import { loadLogoDataUri } from '../src/lib/server/og/logo-loader.js';

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

interface ScoreRow {
	readonly slug: string;
	readonly composite: number;
	readonly ruheLuft: number | null;
	readonly gruen: number | null;
	readonly mobilitaet: number | null;
	readonly versorgung: number | null;
	readonly computedAt: Date | null;
}

async function tryLoadBezirkScores(): Promise<Map<string, ScoreRow>> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[og:images] WARN: DATABASE_URL not set — bezirk_score skipped\n');
		return new Map();
	}
	try {
		const { getDb } = await import('../src/lib/server/db/index.js');
		const { bezirkScore } = await import('../src/lib/server/db/schema/index.js');
		const rows = await getDb().select().from(bezirkScore);
		const map = new Map<string, ScoreRow>();
		for (const r of rows) map.set(r.slug, r as ScoreRow);
		process.stdout.write(`[og:images] bezirk_score: ${map.size} rows loaded\n`);
		return map;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[og:images] WARN: bezirk_score unavailable (${msg}), placeholders\n`);
		return new Map();
	}
}

async function tryLoadKiezScores(): Promise<Map<string, ScoreRow>> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[og:images] WARN: DATABASE_URL not set — kiez_score skipped\n');
		return new Map();
	}
	try {
		const { getDb } = await import('../src/lib/server/db/index.js');
		const { kiezScore } = await import('../src/lib/server/db/schema/index.js');
		const rows = await getDb().select().from(kiezScore);
		const map = new Map<string, ScoreRow>();
		for (const r of rows) map.set(r.slug, r as ScoreRow);
		process.stdout.write(`[og:images] kiez_score: ${map.size} rows loaded\n`);
		return map;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[og:images] WARN: kiez_score unavailable (${msg}), placeholders\n`);
		return new Map();
	}
}

function formatStand(date: Date | null): string | null {
	if (!date) return null;
	return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

async function renderBezirk(
	target: BezirkTarget,
	scores: Map<string, ScoreRow>,
	logoDataUri: string | undefined,
	args: CliArgs
): Promise<'rendered' | 'cached' | 'failed'> {
	const outputPath = buildOgPath(REPO_ROOT, 'bezirk', target.slug);
	if (!args.force && (await fileExists(outputPath))) return 'cached';
	try {
		const row = scores.get(target.slug) ?? null;
		const scoreCard: ScoreCardData = buildScoreCardData(row);
		const vdom = buildBezirkCardVdom({
			bezirkName: target.label,
			slug: target.slug,
			scoreCard,
			scoreUpdatedAt: formatStand(row?.computedAt ?? null),
			logoDataUri
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
	scores: Map<string, ScoreRow>,
	bezirkLabels: Map<string, string>,
	logoDataUri: string | undefined,
	args: CliArgs
): Promise<'rendered' | 'cached' | 'failed'> {
	const outputPath = buildOgPath(REPO_ROOT, 'kiez', target.slug);
	if (!args.force && (await fileExists(outputPath))) return 'cached';
	try {
		const row = scores.get(target.slug) ?? null;
		const scoreCard: ScoreCardData = buildScoreCardData(row);
		const parentLabel = bezirkLabels.get(target.parentBezirkSlug) ?? target.parentBezirkSlug;
		const vdom = buildKiezCardVdom({
			kiezName: target.label,
			slug: target.slug,
			parentBezirkName: parentLabel,
			scoreCard,
			scoreUpdatedAt: formatStand(row?.computedAt ?? null),
			logoDataUri
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

async function renderLayer(
	target: LayerTarget,
	logoDataUri: string | undefined,
	args: CliArgs
): Promise<'rendered' | 'cached' | 'failed'> {
	const outputPath = buildOgPath(REPO_ROOT, 'layer', target.slug);
	if (!args.force && (await fileExists(outputPath))) return 'cached';
	try {
		const vdom = buildLayerCardVdom({
			layerSlug: target.slug,
			layerLabel: target.label,
			bundleGroup: target.bundleGroup,
			authority: target.authority,
			license: target.license,
			sourceUpdatedAt: target.sourceUpdatedAt,
			logoDataUri
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

async function tryLoadLogo(): Promise<string | undefined> {
	try {
		return await loadLogoDataUri(REPO_ROOT);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[og:images] WARN: logo unavailable (${msg})\n`);
		return undefined;
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

	const [bezirkScores, kiezScores, logoDataUri] = await Promise.all([
		bezirks.length > 0 ? tryLoadBezirkScores() : Promise.resolve(new Map<string, ScoreRow>()),
		kieze.length > 0 ? tryLoadKiezScores() : Promise.resolve(new Map<string, ScoreRow>()),
		tryLoadLogo()
	]);

	let rendered = 0;
	let cached = 0;
	let failed = 0;

	for (const t of bezirks) {
		const r = await renderBezirk(t, bezirkScores, logoDataUri, args);
		if (r === 'rendered') rendered++;
		else if (r === 'cached') cached++;
		else failed++;
		process.stdout.write(`[og:images] bezirk/${t.slug}: ${r}\n`);
	}
	for (const t of kieze) {
		const r = await renderKiez(t, kiezScores, bezirkLabels, logoDataUri, args);
		if (r === 'rendered') rendered++;
		else if (r === 'cached') cached++;
		else failed++;
		process.stdout.write(`[og:images] kiez/${t.slug}: ${r}\n`);
	}
	for (const t of layers) {
		const r = await renderLayer(t, logoDataUri, args);
		if (r === 'rendered') rendered++;
		else if (r === 'cached') cached++;
		else failed++;
		process.stdout.write(`[og:images] layer/${t.slug}: ${r}\n`);
	}

	process.stdout.write(`[og:images] done: rendered=${rendered} cached=${cached} failed=${failed}\n`);

	// Postgres-Pool explizit schließen, sonst hängt Node-Event-Loop und Script exit-t nie
	if (process.env.DATABASE_URL) {
		try {
			const { closeDb } = await import('../src/lib/server/db/index.js');
			await closeDb();
		} catch {
			/* ignore close errors */
		}
	}

	process.exit(failed > 0 ? 1 : 0);
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[og:images] FATAL: ${msg}\n`);
	process.exit(1);
});
