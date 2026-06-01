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

export function renamedRouteRedirectTarget(pathname: string): string | null {
	const normalized = pathname.replace(/\/+$/, '') || '/';
	return RENAMED_ROUTES.get(normalized) ?? null;
}
