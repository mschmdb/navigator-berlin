import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';
import { buildWahlSlug } from '$lib/data/wahl-slug.js';
import { localizedPathname } from '../canonical.js';
import type { Locale } from '$lib/paraglide/runtime';

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
 * i18n Block B: jede Detailseite ist im Übersetzungs-Register
 * (`translation-register.ts`) für `en` eingetragen, diese Source emittiert
 * deshalb für JEDE aktive Locale einen Eintrag mit locale-präfixiertem
 * `loc` (`localizedPathname`); `collectPrerenderedUrls` filtert nicht-
 * registrierte Locale/Pfad-Paare zentral heraus, kein lokaler
 * `ctx.locale`-Gate mehr nötig.
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
	readonly locale: Locale;
}

export function buildWahlSitemapEntries(input: BuildWahlSitemapEntriesInput): SitemapEntry[] {
	const origin = input.origin.replace(/\/+$/, '');
	return input.wahlen.map((w) => ({
		loc: `${origin}${localizedPathname(`/berlin-wahlen/${buildWahlSlug(w)}`, input.locale)}`,
		lastmod: w.sourceUpdatedAt ?? `${w.jahr}-01-01`,
		changefreq: 'yearly' as const,
		priority: PRIORITY
	}));
}

export const WAHL_DETAIL_SOURCE: SitemapSource = (ctx) => {
	const wahlen = ctx.wahlen;
	if (!wahlen || wahlen.length === 0) return [];
	return buildWahlSitemapEntries({ origin: ctx.origin, wahlen, locale: ctx.locale });
};
