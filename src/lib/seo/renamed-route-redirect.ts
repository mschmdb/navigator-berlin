import { parseWahlSlug, buildWahlSlug } from '$lib/data/wahl-slug.js';
import { locales, baseLocale } from '$lib/paraglide/runtime';

/**
 * Renamed-route redirect resolver.
 *
 * Wenn eine indexierte Route umbenannt wird, 301-redirecten wir den alten Slug
 * auf den neuen, statt 404 zu liefern. Erhält Backlinks, Sitemap-Historie und
 * Suchmaschinen-Index.
 *
 * Operiert nur auf dem Pathname. Caller hängt die Original-Query wieder an.
 */
const RENAMED_ROUTES: ReadonlyMap<string, string> = new Map([
	// ADR-015: Ranking-Page heißt jetzt „Umwelt- & Infrastruktur-Score".
	['/wo-lebt-es-sich-gut', '/umwelt-infrastruktur-score'],
	// Phase-1 Score-Schema: Dimension „grün" + „hitze" zu einer Karte zusammengelegt.
	// Alter Layer-Detail-Slug wurde umbenannt (GSC-404 2026-06-01).
	['/layer/kiez-score-gruen', '/layer/kiez-score-gruen-hitze']
]);

/**
 * Story 16: `/wahl` zog komplett nach `/berlin-wahlen` um (Index → Portal,
 * `/wahl/<slug>` → `/berlin-wahlen/<slug>`). Eigene Funktion statt Einträgen
 * in `RENAMED_ROUTES`, weil der Slug-Teil pro Route validiert werden muss
 * (`parseWahlSlug`) statt eine exakte 1:1-Map-Lookup zu sein -- ein
 * ungültiger Slug soll 404 bleiben, nicht auf eine nicht-existente
 * Portal-Detailseite umleiten.
 *
 * Review-Fund: das Redirect-Ziel nutzte den rohen Slug aus der URL (`m[1]`)
 * wörtlich statt ihn über `buildWahlSlug(parseWahlSlug(...))` zu kanonisieren
 * -- nicht-kanonische, aber gültige Kurzformen (`2023-agh` ohne Stimmtyp,
 * `2023-bvv-einstimme` mit überflüssigem Stimmtyp-Suffix) landeten damit auf
 * einer nicht existierenden Detailseite (404) statt auf der echten. Die alte
 * `/wahl/[slug]`-Seite defaultete Kurzformen ohne Stimmtyp bereits auf
 * Zweitstimme (`parseWahlSlug`s `stimmtyp ?? 'zweitstimme'`), das bleibt
 * über die Kanonisierung erhalten.
 */
export function resolveWahlRedirect(pathname: string): string | null {
	const p = pathname.replace(/\/$/, '') || '/';
	if (p === '/wahl') return '/berlin-wahlen';
	const m = p.match(/^\/wahl\/([^/]+)$/);
	if (!m) return null;
	const parsed = parseWahlSlug(m[1]);
	return parsed ? `/berlin-wahlen/${buildWahlSlug(parsed)}` : null;
}

/**
 * Splits an active, non-base locale prefix off `pathname` (e.g. `/en/wahl`
 * → `{ locale: 'en', rest: '/wahl' }`). `de` never carries a prefix (base
 * locale, default Paraglide pattern) so it never matches here; any locale
 * that isn't currently active has already 301'd away in
 * `handleStaleLocaleRedirect`, which runs before this hook.
 *
 * Matches the segment case-insensitively (`/EN/...` counts, like
 * `stale-locale-redirect.ts` already does) and canonicalizes the returned
 * `locale` to lowercase, so the 301 target always uses the canonical-case
 * prefix regardless of how the request spelled it (code review, 2026-09-26).
 */
function splitLocalePrefix(pathname: string): { locale: string | null; rest: string } {
	const firstSlash = pathname.indexOf('/', 1);
	const segment = firstSlash === -1 ? pathname.slice(1) : pathname.slice(1, firstSlash);
	const lowerSegment = segment.toLowerCase();
	if (lowerSegment !== baseLocale && (locales as readonly string[]).includes(lowerSegment)) {
		const rest = firstSlash === -1 ? '/' : pathname.slice(firstSlash);
		return { locale: lowerSegment, rest };
	}
	return { locale: null, rest: pathname };
}

/**
 * i18n Block A: renamed routes must redirect within their own locale, e.g.
 * `/en/wo-lebt-es-sich-gut` → `/en/umwelt-infrastruktur-score`, not onto the
 * DE canonical (decision Matze 26.09.2026, I/O-matrix "Umbenannte Route EN").
 */
export function renamedRouteRedirectTarget(pathname: string): string | null {
	const { locale, rest } = splitLocalePrefix(pathname);
	const normalized = rest.replace(/\/+$/, '') || '/';
	const target = RENAMED_ROUTES.get(normalized) ?? resolveWahlRedirect(normalized);
	if (target === null) return null;
	return locale ? `/${locale}${target}` : target;
}
