import { desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { bezirkScore, kiezScore } from '$lib/server/db/schema/index.js';
import type { RankingRow } from '$lib/data/ranking-types.js';

export const prerender = true;

/**
 * Story 2.9b T1: Ranking-Page „Wo lebt es sich gut?"
 *
 * Phase-1 DE-only (Memory `project_i18n_phase_1_de_only`): 1 prerendered
 * Route, EN-Variante in Phase-3-Future-Epic. Loader liefert Top-30-Kieze
 * + alle 12 Bezirke einmalig; Client macht Sort + View-Toggle via URL-
 * State (replaceState) gegen die geladenen Arrays — kein Re-Fetch nötig
 * weil Page-HTML statisch prerendered ist.
 *
 * Soziale-Lage bleibt im Datenmodell (Spalten-Wert sichtbar), wird aber
 * NIE als Default-Sort verwendet (Memory `feedback_no_lebenswert` +
 * Stigma-Disziplin Memory `project_compare_editorial_profiles`).
 */

const TOP_KIEZ_LIMIT = 30;

export interface RankingPageData {
	readonly kieze: readonly RankingRow[];
	readonly bezirke: readonly RankingRow[];
	readonly computedAt: string | null;
}

function slugToDisplayName(slug: string): string {
	return slug
		.split('-')
		.map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
		.join(' ');
}

async function loadKieze(bezirkNameBySlug: Map<string, string>): Promise<RankingRow[]> {
	if (!process.env.DATABASE_URL) return [];
	try {
		const { getDb } = await import('$lib/server/db/index.js');
		const rows = await getDb()
			.select()
			.from(kiezScore)
			.orderBy(desc(sql`COALESCE(${kiezScore.composite}, -1)`))
			.limit(TOP_KIEZ_LIMIT);
		return rows.map((r) => ({
			slug: r.slug,
			displayName: slugToDisplayName(r.slug),
			bezirkSlug: r.bezirkSlug,
			bezirkName: r.bezirkSlug ? bezirkNameBySlug.get(r.bezirkSlug) ?? slugToDisplayName(r.bezirkSlug) : null,
			composite: typeof r.composite === 'number' ? r.composite : null,
			ruheLuft: r.ruheLuft,
			gruen: r.gruen,
			mobilitaet: r.mobilitaet,
			sozialeLage: r.sozialeLage,
			versorgung: r.versorgung
		}));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[ranking] WARN: kiez_score unavailable (${msg})\n`);
		return [];
	}
}

async function loadBezirke(): Promise<RankingRow[]> {
	if (!process.env.DATABASE_URL) return [];
	try {
		const { getDb } = await import('$lib/server/db/index.js');
		const rows = await getDb()
			.select()
			.from(bezirkScore)
			.orderBy(desc(sql`COALESCE(${bezirkScore.composite}, -1)`));
		return rows.map((r) => ({
			slug: r.slug,
			displayName: slugToDisplayName(r.slug),
			bezirkSlug: null,
			bezirkName: null,
			composite: typeof r.composite === 'number' ? r.composite : null,
			ruheLuft: r.ruheLuft,
			gruen: r.gruen,
			mobilitaet: r.mobilitaet,
			sozialeLage: r.sozialeLage,
			versorgung: r.versorgung
		}));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[ranking] WARN: bezirk_score unavailable (${msg})\n`);
		return [];
	}
}

export const load: PageServerLoad = async () => {
	const bezirke = await loadBezirke();
	const bezirkNameBySlug = new Map<string, string>(
		bezirke.map((b) => [b.slug, b.displayName])
	);
	const kieze = await loadKieze(bezirkNameBySlug);
	const computedAt = bezirke.length > 0 || kieze.length > 0 ? new Date().toISOString() : null;
	const data: RankingPageData = { kieze, bezirke, computedAt };
	return data;
};
