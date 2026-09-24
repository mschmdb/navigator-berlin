import { parseWahlSlug, buildWahlSlug } from '$lib/data/wahl-slug.js';

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

export function renamedRouteRedirectTarget(pathname: string): string | null {
	const normalized = pathname.replace(/\/+$/, '') || '/';
	return RENAMED_ROUTES.get(normalized) ?? resolveWahlRedirect(normalized);
}
