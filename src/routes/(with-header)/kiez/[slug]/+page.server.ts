import { error } from '@sveltejs/kit';
import { getKiezProfile } from '$lib/data/get-kiez-profile.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
import { m } from '$lib/paraglide/messages.js';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import { getFaqForPage } from '$lib/server/db/queries/get-faq-qna.js';
import { buildKiezeInBezirk, pickSiblings, type KiezRef } from '$lib/data/get-kieze-in-bezirk.js';
import { normalizeSlug } from '$lib/data/internal/slug.js';
import { featureFlags } from '$lib/data/feature-flags.js';
import { SCORE_DIMENSION_KEYS, type ComparisonDimRow } from '$lib/data/comparison-types.js';
import type { WahlVerlaufRow } from '$lib/components/atlas/kiez-wahl-verlauf.svelte';
import type { KiezStats } from '$lib/server/db/queries/get-kiez-stats.js';
import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';
import type { KiezProfile, FaqEntry } from '$lib/data/types.js';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

/**
 * Story 2.4 T1.1: 143 prerendered Kiez-Routes (Variante A LOR-Bezirksregion
 * 2021, User-Lock 2026-05-16), je einmal DE + einmal `/en` (Crawl-Links im
 * Layout, ADR-005). i18n Block B4a übersetzt den Seitenrahmen; Prosa
 * (`profileProse`) und FAQ-Inhalte (`faq_qna`) kommen in der Seiten-Locale,
 * mit DE-Fallback (Blocks C3, C5).
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

async function tryLoadKiezRank(slug: string) {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getKiezRank } = await import('$lib/server/db/queries/get-kiez-rank.js');
		return await getKiezRank(slug);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-page] WARN: kiez_rank unavailable (${msg})\n`);
		return null;
	}
}

async function tryLoadKiezComparison(slug: string) {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getKiezComparison } = await import('$lib/server/db/queries/get-kiez-comparison.js');
		return await getKiezComparison(slug);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-page] WARN: kiez_comparison unavailable (${msg})\n`);
		return null;
	}
}

// i18n Block B4a: geteilte Zuordnung camelCase-Datenschlüssel → hyphenierter
// KiezScoreDimension-Anzeige-Schlüssel, siehe `comparison-types.ts`
// (Review-Fund: vormals 3x dupliziert -- hier, in `bezirk/[slug]/+page.server.ts`
// und `kiez-hero.svelte`).
const SCORE_DIMS = SCORE_DIMENSION_KEYS;

export type KiezPageData = {
	readonly profile: KiezProfile;
	readonly stats: KiezStats | null;
	readonly score: KiezScore | null;
	readonly faq: readonly FaqEntry[];
	readonly faqLocale: Locale;
	readonly siblings: readonly KiezRef[];
	readonly wahlVerlauf: readonly WahlVerlaufRow[];
	readonly comparison: readonly ComparisonDimRow[];
	readonly compositeRank: { readonly rang: number | null; readonly total: number };
	readonly profileProse: readonly string[];
	readonly profileLocale: Locale;
};

interface WahlTrendVariant {
	readonly key: string;
	readonly typ: 'btw' | 'agh' | 'bvv';
	readonly stimmtyp: 'zweitstimme' | 'einstimme';
}

// i18n Block B4a: liefert nur noch Schlüssel (Boundary „Server liefert
// Schlüssel, der Client baut die Labels", analog `berlin-wahlen/[slug]`).
// `kiez-wahl-verlauf.svelte` löst `typ`/`stimmtyp` über eigene, PLURAL-Messages
// auf (Bundestagswahlen/Zweitstimmen) -- nicht über `wahl-labels.ts`, das
// SINGULAR liefert.
const WAHL_TREND_VARIANTS: readonly WahlTrendVariant[] = [
	{ key: 'btw', typ: 'btw', stimmtyp: 'zweitstimme' },
	{ key: 'agh', typ: 'agh', stimmtyp: 'zweitstimme' },
	{ key: 'bvv', typ: 'bvv', stimmtyp: 'einstimme' }
];

function reduceTopPerYear(
	points: ReadonlyArray<{ jahr: number; parteiKurzname: string; anteil: number }>
): { jahr: number; parteiKurzname: string }[] {
	const byYear = new Map<number, { parteiKurzname: string; anteil: number }>();
	for (const p of points) {
		const current = byYear.get(p.jahr);
		if (!current || p.anteil > current.anteil) {
			byYear.set(p.jahr, { parteiKurzname: p.parteiKurzname, anteil: p.anteil });
		}
	}
	return Array.from(byYear.entries())
		.map(([jahr, v]) => ({ jahr, parteiKurzname: v.parteiKurzname }))
		.sort((a, b) => a.jahr - b.jahr);
}

async function tryBuildWahlVerlauf(kiezSlug: string): Promise<KiezPageData['wahlVerlauf']> {
	if (!featureFlags.crossLayerStoryBlock) return [];
	if (!process.env.DATABASE_URL) return [];
	try {
		const { getSparklineForKiez } =
			await import('$lib/server/db/queries/wahl/get-sparkline-for-kiez.js');

		const sparklinesByVariant = await Promise.all(
			WAHL_TREND_VARIANTS.map(async (v) => ({
				variant: v,
				sparkline: await getSparklineForKiez(kiezSlug, v.typ, v.stimmtyp, 5)
			}))
		);

		const out: WahlVerlaufRow[] = [];
		for (const { variant, sparkline } of sparklinesByVariant) {
			const top = reduceTopPerYear(
				sparkline.map((p) => ({
					jahr: p.jahr,
					parteiKurzname: p.parteiKurzname,
					anteil: p.anteil
				}))
			);
			if (top.length < 2) continue;
			out.push({
				key: variant.key,
				typ: variant.typ,
				stimmtyp: variant.stimmtyp,
				jahre: top
			});
		}
		return out;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-page] WARN: wahl-verlauf-build failed (${msg})\n`);
		return [];
	}
}

async function tryLoadSiblings(currentSlug: string, parentBezirkName: string): Promise<KiezRef[]> {
	if (!parentBezirkName) return [];
	const parentBezirkSlug = normalizeSlug(parentBezirkName);
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

		const bezirkCodeToSlug = new Map<string, string>();
		for (const f of bezirkeFc.features) {
			const props = f.properties ?? {};
			const schluessel = props.Schluessel_gesamt;
			const name = props.Gemeinde_name;
			if (typeof schluessel === 'string' && typeof name === 'string') {
				bezirkCodeToSlug.set(schluessel.slice(-2), normalizeSlug(name));
			}
		}

		const all = buildKiezeInBezirk({
			lorFeatureCollection: lorFc,
			bezirkCodeToSlug,
			scores: new Map(),
			bezirkSlug: parentBezirkSlug
		});
		return pickSiblings({ kieze: all, currentSlug }, 3);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-page] WARN: sibling-load failed (${msg})\n`);
		return [];
	}
}

export const load: PageServerLoad = async ({ params, fetch }) => {
	const slug = params.slug;
	let profile: KiezProfile;
	try {
		profile = await getKiezProfile(getLocale() as 'de' | 'en', slug, fetch);
	} catch {
		throw error(404, m.kiez_page_not_found({ slug }, { locale: getLocale() }));
	}
	const { getLocalizedProfile } = await import('$lib/server/profile/get-profile.js');
	const [stats, score, faqResult, siblings, wahlVerlauf, rank, comparisonMap, profileResult] =
		await Promise.all([
			tryLoadKiezStats(slug),
			tryLoadKiezScore(slug),
			getFaqForPage({ pageType: 'kiez', slug, locale: getLocale() }),
			tryLoadSiblings(slug, profile.bezirk),
			tryBuildWahlVerlauf(slug),
			tryLoadKiezRank(slug),
			tryLoadKiezComparison(slug),
			getLocalizedProfile('kiez', slug, getLocale())
		]);
	const comparison: ComparisonDimRow[] = SCORE_DIMS.map(({ field, key }) => {
		const cmp = comparisonMap?.get(field);
		const rk = rank?.get(field);
		return {
			key,
			value: (score?.[field as keyof KiezScore] as number | null | undefined) ?? null,
			bezirkMean: cmp?.bezirkMean ?? null,
			berlinMedian: cmp?.berlinMedian ?? null,
			rang: rk?.rang ?? null,
			quartil: rk?.quartil ?? null,
			total: rk?.total ?? 0
		};
	});
	const compositeRk = rank?.get('composite');
	const compositeRank = {
		rang: compositeRk?.rang ?? null,
		total: compositeRk?.total ?? 0
	};
	const data: KiezPageData = {
		profile,
		stats,
		score,
		faq: faqResult.items,
		faqLocale: faqResult.locale,
		siblings,
		wahlVerlauf,
		comparison,
		compositeRank,
		profileProse: profileResult.paragraphs,
		profileLocale: profileResult.locale
	};
	return data;
};
