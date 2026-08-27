/**
 * Browser-only Mount-Helper: wird in `+layout.svelte` aufgerufen.
 *
 * Wires `$lib/data/`-Functions in den Adapter, ohne dass die Adapter-
 * oder Tool-Module selbst direkte Imports auf `$lib/data/` halten. So
 * bleibt die Architecture-Boundary `webmcp/ ↛ data/` (architecture.md
 * Z. 1463) im engeren Sinn intakt: `webmcp/tools/*` + `webmcp/adapter.ts`
 * kennen `$lib/data` nur als Type-Import, nicht als Runtime-Import.
 *
 * Erst der Mount-Layer (Composition-Root) verbindet beide Welten. Dieser
 * File ist explizit „Composition over isolation" und gehört konzeptionell
 * zur App-Wireup-Schicht (analog `+layout.svelte`).
 */

import { browser } from '$app/environment';
import { registerWebMcpServer, loadMcpBGlobalPolyfill } from './adapter.js';
import type { WebMcpServerHandle, NavigatorWithModelContext } from './adapter.js';
import type { ElectionListEntry } from './tools/index.js';
import type { WahlResultsAtPoint } from '$lib/data/get-wahl-results-at-point.js';
import type { JsonObject } from './internal/json-types.js';

async function fetchElectionsFromApi(): Promise<readonly ElectionListEntry[]> {
	const res = await fetch('/api/wahl/list');
	if (!res.ok) return [];
	const body = (await res.json()) as { elections?: ElectionListEntry[] };
	return body.elections ?? [];
}

async function fetchWahlResultsFromApi(
	lat: number,
	lng: number
): Promise<WahlResultsAtPoint | null> {
	const res = await fetch(
		`/api/wahl/results-at-point?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
	);
	if (!res.ok) return null;
	return (await res.json()) as WahlResultsAtPoint;
}

async function fetchVotingDistrictGeometryFromApi(
	districtId: string,
	year: number
): Promise<JsonObject | null> {
	const res = await fetch(
		`/api/wahl/geometry?district_id=${encodeURIComponent(districtId)}&year=${year}`
	);
	if (!res.ok) return null;
	const body = (await res.json()) as JsonObject & { error?: string };
	if (body.error === 'district_not_found') return null;
	return body;
}

let activeHandle: WebMcpServerHandle | null = null;

/**
 * Idempotent: zweiter Aufruf ignoriert den ersten und liefert das
 * vorhandene Handle zurück.
 */
export async function mountWebMcpServer(): Promise<WebMcpServerHandle | null> {
	if (!browser) return null;
	if (activeHandle) return activeHandle;

	// Lazy-Imports: kein Server-Bundling, kein direkter Adapter-Import auf $lib/data.
	const [
		{ geocodeAddress },
		{ getLayersAtPoint },
		{ getKiezProfile },
		{ getLayerMetadata },
		{ getLayerMethodology },
		{ loadManifest },
		{ getLocale },
		finderBridge
	] = await Promise.all([
		import('$lib/data/geocode.remote'),
		import('$lib/data/get-layers-at-point'),
		import('$lib/data/get-kiez-profile'),
		import('$lib/data/get-layer-metadata'),
		import('$lib/data/layer-methodology'),
		import('$lib/data/manifest'),
		import('$lib/paraglide/runtime'),
		import('$lib/state/finder-bridge.svelte')
	]);

	activeHandle = await registerWebMcpServer({
		navigatorProvider: () => navigator as unknown as NavigatorWithModelContext,
		// Aktuelle Spec-Location (ChatGPT-Browser, Chrome 149+): document.
		documentProvider: () => document as unknown as NavigatorWithModelContext,
		polyfillLoader: loadMcpBGlobalPolyfill,
		// SvelteKit-Remote-Query ist seit kit 2.70 direkt awaitable
		// (RemoteQuery<T> = Promise<T>), das frühere `.run()` entfiel.
		geocode: async (q) => await geocodeAddress({ q }),
		getLayersAtPoint: (lat, lng) => getLayersAtPoint(lat, lng),
		getKiezProfile: (locale, slug) => getKiezProfile(locale, slug),
		getLayerMetadata,
		getLayerMethodology,
		loadManifest: () => loadManifest(),
		defaultLocale: () => getLocale(),
		fetchElections: () => fetchElectionsFromApi(),
		fetchWahlResultsAtPoint: (lat, lng) => fetchWahlResultsFromApi(lat, lng),
		fetchVotingDistrictGeometry: (id, year) => fetchVotingDistrictGeometryFromApi(id, year),
		// Finder-Kollaboration: Agent-Gewichte in die Bridge, das Panel wendet
		// sie an. Ist der Finder nirgends gemountet, navigiert der Tool-Call
		// zur Explore-Seite; Top-Treffer liefert dann erst der nächste
		// get_finder_state (steht so in der Tool-Description).
		applyFinderWeights: async (partial, party) => {
			// Zählerstand VOR dem Schreibwunsch: nur so lässt sich die neue
			// Rechnung von der noch stehenden alten Rangliste unterscheiden.
			const seqVorher = finderBridge.readFinderPublishSeq();
			const merged = finderBridge.requestAgentWeights(partial, party);
			let navigation: 'none' | 'opened_finder' = 'none';
			if (!finderBridge.readFinderBridge().panelActive) {
				navigation = 'opened_finder';
				const { goto } = await import('$app/navigation');
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				await goto('/explore?finder=1');
			}
			// Auf die neue Panel-Rechnung warten: eine leere Liste treibt den
			// Agenten in eigene Nach-Recherche, eine veraltete lässt ihn die
			// alte Rangliste als neue melden (beides Prod-Läufe 26.08.).
			const topMatches = await finderBridge.waitForFinderTopMatches({ sinceSeq: seqVorher });
			const snap = finderBridge.readFinderBridge();
			return {
				weights: merged,
				// Effektive Partei aus der Bridge: das Panel führt sie, ein
				// Folge-Aufruf ohne `party` darf sie nicht aus dem Link kippen.
				party: snap.party,
				finderOpen: snap.panelActive,
				navigation,
				topMatches
			};
		},
		readFinderState: () => finderBridge.readFinderBridge()
	});
	return activeHandle;
}

export function unmountWebMcpServer(): void {
	if (!activeHandle) return;
	activeHandle.unregister();
	activeHandle = null;
}
