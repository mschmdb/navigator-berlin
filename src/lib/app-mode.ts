/**
 * App-Mode: dieselbe Codebase, dasselbe Deployment, aber per Host reduzierbar auf das
 * Hitze-/Kühle-Orte-Angebot (Subdomain hitze.navigator.berlin). Zentrale Stelle, damit
 * kein verstreutes `if (hitze)` durch die App wandert. Kein zweites Repo, kein Fork.
 */
export type AppMode = 'default' | 'hitze' | 'kaelte' | 'stories';

const HITZE_HOST_PREFIX = 'hitze.';
const KAELTE_HOST_PREFIX = 'kaelte.';
const STORIES_HOST_PREFIX = 'stories.';

/**
 * Bestimmt den App-Modus. Priorität: expliziter Override (Env/Query, für lokales Testen)
 * vor Host-Erkennung. Unbekannter Override wird ignoriert (Fallback auf Host).
 */
export function resolveAppMode(host: string | null | undefined, override?: string | null): AppMode {
	if (override === 'hitze' || override === 'kaelte' || override === 'default') return override;
	const h = (host ?? '').toLowerCase();
	if (h.startsWith(HITZE_HOST_PREFIX)) return 'hitze';
	if (h.startsWith(KAELTE_HOST_PREFIX)) return 'kaelte';
	if (h.startsWith(STORIES_HOST_PREFIX)) return 'stories';
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

/** Interne Ziel-Route der Stories-Subdomain. */
export const STORIES_ROUTE = '/stories';

/**
 * Reroute-Entscheidung für die Stories-Subdomain, analog zu {@link kaelteReroute}: rendert
 * `/stories` an der Wurzel ohne Redirect. Kein Override, nur der Host entscheidet.
 */
export function storiesReroute(url: URL): string | null {
	if (resolveAppMode(url.host) !== 'stories') return null;
	// `/en` und `/en/` sind die englische Wurzel. Die Locale liest Paraglide aus der URL.
	if (url.pathname === '/' || url.pathname === '/en' || url.pathname === '/en/') {
		return STORIES_ROUTE;
	}
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
 * Pfad für den Plausible-Pageview. Die Subdomain-Wurzeln rendern per Reroute `/hitze`,
 * `/kaelte` bzw. `/stories`, die URL bleibt `/`. Gibt `undefined` zurück, wenn der echte Pfad gelten soll.
 */
export function pageviewPathFor(url: URL): string | undefined {
	return hitzeReroute(url) ?? kaelteReroute(url) ?? storiesReroute(url) ?? undefined;
}

const MODE_ONLY_LAYERS: Readonly<Record<string, AppMode>> = {
	'kuehle-orte': 'hitze',
	'waerme-orte': 'kaelte'
};

/** Modus, der den Layer freischaltet. `null`: Layer gehört keinem Modus (überall verfügbar). */
export function modeForLayer(slug: string): AppMode | null {
	return Object.hasOwn(MODE_ONLY_LAYERS, slug) ? MODE_ONLY_LAYERS[slug]! : null;
}

/** Kühle Orte nur im Hitze-, Warme Orte nur im Kälte-Modus, alle anderen Layer überall. */
export function isLayerAvailableInMode(slug: string, mode: AppMode): boolean {
	const required = modeForLayer(slug);
	return required === null || required === mode;
}

/** Alter Link ohne `mode`: der erste Modus-Layer bestimmt den nachzuziehenden Modus. */
export function resolveLayerModeCatchUp(slugs: readonly string[]): AppMode | null {
	for (const slug of slugs) {
		const mode = modeForLayer(slug);
		if (mode) return mode;
	}
	return null;
}

/** Gültiger `mode`-Query-Wert. `stories` fehlt bewusst: Der Modus kommt nur über den Host. */
function isAppModeValue(value: string | null | undefined): value is AppMode {
	return value === 'hitze' || value === 'kaelte' || value === 'default';
}

export interface ExplorerEntry {
	/** Nachzuziehender Modus (alter Link ohne gültigen `mode`), sonst `null`. */
	catchUpMode: AppMode | null;
	/** URL-Layer, gefiltert auf den wirksamen Modus. */
	layers: string[];
	/** `true`, wenn die URL angepasst werden muss (Modus ergänzt oder Layer entfernt). */
	rewrite: boolean;
}

/** Einstiegslogik des Explorers: Modus-Nachzug und Layer-Filter für die URL-Layer. */
export function resolveExplorerEntry(
	urlLayers: readonly string[],
	appMode: AppMode,
	rawModeParam: string | null | undefined
): ExplorerEntry {
	const catchUpMode =
		!isAppModeValue(rawModeParam) && (appMode === 'default' || appMode === 'stories')
			? resolveLayerModeCatchUp(urlLayers)
			: null;
	const effectiveMode = catchUpMode ?? appMode;
	const layers = urlLayers.filter((slug) => isLayerAvailableInMode(slug, effectiveMode));
	return {
		catchUpMode,
		layers,
		rewrite: catchUpMode !== null || layers.length !== urlLayers.length
	};
}
