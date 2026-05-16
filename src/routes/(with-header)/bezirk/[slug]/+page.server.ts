import { error } from '@sveltejs/kit';
import { getBezirkProfile } from '$lib/data/get-bezirk-profile.js';
import { getLocale } from '$lib/paraglide/runtime.js';
import { readBezirkSlugsFromGeoJson } from '$lib/seo/sources/bezirk-slugs.js';
import { getFaqQna } from '$lib/server/db/queries/get-faq-qna.js';
import type { BezirkProfile, FaqEntry } from '$lib/data/types.js';
import type { EntryGenerator, PageServerLoad } from './$types';
import type { InferSelectModel } from 'drizzle-orm';
import type { bezirkStats } from '$lib/server/db/schema/index.js';

type BezirkStatsRow = InferSelectModel<typeof bezirkStats>;

export const prerender = true;

/**
 * Story 2.3 T1.1: 12 prerendered Bezirks-Routes Phase-1 DE-only
 * (Memory `project_i18n_phase_1_de_only`). EN-Variante kommt in
 * Phase-3-Future-Epic.
 */
export const entries: EntryGenerator = async () => {
	const slugs = await readBezirkSlugsFromGeoJson();
	return slugs.map((slug) => ({ slug }));
};

async function tryLoadBezirkStats(slug: string): Promise<BezirkStatsRow | null> {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getBezirkStats } = await import('$lib/server/db/queries/get-bezirk-stats.js');
		return (await getBezirkStats(slug)) as BezirkStatsRow | null;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[bezirk-page] WARN: bezirk_stats unavailable (${msg})\n`);
		return null;
	}
}

async function tryLoadFaq(slug: string): Promise<FaqEntry[]> {
	if (!process.env.DATABASE_URL) return [];
	try {
		const rows = await getFaqQna({ pageType: 'bezirk', slug, locale: 'de' });
		return rows.map((r) => ({ question: r.question, answer: r.answer }));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[bezirk-page] WARN: faq_qna unavailable (${msg})\n`);
		return [];
	}
}

export interface BezirkPageData {
	readonly profile: BezirkProfile;
	readonly stats: BezirkStatsRow | null;
	readonly faq: readonly FaqEntry[];
}

export const load: PageServerLoad = async ({ params, fetch }) => {
	const slug = params.slug;
	let profile: BezirkProfile;
	try {
		profile = await getBezirkProfile(getLocale() as 'de' | 'en', slug, fetch);
	} catch {
		throw error(404, `Bezirk ${slug} nicht gefunden`);
	}
	const [stats, faq] = await Promise.all([tryLoadBezirkStats(slug), tryLoadFaq(slug)]);
	const data: BezirkPageData = { profile, stats, faq };
	return data;
};
