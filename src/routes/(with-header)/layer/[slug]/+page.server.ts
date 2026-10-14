import { error } from '@sveltejs/kit';
import { loadManifest } from '$lib/data/manifest.js';
import { buildLayerDetail, type LayerDetail } from '$lib/data/get-layer-detail.js';
import { hasLayerDetailPage } from '$lib/data/layer-visibility.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
import { m } from '$lib/paraglide/messages.js';
import { loadLayerKiezRanking } from '$lib/server/layer-kiez-ranking-loader.js';
import type { LayerKiezRanking } from '$lib/data/layer-kiez-ranking.js';
import { getFaqForPage } from '$lib/server/db/queries/get-faq-qna.js';
import type { FaqEntry } from '$lib/data/types.js';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

/**
 * Story 2.1 T6: enumerate all layer slugs from MANIFEST.json at build time so
 * every `/layer/{slug}` page is prerendered. The manifest is loaded via Node's
 * `fs` import here (build-time) because SvelteKit calls `entries` without a
 * `fetch` context.
 *
 * Story 5.9: konvertiert zu +page.server.ts damit FAQ-Rows aus Postgres
 * geladen werden koennen (AC-2 FAQPage-JSON-LD via FaqSection-Komponente).
 */
export const entries: EntryGenerator = async () => {
	const { readFile } = await import('node:fs/promises');
	const { resolve: pathResolve } = await import('node:path');
	const manifestPath = pathResolve(process.cwd(), 'static/layers/MANIFEST.json');
	const raw = await readFile(manifestPath, 'utf-8');
	const manifest = JSON.parse(raw) as {
		layers: { slug: string; inspectorRelevant?: boolean; mapRelevant?: boolean }[];
	};
	return manifest.layers.filter((l) => hasLayerDetailPage(l)).map((l) => ({ slug: l.slug }));
};

export type LayerPageData = {
	readonly detail: LayerDetail;
	readonly faq: readonly FaqEntry[];
	readonly faqLocale: Locale;
	readonly ranking: LayerKiezRanking | null;
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	const manifest = await loadManifest(fetch);
	const detail: LayerDetail | null = buildLayerDetail(params.slug, getLocale(), manifest);
	if (!detail) error(404, m.layer_page_not_found({ slug: params.slug }, { locale: getLocale() }));
	const [faq, ranking] = await Promise.all([
		getFaqForPage({ pageType: 'layer', slug: params.slug, locale: getLocale() }),
		loadLayerKiezRanking(params.slug)
	]);
	const data: LayerPageData = { detail, faq: faq.items, faqLocale: faq.locale, ranking };
	return data;
};
