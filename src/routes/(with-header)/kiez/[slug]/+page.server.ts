import { error } from '@sveltejs/kit';
import { getKiezProfile } from '$lib/data/get-kiez-profile.js';
import { getLocale } from '$lib/paraglide/runtime.js';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import { getFaqQna } from '$lib/server/db/queries/get-faq-qna.js';
import {
	buildKiezeInBezirk,
	pickSiblings,
	type KiezRef
} from '$lib/data/get-kieze-in-bezirk.js';
import { normalizeSlug } from '$lib/data/internal/slug.js';
import { featureFlags } from '$lib/data/feature-flags.js';
import type { WahlVerlaufRow } from '$lib/components/atlas/kiez-wahl-verlauf.svelte';
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
	readonly siblings: readonly KiezRef[];
	readonly wahlVerlauf: readonly WahlVerlaufRow[];
};

interface WahlTrendVariant {
	readonly key: string;
	readonly typ: 'btw' | 'agh' | 'bvv';
	readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	readonly wahlTypLabel: string;
	readonly stimmtypLabel: string;
}

const WAHL_TREND_VARIANTS: readonly WahlTrendVariant[] = [
	{
		key: 'btw',
		typ: 'btw',
		stimmtyp: 'zweitstimme',
		wahlTypLabel: 'Bundestagswahlen',
		stimmtypLabel: 'Zweitstimmen'
	},
	{
		key: 'agh',
		typ: 'agh',
		stimmtyp: 'zweitstimme',
		wahlTypLabel: 'Abgeordnetenhauswahlen',
		stimmtypLabel: 'Zweitstimmen'
	},
	{
		key: 'bvv',
		typ: 'bvv',
		stimmtyp: 'einstimme',
		wahlTypLabel: 'BVV-Wahlen',
		stimmtypLabel: 'Stimmen'
	}
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
		const { getSparklineForKiez } = await import(
			'$lib/server/db/queries/wahl/get-sparkline-for-kiez.js'
		);

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
				wahlTypLabel: variant.wahlTypLabel,
				stimmtypLabel: variant.stimmtypLabel,
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
		throw error(404, `Kiez ${slug} nicht gefunden`);
	}
	const [stats, score, faq, siblings, wahlVerlauf] = await Promise.all([
		tryLoadKiezStats(slug),
		tryLoadKiezScore(slug),
		tryLoadFaq(slug),
		tryLoadSiblings(slug, profile.bezirk),
		tryBuildWahlVerlauf(slug)
	]);
	const data: KiezPageData = { profile, stats, score, faq, siblings, wahlVerlauf };
	return data;
};
