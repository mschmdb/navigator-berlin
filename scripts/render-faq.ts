/**
 * scripts/render-faq.ts (Story 2.5b T4): Build-Step der FAQ-Q&As aus YAML-
 * Templates + Postgres-Aggregat rendert und in `faq_qna` upsertet.
 *
 * Run: `pnpm data:faq`. Reihenfolge: `data:aggregate` (Story 2.0) → `data:faq`
 * (diese Story) → `build` (SvelteKit-Prerender).
 *
 * 5 Cluster (laerm, gruen, oepnv, wohnen, klima) × {bezirk, kiez, layer} ×
 * {`de`, `en`} (i18n Block C3: EN aus `*.en.yaml`).
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
import { sql } from 'drizzle-orm';
import { getDb, closeDb } from '../src/lib/server/db/index.js';
import { faqQna } from '../src/lib/server/db/schema/index.js';
import { computeFaqPositions, faqPositionKey } from '../src/lib/server/faq/faq-positions.js';
import { loadAllFaqTemplates } from '../src/lib/server/faq/load-templates.js';
import { templateAppliesToTarget } from '../src/lib/server/faq/layer-faq-clusters.js';
import { renderTemplate, type TemplateContext } from '../src/lib/server/faq/template-renderer.js';
import type {
	ClusterKey,
	PageType,
	TemplateLocale
} from '../src/lib/server/faq/template-schema.js';
import { checkFaqAnswer } from '../src/lib/server/faq/faq-fact-check.js';
import { loadAllTargets, scoreField, type RenderTarget } from './lib/faq/targets.js';

interface RenderedRow {
	readonly pageType: PageType;
	readonly slug: string;
	readonly cluster: ClusterKey;
	readonly locale: TemplateLocale;
	readonly templateId: string;
	readonly question: string;
	readonly answer: string;
	readonly sortOrder: number;
	readonly templateText: string;
}

async function renderAll(targets: readonly RenderTarget[]): Promise<RenderedRow[]> {
	const loaded = await loadAllFaqTemplates();
	const positions = computeFaqPositions(loaded);
	const out: RenderedRow[] = [];
	for (const target of targets) {
		for (const { cluster, locale, file } of loaded) {
			if (!templateAppliesToTarget(target, cluster)) continue;
			for (const template of file.templates) {
				const context: TemplateContext = {
					pageType: target.pageType,
					slug: target.slug,
					name: target.localizedName?.[locale] ?? target.name,
					locale,
					aggregate: target.aggregate,
					metrics: target.metrics
				};
				const rendered = renderTemplate(template, context);
				if (!rendered) continue;
				const sortOrder = positions.get(faqPositionKey(cluster, template.id));
				if (sortOrder === undefined) {
					throw new Error(`Keine FAQ-Position für Template ${cluster}/${template.id}`);
				}
				out.push({
					pageType: target.pageType,
					slug: target.slug,
					cluster,
					locale,
					templateId: template.id,
					question: rendered.question,
					answer: rendered.answer,
					sortOrder,
					templateText: template.answer
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
			templateId: r.templateId,
			question: r.question,
			answer: r.answer,
			sortOrder: r.sortOrder
		}));
		await db.insert(faqQna).values(slice);
	}
}

/**
 * NAV-108: Jede Antwort muss zu den Quelldaten passen, sonst schreibt der
 * Generator nichts. Prüft Verkehrsmittel, Klassen, Zahlen, Scores und Ränge.
 */
function assertFaqMatchesData(
	rows: readonly RenderedRow[],
	targets: readonly RenderTarget[]
): void {
	const byKey = new Map(targets.map((t) => [`${t.pageType}|${t.slug}`, t]));
	const fields = new Map<PageType, Map<string, number[]>>([
		['kiez', scoreField(targets.filter((t) => t.pageType === 'kiez'))],
		['bezirk', scoreField(targets.filter((t) => t.pageType === 'bezirk'))]
	]);
	const problems: string[] = [];
	for (const row of rows) {
		const target = byKey.get(`${row.pageType}|${row.slug}`);
		if (!target) continue;
		const findings = checkFaqAnswer(row, {
			name: target.localizedName?.[row.locale] ?? target.name,
			aggregate: target.aggregate,
			metrics: target.metrics,
			field: fields.get(row.pageType)
		});
		for (const f of findings) {
			problems.push(
				`${row.pageType}/${row.slug} ${row.locale} ${row.templateId} [${f.kind}] ${f.message}`
			);
		}
	}
	if (problems.length > 0) {
		throw new Error(
			`${problems.length} FAQ-Antworten widersprechen den Daten:\n${problems.join('\n')}`
		);
	}
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[render-faq] DATABASE_URL fehlt, Abbruch.\n');
		process.exit(1);
	}
	process.stdout.write('[render-faq] Loading targets ...\n');
	const { bezirks, kieze, layers } = await loadAllTargets();
	process.stdout.write(
		`[render-faq] Targets: bezirk=${bezirks.length} kiez=${kieze.length} layer=${layers.length}\n`
	);

	const targets = [...bezirks, ...kieze, ...layers];
	const rendered = await renderAll(targets);
	assertFaqMatchesData(rendered, targets);
	process.stdout.write(
		`[render-faq] Rendered ${rendered.length} Q&As, Datenprüfung ok. Upserting ...\n`
	);
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
