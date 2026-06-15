/**
 * Public API der WebMCP-Adapter-Schicht.
 *
 * Nutzer:
 * - `src/routes/+layout.svelte` ruft `mountWebMcpServer()` client-side via $effect
 * - `scripts/build-webmcp-manifest.ts` ruft `buildWebMcpManifest()` für Build-Output
 * - `src/routes/webmcp-manifest.json/+server.ts` ruft `buildWebMcpManifest()` für Doppel-Serving
 */

export { registerWebMcpServer, loadMcpBGlobalPolyfill } from './adapter.js';
export type {
	WebMcpServerConfig,
	WebMcpServerHandle,
	ModelContextSurface,
	NavigatorWithModelContext
} from './adapter.js';
export { WEBMCP_SPEC_VERSION } from './internal/spec-version.js';
export {
	buildWebMcpManifest,
	type WebMcpManifest,
	type WebMcpManifestToolEntry,
	type WebMcpManifestResourceEntry,
	type WebMcpManifestPromptEntry
} from './internal/manifest-builder.js';
export { resolveResource, type ResourceContext } from './resources/resolve-resource.js';
export { mountWebMcpServer, unmountWebMcpServer } from './mount.js';
