/**
 * scripts/render-faq.ts (Story 2.5b T4): Build-Step der FAQ-Q&As aus YAML-
 * Templates + Postgres-Aggregat rendert und in `faq_qna` upsertet.
 *
 * Run: `pnpm data:faq`. Reihenfolge: `data:aggregate` (Story 2.0) → `data:faq`
 * (diese Story) → `build` (SvelteKit-Prerender).
 *
 * Phase-1 DE-only (Memory `project_i18n_phase_1_de_only`). 5 Cluster (laerm,
 * gruen, oepnv, wohnen, klima) × {bezirk, kiez, layer} × `de`. EN-Coverage
 * wird in Phase-3-Future-Epic nachgezogen.
 *
 * Idempotenz: TRUNCATE+Insert-Pattern wie `aggregate-data.ts` (Memory
 * `project_aggregate_truncate_insert`). Zweimal aufrufen liefert identische
 * Q&As modulo `computedAt`.
 *
 * Layer-Pages haben kein Aggregat (Layer beschreiben sich selbst). Templates
 * mit `applicableTo: [layer]` rendern gegen einen leeren Aggregat-Stub; nur
 * Templates ohne `requires`-Pfade (oder mit `requires`-Pfaden die `null`
 * liefern) werden behalten (Skip-Logik im renderer).
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { getDb, closeDb } from '../src/lib/server/db/index.js';
import { faqQna, bezirkStats, kiezStats } from '../src/lib/server/db/schema/index.js';
import type {
	AggregateValue,
	BildungAggregat,
	GruenAggregat,
	HeritageAggregat,
	KlimaAggregat,
	LaermAggregat,
	LuftAggregat,
	OepnvAggregat,
	WohnenAggregat
} from '../src/lib/server/db/schema/aggregate-types.js';
import { loadAllFaqTemplates } from '../src/lib/server/faq/load-templates.js';
import {
	renderTemplate,
	type TemplateAggregate,
	type TemplateContext
} from '../src/lib/server/faq/template-renderer.js';
import type { ClusterKey, PageType, TemplateLocale } from '../src/lib/server/faq/template-schema.js';
import { buildLayerTargetsFromManifest } from '../src/lib/server/og/og-pipeline.js';

const REPO_ROOT = process.cwd();
const MANIFEST_PATH = join(REPO_ROOT, 'static/layers/MANIFEST.json');

interface ManifestLayer {
	readonly slug: string;
	readonly bundleGroup: string;
	readonly license: string;
	readonly sourceUpdatedAt?: string;
	readonly sourceUrl: string;
	readonly filename: string;
}
interface Manifest {
	readonly layers: readonly ManifestLayer[];
}

interface RenderTarget {
	readonly pageType: PageType;
	readonly slug: string;
	readonly name: string;
	readonly aggregate: TemplateAggregate;
}

const EMPTY_AGGREGATE: TemplateAggregate = {
	laerm: { dominantCategory: null, categoryDistribution: null } as LaermAggregat,
	luft: { dominantCategory: null, categoryDistribution: null } as LuftAggregat,
	gruen: {
		dominantVersorgung: null,
		gruenanlagenCount: null,
		spielplaetzeCount: null
	} as unknown as GruenAggregat,
	klima: { meanPet: null, hotDays: null } as unknown as KlimaAggregat,
	wohnen: { dominantWohnlage: null, dominantMss: null } as unknown as WohnenAggregat,
	oepnv: { stopsPerKm2: null } as unknown as OepnvAggregat,
	bildung: {} as BildungAggregat,
	heritage: {} as HeritageAggregat
};

function rowToAggregate(row: {
	laerm: LaermAggregat;
	luft: LuftAggregat;
	gruen: GruenAggregat;
	klima: KlimaAggregat;
	wohnen: WohnenAggregat;
	oepnv: OepnvAggregat;
	bildung: BildungAggregat;
	heritage: HeritageAggregat;
}): TemplateAggregate {
	return {
		laerm: row.laerm,
		luft: row.luft,
		gruen: row.gruen,
		klima: row.klima,
		wohnen: row.wohnen,
		oepnv: row.oepnv,
		bildung: row.bildung,
		heritage: row.heritage
	};
}

function slugToDisplayName(slug: string): string {
	return slug
		.split('-')
		.map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
		.join(' ');
}

async function readManifest(): Promise<Manifest> {
	const raw = await readFile(MANIFEST_PATH, 'utf-8');
	return JSON.parse(raw) as Manifest;
}

async function loadBezirkTargets(): Promise<RenderTarget[]> {
	const rows = await getDb()
		.select({
			slug: bezirkStats.slug,
			laerm: bezirkStats.laerm,
			luft: bezirkStats.luft,
			gruen: bezirkStats.gruen,
			klima: bezirkStats.klima,
			wohnen: bezirkStats.wohnen,
			oepnv: bezirkStats.oepnv,
			bildung: bezirkStats.bildung,
			heritage: bezirkStats.heritage
		})
		.from(bezirkStats);
	return rows.map((row) => ({
		pageType: 'bezirk' as const,
		slug: row.slug,
		name: slugToDisplayName(row.slug),
		aggregate: rowToAggregate(row)
	}));
}

async function loadKiezTargets(): Promise<RenderTarget[]> {
	const rows = await getDb()
		.select({
			slug: kiezStats.slug,
			laerm: kiezStats.laerm,
			luft: kiezStats.luft,
			gruen: kiezStats.gruen,
			klima: kiezStats.klima,
			wohnen: kiezStats.wohnen,
			oepnv: kiezStats.oepnv,
			bildung: kiezStats.bildung,
			heritage: kiezStats.heritage
		})
		.from(kiezStats);
	return rows.map((row) => ({
		pageType: 'kiez' as const,
		slug: row.slug,
		name: slugToDisplayName(row.slug),
		aggregate: rowToAggregate(row)
	}));
}

async function loadLayerTargets(): Promise<RenderTarget[]> {
	const manifest = await readManifest();
	const layerTargets = buildLayerTargetsFromManifest(manifest.layers);
	return layerTargets.map((t) => ({
		pageType: 'layer' as const,
		slug: t.slug,
		name: t.label,
		aggregate: EMPTY_AGGREGATE
	}));
}

interface RenderedRow {
	readonly pageType: PageType;
	readonly slug: string;
	readonly cluster: ClusterKey;
	readonly locale: TemplateLocale;
	readonly question: string;
	readonly answer: string;
}

async function renderAll(targets: readonly RenderTarget[]): Promise<RenderedRow[]> {
	const loaded = await loadAllFaqTemplates();
	const out: RenderedRow[] = [];
	for (const target of targets) {
		for (const { cluster, locale, file } of loaded) {
			for (const template of file.templates) {
				const context: TemplateContext = {
					pageType: target.pageType,
					slug: target.slug,
					name: target.name,
					locale,
					aggregate: target.aggregate
				};
				const rendered = renderTemplate(template, context);
				if (!rendered) continue;
				out.push({
					pageType: target.pageType,
					slug: target.slug,
					cluster,
					locale,
					question: rendered.question,
					answer: rendered.answer
				});
			}
		}
	}
	return out;
}

async function upsertRows(rows: readonly RenderedRow[]): Promise<void> {
	const db = getDb();
	await db.execute(sql`TRUNCATE TABLE ${faqQna}`);
	if (rows.length === 0) return;
	const CHUNK = 500;
	for (let i = 0; i < rows.length; i += CHUNK) {
		const slice = rows.slice(i, i + CHUNK).map((r) => ({
			pageType: r.pageType,
			slug: r.slug,
			cluster: r.cluster,
			locale: r.locale,
			question: r.question,
			answer: r.answer
		}));
		await db.insert(faqQna).values(slice);
	}
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[render-faq] DATABASE_URL fehlt — abort.\n');
		process.exit(1);
	}
	process.stdout.write('[render-faq] Loading targets ...\n');
	const [bezirks, kieze, layers] = await Promise.all([
		loadBezirkTargets(),
		loadKiezTargets(),
		loadLayerTargets()
	]);
	process.stdout.write(
		`[render-faq] Targets: bezirk=${bezirks.length} kiez=${kieze.length} layer=${layers.length}\n`
	);

	const rendered = await renderAll([...bezirks, ...kieze, ...layers]);
	process.stdout.write(`[render-faq] Rendered ${rendered.length} Q&As. Upserting ...\n`);
	await upsertRows(rendered);
	process.stdout.write('[render-faq] Done.\n');
	await closeDb();
}

main().catch(async (err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[render-faq] FATAL: ${msg}\n`);
	await closeDb().catch(() => undefined);
	process.exit(1);
});
