import { error } from '@sveltejs/kit';
import { loadManifest } from '$lib/data/manifest.js';
import { buildLayerDetail, type LayerDetail } from '$lib/data/get-layer-detail.js';
import { getLocale } from '$lib/paraglide/runtime.js';
import { getFaqQna } from '$lib/server/db/queries/get-faq-qna.js';
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
	const manifest = JSON.parse(raw) as { layers: { slug: string }[] };
	return manifest.layers.map((l) => ({ slug: l.slug }));
};

async function tryLoadFaq(slug: string): Promise<FaqEntry[]> {
	if (!process.env.DATABASE_URL) return [];
	try {
		const rows = await getFaqQna({ pageType: 'layer', slug, locale: 'de' });
		return rows.map((r) => ({ question: r.question, answer: r.answer }));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[layer-page] WARN: faq_qna unavailable (${msg})\n`);
		return [];
	}
}

export type LayerPageData = {
	readonly detail: LayerDetail;
	readonly faq: readonly FaqEntry[];
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	const manifest = await loadManifest(fetch);
	const detail: LayerDetail | null = buildLayerDetail(params.slug, getLocale(), manifest);
	if (!detail) error(404, `Layer ${params.slug} nicht gefunden`);
	const faq = await tryLoadFaq(params.slug);
	const data: LayerPageData = { detail, faq };
	return data;
};
