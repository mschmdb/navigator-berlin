import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';

/**
 * Story 6.4 AC-1: Sitemap-Source für Per-Wahl-Detail-Pages.
 *
 * Slug-Format `{jahr}-{typ}[-{stimmtyp}]`:
 * - BTW/AGH: `2025-btw-zweitstimme`, `2025-btw-erststimme` etc.
 * - BVV: `2023-bvv` (einstimme implizit).
 *
 * Wahl-Daten sind statisch (Wahljahr abgeschlossen) → `changefreq=yearly`,
 * `lastmod` = Wahljahr-01-01.
 *
 * Phase 1 DE-only.
 */

const PRIORITY = 0.7;

export type WahlSitemapEntry = {
	readonly jahr: number;
	readonly typ: 'btw' | 'agh' | 'bvv';
	readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
};

function slugFor(w: WahlSitemapEntry): string {
	if (w.typ === 'bvv') return `${w.jahr}-bvv`;
	return `${w.jahr}-${w.typ}-${w.stimmtyp}`;
}

export interface BuildWahlSitemapEntriesInput {
	readonly origin: string;
	readonly wahlen: readonly WahlSitemapEntry[];
}

export function buildWahlSitemapEntries(input: BuildWahlSitemapEntriesInput): SitemapEntry[] {
	const origin = input.origin.replace(/\/+$/, '');
	return input.wahlen.map((w) => ({
		loc: `${origin}/wahl/${slugFor(w)}`,
		lastmod: `${w.jahr}-01-01`,
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
