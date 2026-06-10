import { error } from '@sveltejs/kit';
import { getBezirkProfile } from '$lib/data/get-bezirk-profile.js';
import { getLocale } from '$lib/paraglide/runtime.js';
import { readBezirkSlugsFromGeoJson } from '$lib/seo/sources/bezirk-slugs.js';
import { getFaqQna } from '$lib/server/db/queries/get-faq-qna.js';
import {
	buildKiezeInBezirk,
	pickTop,
	type KiezRef
} from '$lib/data/get-kieze-in-bezirk.js';
import type { BezirkStats } from '$lib/server/db/queries/get-bezirk-stats.js';
import type { BezirkProfile, FaqEntry } from '$lib/data/types.js';
import type { ComparisonDimRow } from '$lib/data/comparison-types.js';
import type { EntryGenerator, PageServerLoad } from './$types';

const SCORE_DIMS: readonly { key: string; label: string }[] = [
	{ key: 'ruheLuft', label: 'Ruhe & Luft' },
	{ key: 'gruenHitze', label: 'Grün & Hitze' },
	{ key: 'mobilitaet', label: 'Mobilität' },
	{ key: 'versorgung', label: 'Versorgung' },
	{ key: 'wohnschutz', label: 'Wohnschutz' },
	// Option C: Kultur ist eigenständig (nicht im Gesamt-Score), wird aber als Vergleichszeile gezeigt.
	{ key: 'kultur', label: 'Kultur' },
	// Story 14.9: Kriminalität als Kontext-Vergleichszeile (Option C). Kein Rang, neutral, BR-Granularität.
	{ key: 'kriminalitaet', label: 'Erfasste Kriminalität' }
];

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

async function tryLoadBezirkStats(slug: string): Promise<BezirkStats | null> {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getBezirkStats } = await import('$lib/server/db/queries/get-bezirk-stats.js');
		return (await getBezirkStats(slug)) as BezirkStats | null;
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

async function tryLoadBezirkRank(slug: string) {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getBezirkRank } = await import('$lib/server/db/queries/get-bezirk-rank.js');
		return await getBezirkRank(slug);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[bezirk-page] WARN: bezirk_rank unavailable (${msg})\n`);
		return null;
	}
}

async function tryLoadBezirkComparison(slug: string) {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getBezirkComparison } = await import('$lib/server/db/queries/get-bezirk-comparison.js');
		return await getBezirkComparison(slug);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[bezirk-page] WARN: bezirk_comparison unavailable (${msg})\n`);
		return null;
	}
}

export type BezirkPageData = {
	readonly profile: BezirkProfile;
	readonly stats: BezirkStats | null;
	readonly faq: readonly FaqEntry[];
	readonly kieze: readonly KiezRef[];
	readonly comparison: readonly ComparisonDimRow[];
	readonly profileProse: readonly string[];
};

async function tryLoadKieze(bezirkSlug: string): Promise<KiezRef[]> {
	try {
		const { readFile } = await import('node:fs/promises');
		const { resolve } = await import('node:path');
		const manifestPath = resolve(process.cwd(), 'static/layers/MANIFEST.json');
		const manifestRaw = await readFile(manifestPath, 'utf-8');
		const manifest = JSON.parse(manifestRaw) as {
			layers: { slug: string; filename: string }[];
		};
		const bezirkeLayer = manifest.layers.find((l) => l.slug === 'bezirke');
		const lorLayer = manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
		if (!bezirkeLayer || !lorLayer) return [];

		const [bezirkeRaw, lorRaw] = await Promise.all([
			readFile(resolve(process.cwd(), 'static/layers', bezirkeLayer.filename), 'utf-8'),
			readFile(resolve(process.cwd(), 'static/layers', lorLayer.filename), 'utf-8')
		]);
		const bezirkeFc = JSON.parse(bezirkeRaw) as {
			features: { properties?: Record<string, unknown> }[];
		};
		const lorFc = JSON.parse(lorRaw) as {
			features: { properties?: Record<string, unknown> }[];
		};

		const { normalizeSlug } = await import('$lib/data/internal/slug.js');
		const bezirkCodeToSlug = new Map<string, string>();
		for (const f of bezirkeFc.features) {
			const props = f.properties ?? {};
			const schluessel = props.Schluessel_gesamt;
			const name = props.Gemeinde_name;
			if (typeof schluessel === 'string' && typeof name === 'string') {
				bezirkCodeToSlug.set(schluessel.slice(-2), normalizeSlug(name));
			}
		}

		const scores = new Map<string, number>();
		if (process.env.DATABASE_URL) {
			try {
				const { getDb } = await import('$lib/server/db/index.js');
				const { kiezScore } = await import('$lib/server/db/schema/index.js');
				const rows = await getDb()
					.select({ slug: kiezScore.slug, composite: kiezScore.composite })
					.from(kiezScore);
				for (const r of rows) {
					if (typeof r.composite === 'number') scores.set(r.slug, Math.round(r.composite));
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				process.stderr.write(`[bezirk-page] WARN: kiez_score unavailable (${msg})\n`);
			}
		}

		const all = buildKiezeInBezirk({
			lorFeatureCollection: lorFc,
			bezirkCodeToSlug,
			scores,
			bezirkSlug
		});
		return pickTop(all, 5);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[bezirk-page] WARN: kieze-load failed (${msg})\n`);
		return [];
	}
}

export const load: PageServerLoad = async ({ params, fetch }) => {
	const slug = params.slug;
	let profile: BezirkProfile;
	try {
		profile = await getBezirkProfile(getLocale() as 'de' | 'en', slug, fetch);
	} catch {
		throw error(404, `Bezirk ${slug} nicht gefunden`);
	}
	const { getProfileParagraphs } = await import('$lib/server/profile/get-profile.js');
	const [stats, faq, kieze, rank, comparisonMap, profileProse] = await Promise.all([
		tryLoadBezirkStats(slug),
		tryLoadFaq(slug),
		tryLoadKieze(slug),
		tryLoadBezirkRank(slug),
		tryLoadBezirkComparison(slug),
		getProfileParagraphs('bezirk', slug)
	]);
	const comparison: ComparisonDimRow[] = SCORE_DIMS.map(({ key, label }) => {
		const cmp = comparisonMap?.get(key);
		const rk = rank?.get(key);
		return {
			label,
			value: cmp?.bezirkValue ?? null,
			berlinMedian: cmp?.berlinMedian ?? null,
			rang: rk?.rang ?? null,
			quartil: rk?.quartil ?? null,
			total: rk?.total ?? 0
		};
	});
	const data: BezirkPageData = { profile, stats, faq, kieze, comparison, profileProse };
	return data;
};
