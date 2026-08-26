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
	createSetFinderWeightsTool,
	createGetFinderStateTool,
	type ElectionListEntry,
	type ApplyFinderWeightsResult
} from './tools/index.js';
import type { FinderWeights } from '$lib/components/atlas/internal/kiez-finder-engine.js';
import type { FinderBridgeSnapshot } from '$lib/state/finder-bridge.svelte.js';
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
			annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
		},
		options?: { signal?: AbortSignal }
	): void | Promise<void>;
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
	/** Finder-Kollaboration (WebMCP Challenge 2026): Agent stellt Regler. */
	readonly applyFinderWeights: (
		partial: Partial<FinderWeights>
	) => Promise<ApplyFinderWeightsResult>;
	readonly readFinderState: () => FinderBridgeSnapshot;
}

export interface WebMcpServerHandle {
	readonly specVersion: string;
	readonly toolNames: readonly string[];
	/** Auf welcher Surface die Tools registriert wurden. */
	readonly surface: 'document' | 'navigator';
	/** true, wenn erst der @mcp-b/global-Polyfill die API bereitstellte. */
	readonly viaPolyfill: boolean;
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

function serializeReason(grund: unknown): string {
	if (grund instanceof Error) return grund.message;
	if (typeof grund === 'string') return grund;
	try {
		return JSON.stringify(grund);
	} catch {
		return String(grund);
	}
}

function registerToolOnContext(
	mc: ModelContextSurface,
	tool: WebMcpToolDefinition,
	signal: AbortSignal
): void | Promise<void> {
	return mc.registerTool(
		{
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema,
			execute: (args) => tool.handler(args),
			annotations: { readOnlyHint: tool.readOnly === true }
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
	const viaPolyfill = !mc;
	if (!mc) {
		await config.polyfillLoader(navigator);
		mc = dokument.modelContext ?? navigator.modelContext;
	}
	const surface: 'document' | 'navigator' = dokument.modelContext ? 'document' : 'navigator';
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
		createGetVotingDistrictGeometryTool({ fetchGeometry: config.fetchVotingDistrictGeometry }),
		createSetFinderWeightsTool({ applyFinderWeights: config.applyFinderWeights }),
		createGetFinderStateTool({ readFinderState: config.readFinderState })
	];

	const controller = new AbortController();
	// Spec: registerTool liefert Promise<undefined>. Erst wenn der Browser
	// alle Registrierungen angenommen hat, gilt der Server als gemountet;
	// eine Ablehnung soll den Aufrufer erreichen statt still zu versanden,
	// und zwar mit Tool-Name und lesbarem Grund (native Implementierungen
	// rejecten teils mit Plain-Objects, die als [object Object] enden).
	await Promise.all(
		tools.map(async (tool) => {
			try {
				await registerToolOnContext(mc, tool, controller.signal);
			} catch (grund) {
				throw new Error(`registerTool('${tool.name}') rejected: ${serializeReason(grund)}`);
			}
		})
	);

	return {
		specVersion: WEBMCP_SPEC_VERSION,
		toolNames: tools.map((t) => t.name),
		surface,
		viaPolyfill,
		unregister: () => controller.abort()
	};
}
