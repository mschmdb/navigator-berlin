import { dev } from '$app/environment';

/**
 * Cache-Header der Wahl-API-Routen: 1h public-Cache in Produktion (die
 * Daten aendern sich nur per Deploy/Ingest), im Dev-Modus no-store --
 * sonst bedient der Browser nach lokalen Daten-Rebuilds bis zu einer
 * Stunde alte Responses aus dem HTTP-Cache (Live-Fund 20.09.: frisch
 * ingestete BVV-Anteile blieben im Dev unsichtbar, weil jede Toggle-
 * Navigation den gecachten Alt-Stand traf).
 */
export function wahlCacheHeaders(): Record<string, string> {
	return { 'cache-control': dev ? 'no-store' : 'public, max-age=3600' };
}
