import { error } from '@sveltejs/kit';
import { getKiezProfile } from '$lib/data/get-kiez-profile.js';
import { getLocale } from '$lib/paraglide/runtime.js';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import { getFaqQna } from '$lib/server/db/queries/get-faq-qna.js';
import type { KiezStats } from '$lib/server/db/queries/get-kiez-stats.js';
import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';
import type { KiezProfile, FaqEntry } from '$lib/data/types.js';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

/**
 * Story 2.4 T1.1: 143 prerendered Kiez-Routes Phase-1 DE-only
 * (Memory `project_i18n_phase_1_de_only` + Variante A LOR-Bezirksregion
 * 2021, User-Lock 2026-05-16). EN-Variante in Phase-3-Future-Epic.
 */
export const entries: EntryGenerator = async () => {
	const slugs = await readKiezSlugsFromGeoJson();
	return slugs.map((slug) => ({ slug }));
};

async function tryLoadKiezStats(slug: string): Promise<KiezStats | null> {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getKiezStats } = await import('$lib/server/db/queries/get-kiez-stats.js');
		return (await getKiezStats(slug)) as KiezStats | null;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-page] WARN: kiez_stats unavailable (${msg})\n`);
		return null;
	}
}

async function tryLoadKiezScore(slug: string): Promise<KiezScore | null> {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getKiezScore } = await import('$lib/server/db/queries/get-kiez-score.js');
		return (await getKiezScore(slug)) as KiezScore | null;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-page] WARN: kiez_score unavailable (${msg})\n`);
		return null;
	}
}

async function tryLoadFaq(slug: string): Promise<FaqEntry[]> {
	if (!process.env.DATABASE_URL) return [];
	try {
		const rows = await getFaqQna({ pageType: 'kiez', slug, locale: 'de' });
		return rows.map((r) => ({ question: r.question, answer: r.answer }));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-page] WARN: faq_qna unavailable (${msg})\n`);
		return [];
	}
}

export type KiezPageData = {
	readonly profile: KiezProfile;
	readonly stats: KiezStats | null;
	readonly score: KiezScore | null;
	readonly faq: readonly FaqEntry[];
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	const slug = params.slug;
	let profile: KiezProfile;
	try {
		profile = await getKiezProfile(getLocale() as 'de' | 'en', slug, fetch);
	} catch {
		throw error(404, `Kiez ${slug} nicht gefunden`);
	}
	const [stats, score, faq] = await Promise.all([
		tryLoadKiezStats(slug),
		tryLoadKiezScore(slug),
		tryLoadFaq(slug)
	]);
	const data: KiezPageData = { profile, stats, score, faq };
	return data;
};
