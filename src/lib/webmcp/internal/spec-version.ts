/**
 * Single Source of Truth für die WebMCP-Spec-Version dieses Adapters.
 *
 * Wird sowohl im Manifest (`webmcp-manifest.json`) ausgegeben als auch zur
 * Laufzeit als Marker für eine bestimmte Tool-Surface verwendet. Bei einem
 * Spec-Breaking-Change muss nur diese Konstante (plus der Adapter selbst)
 * angepasst werden, nicht die Tool-Implementierungen.
 *
 * Format: SemVer-String. Pre-1.0-Spec, deshalb 0.X.Y.
 *
 * Referenz: WebMCP-Spec https://github.com/MiguelsPizza/WebMCP
 * Polyfill: @mcp-b/global ~2.3.x (W3C Web Model Context API Polyfill)
 */
export const WEBMCP_SPEC_VERSION = '0.3.0';
