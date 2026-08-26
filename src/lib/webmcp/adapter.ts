/**
 * WebMCP-Adapter-Schicht.
 *
 * - Feature-detect in Spec-Reihenfolge: `document.modelContext` (aktuelle
 *   Spec-Location, ChatGPT-In-App-Browser und Chrome 149+) zuerst, dann
 *   `navigator.modelContext` (ältere native API, Chrome 146).
 * - Bei fehlender API: dynamic-import des `@mcp-b/global`-Polyfills,
 *   danach werden beide Surfaces erneut geprüft.
 * - Registriert die navigator.berlin-Tools auf der Spec-konformen
 *   `registerTool`-Schnittstelle.
 *
 * Spec-Version-Pin via `WEBMCP_SPEC_VERSION`. Bei Breaking-Change ändert
 * sich nur dieser Adapter, nicht die Tool-Implementationen.
 *
 * Architecture-Boundary: dieser Adapter delegiert alle Daten-Reads via
 * Dependency-Injection (`config.*` Functions). Keine direkten Imports aus
 * `$lib/data/` (siehe `architecture.md` Z. 1463).
 */

import { WEBMCP_SPEC_VERSION } from './internal/spec-version.js';
import {
	createAddressLookupTool,
	createCrossLayerQueryTool,
	createListLayersAtPointTool,
	createGetKiezProfileTool,
	createGetLayerMetadataTool,
	createListElectionsTool,
	createGetElectionResultTool,
	createCompareElectionsTool,
	createGetVotingDistrictGeometryTool,
	type ElectionListEntry
} from './tools/index.js';
import type { WebMcpToolDefinition } from './internal/tool-types.js';
import type { GeocodeSuggestion, LayerHit, LayerMetadata, KiezProfile, Locale } from '$lib/data';
import type { LayerMethodology } from '$lib/data/layer-methodology.js';
import type { WahlResultsAtPoint } from '$lib/data/get-wahl-results-at-point.js';
import type { JsonObject } from './internal/json-types.js';

/** Minimaler Subset der nativen `ModelContext`-API, den der Adapter nutzt. */
export interface ModelContextSurface {
	registerTool(
		tool: {
			name: string;
			description?: string;
			inputSchema?: Readonly<Record<string, unknown>>;
			execute: (args: unknown) => Promise<unknown>;
		},
		options?: { signal?: AbortSignal }
	): void;
}

export interface NavigatorWithModelContext {
	modelContext?: ModelContextSurface;
}

export interface WebMcpServerConfig {
	/**
	 * Liefert das `navigator`-Objekt. Im Browser default `globalThis.navigator`,
	 * in Tests ein Fake.
	 */
	readonly navigatorProvider: () => NavigatorWithModelContext;
	/**
	 * Liefert das `document`-Objekt (aktuelle Spec-Location der API).
	 * Optional für Rückwärtskompatibilität der Aufrufer; ohne Provider
	 * prüft der Adapter nur `navigator`.
	 */
	readonly documentProvider?: () => NavigatorWithModelContext;
	/**
	 * Polyfill-Loader: Side-Effect-Function, die nach Aufruf
	 * `navigator.modelContext` bereitstellt. Default `loadMcpBGlobalPolyfill`.
	 */
	readonly polyfillLoader: (target: NavigatorWithModelContext) => Promise<void>;
	readonly geocode: (query: string) => Promise<GeocodeSuggestion[]>;
	readonly getLayersAtPoint: (lat: number, lng: number) => Promise<LayerHit[]>;
	readonly getKiezProfile: (locale: Locale, slug: string) => Promise<KiezProfile>;
	readonly getLayerMetadata: (slug: string) => LayerMetadata;
	readonly getLayerMethodology: (slug: string) => LayerMethodology | null;
	readonly loadManifest: () => Promise<unknown>;
	readonly defaultLocale: () => Locale;
	readonly fetchElections: () => Promise<readonly ElectionListEntry[]>;
	readonly fetchWahlResultsAtPoint: (
		lat: number,
		lng: number
	) => Promise<WahlResultsAtPoint | null>;
	readonly fetchVotingDistrictGeometry: (
		districtId: string,
		year: number
	) => Promise<JsonObject | null>;
}

export interface WebMcpServerHandle {
	readonly specVersion: string;
	readonly toolNames: readonly string[];
	unregister(): void;
}

/**
 * Default-Polyfill-Loader: dynamic-import `@mcp-b/global` und initialisiert
 * den Polyfill. Wird nur aufgerufen, wenn die native API fehlt.
 */
export async function loadMcpBGlobalPolyfill(target: NavigatorWithModelContext): Promise<void> {
	if (target.modelContext) return;
	const mod = await import('@mcp-b/global');
	mod.initializeWebModelContext({ autoInitialize: true });
}

function registerToolOnContext(
	mc: ModelContextSurface,
	tool: WebMcpToolDefinition,
	signal: AbortSignal
): void {
	mc.registerTool(
		{
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema,
			execute: (args) => tool.handler(args)
		},
		{ signal }
	);
}

export async function registerWebMcpServer(
	config: WebMcpServerConfig
): Promise<WebMcpServerHandle> {
	const navigator = config.navigatorProvider();
	const dokument = config.documentProvider?.() ?? {};
	let mc = dokument.modelContext ?? navigator.modelContext;
	if (!mc) {
		await config.polyfillLoader(navigator);
		mc = dokument.modelContext ?? navigator.modelContext;
	}
	if (!mc) {
		throw new Error(
			'Neither document.modelContext nor navigator.modelContext is available after polyfill load. WebMCP integration aborted.'
		);
	}

	const tools: WebMcpToolDefinition[] = [
		createAddressLookupTool({ geocode: config.geocode }),
		createCrossLayerQueryTool({ getLayersAtPoint: config.getLayersAtPoint }),
		createListLayersAtPointTool({ getLayersAtPoint: config.getLayersAtPoint }),
		createGetKiezProfileTool({
			getKiezProfile: config.getKiezProfile,
			defaultLocale: config.defaultLocale
		}),
		createGetLayerMetadataTool({
			getLayerMetadata: config.getLayerMetadata,
			getLayerMethodology: config.getLayerMethodology,
			loadManifest: config.loadManifest,
			defaultLocale: config.defaultLocale
		}),
		createListElectionsTool({ fetchElections: config.fetchElections }),
		createGetElectionResultTool({ fetchResultsAtPoint: config.fetchWahlResultsAtPoint }),
		createCompareElectionsTool({ fetchResultsAtPoint: config.fetchWahlResultsAtPoint }),
		createGetVotingDistrictGeometryTool({ fetchGeometry: config.fetchVotingDistrictGeometry })
	];

	const controller = new AbortController();
	for (const tool of tools) {
		registerToolOnContext(mc, tool, controller.signal);
	}

	return {
		specVersion: WEBMCP_SPEC_VERSION,
		toolNames: tools.map((t) => t.name),
		unregister: () => controller.abort()
	};
}
