/**
 * Typed wrapper for Plausible Analytics custom events.
 *
 * Plausible-Self-Host läuft auf plausible.navigator.berlin (siehe Memory
 * `project_plausible_future`). Script-Tag in `src/app.html`. Diese Datei
 * stellt einen narrow-typed `trackEvent`-Helper, der die globale
 * `window.plausible`-Funktion (im Script-Tag-Stub initialisiert) aufruft.
 *
 * Keine Cookies, kein PII. Props sind editorial-freie Strings für
 * Goal-Funnel-Analyse in Plausible-UI.
 */

type EventName = 'Search' | 'Bookmark' | 'Compare' | 'Share' | 'Locate' | 'MapClick';

interface PlausibleFn {
	(eventName: string, options?: { props?: Record<string, string | number | boolean> }): void;
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
