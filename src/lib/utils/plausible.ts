/**
 * Typed wrapper for Plausible Analytics custom events.
 *
 * Plausible-Self-Host läuft auf p.fliege.dev (siehe Memory
 * `project_plausible_future`). Script-Tag in `src/app.html`. Diese Datei
 * stellt einen narrow-typed `trackEvent`-Helper, der die globale
 * `window.plausible`-Funktion (im Script-Tag-Stub initialisiert) aufruft.
 *
 * Keine Cookies, kein PII. Props sind editorial-freie Strings für
 * Goal-Funnel-Analyse in Plausible-UI.
 */

type EventName = 'Search' | 'Bookmark' | 'Compare' | 'Share' | 'Locate' | 'MapClick' | 'Finder';

interface PlausibleFn {
	(
		eventName: string,
		options?: { u?: string; url?: string; props?: Record<string, string | number | boolean> }
	): void;
}

declare global {
	interface Window {
		plausible?: PlausibleFn;
	}
}

export function trackEvent(
	name: EventName,
	props?: Record<string, string | number | boolean>
): void {
	if (typeof window === 'undefined') return;
	if (typeof window.plausible !== 'function') return;
	try {
		if (props && Object.keys(props).length > 0) {
			window.plausible(name, { props });
		} else {
			window.plausible(name);
		}
	} catch {
		/* analytics never breaks the app */
	}
}

/**
 * Manueller Pageview-Trigger. Wird aus dem Root-Layout via `afterNavigate`
 * gefeuert, da der Plausible-Script im `manual`-Mode kein Auto-Tracking
 * macht. SvelteKit-Client-Navigationen würden sonst nicht erfasst.
 */
export function trackPageview(path?: string): void {
	if (typeof window === 'undefined') return;
	if (typeof window.plausible !== 'function') return;
	try {
		// Hitze-Subdomain reroutet `/` → `/hitze` ohne URL-Wechsel. Plausible würde sonst die
		// tatsächliche URL `/` tracken (mit der Homepage vermischt). Custom-Location-Override:
		// die alte Plausible-Script-API (p.fliege.dev) liest `u`, die neue `url` → beide setzen.
		if (path) {
			const u = `${window.location.origin}${path}${window.location.search}`;
			window.plausible('pageview', { u, url: u });
		} else {
			window.plausible('pageview');
		}
	} catch {
		/* analytics never breaks the app */
	}
}
