/**
 * App-Mode: dieselbe Codebase, dasselbe Deployment, aber per Host reduzierbar auf das
 * Hitze-/Kühle-Orte-Angebot (Subdomain hitze.navigator.berlin). Zentrale Stelle, damit
 * kein verstreutes `if (hitze)` durch die App wandert. Kein zweites Repo, kein Fork.
 */
export type AppMode = 'default' | 'hitze' | 'kaelte';

const HITZE_HOST_PREFIX = 'hitze.';
const KAELTE_HOST_PREFIX = 'kaelte.';

/**
 * Bestimmt den App-Modus. Priorität: expliziter Override (Env/Query, für lokales Testen)
 * vor Host-Erkennung. Unbekannter Override wird ignoriert (Fallback auf Host).
 */
export function resolveAppMode(host: string | null | undefined, override?: string | null): AppMode {
	if (override === 'hitze' || override === 'kaelte' || override === 'default') return override;
	const h = (host ?? '').toLowerCase();
	if (h.startsWith(HITZE_HOST_PREFIX)) return 'hitze';
	if (h.startsWith(KAELTE_HOST_PREFIX)) return 'kaelte';
	return 'default';
}

/** Interne Ziel-Route der Kälte-Subdomain. */
export const KAELTE_ROUTE = '/kaelte';

/**
 * Reroute-Entscheidung für die Kälte-Subdomain, analog zu {@link hitzeReroute}: rendert
 * `/kaelte` an der Wurzel ohne Redirect. Kein Override, nur der Host entscheidet.
 */
export function kaelteReroute(url: URL): string | null {
	if (resolveAppMode(url.host) !== 'kaelte') return null;
	if (url.pathname === '/') return KAELTE_ROUTE;
	return null;
}

export function isHitzeMode(mode: AppMode): boolean {
	return mode === 'hitze';
}

/** Interne Ziel-Route der Hitze-Subdomain. */
export const HITZE_ROUTE = '/hitze';

/**
 * Reroute-Entscheidung für die Hitze-Subdomain: rendert die dedizierte /hitze-Route an der
 * Wurzel, ohne die URL zu ändern (SEO: eigene kanonische Root-URL, kein Redirect). Gibt null
 * zurück, wenn keine Hitze-Weiche greift (dann übernimmt die normale Reroute-Logik).
 */
export function hitzeReroute(url: URL, override?: string | null): string | null {
	if (resolveAppMode(url.host, override) !== 'hitze') return null;
	if (url.pathname === '/') return HITZE_ROUTE;
	return null;
}

/**
 * Pfad für den Plausible-Pageview. Die Subdomain-Wurzeln rendern per Reroute `/hitze` bzw.
 * `/kaelte`, die URL bleibt `/`. Gibt `undefined` zurück, wenn der echte Pfad gelten soll.
 */
export function pageviewPathFor(url: URL): string | undefined {
	return hitzeReroute(url) ?? kaelteReroute(url) ?? undefined;
}
