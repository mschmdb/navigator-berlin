import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';
import { buildWahlSlug } from '$lib/data/wahl-slug.js';

/**
 * Story 6.4 AC-1: Sitemap-Source für Per-Wahl-Detail-Pages.
 *
 * Slug-Format `{jahr}-{typ}[-{stimmtyp}]`:
 * - BTW/AGH: `2025-btw-zweitstimme`, `2025-btw-erststimme` etc.
 * - BVV: `2023-bvv` (einstimme implizit).
 *
 * Story 16: Detailseiten zogen von `/wahl/[slug]` nach `/berlin-wahlen/[slug]`.
 * `lastmod` bevorzugt `sourceUpdatedAt` (echter Ingest-Zeitstempel, z.B. für
 * die vorläufigen AGH/BVV-2026-Ergebnisse), fällt ohne diesen auf
 * `Wahljahr-01-01` zurück (abgeschlossene Wahlen ohne Re-Ingest-Historie).
 *
 * Phase 1 DE-only.
 */

const PRIORITY = 0.7;

export type WahlSitemapEntry = {
	readonly jahr: number;
	readonly typ: 'btw' | 'agh' | 'bvv';
	readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	/** Ingest-Zeitstempel (ISO-8601), sofern bekannt; sonst Jahres-Fallback. */
	readonly sourceUpdatedAt?: string | null;
};

export interface BuildWahlSitemapEntriesInput {
	readonly origin: string;
	readonly wahlen: readonly WahlSitemapEntry[];
}

export function buildWahlSitemapEntries(input: BuildWahlSitemapEntriesInput): SitemapEntry[] {
	const origin = input.origin.replace(/\/+$/, '');
	return input.wahlen.map((w) => ({
		loc: `${origin}/berlin-wahlen/${buildWahlSlug(w)}`,
		lastmod: w.sourceUpdatedAt ?? `${w.jahr}-01-01`,
		changefreq: 'yearly' as const,
		priority: PRIORITY
	}));
}

export const WAHL_DETAIL_SOURCE: SitemapSource = (ctx) => {
	if (ctx.locale !== 'de') return [];
	const wahlen = ctx.wahlen;
	if (!wahlen || wahlen.length === 0) return [];
	return buildWahlSitemapEntries({ origin: ctx.origin, wahlen });
};
