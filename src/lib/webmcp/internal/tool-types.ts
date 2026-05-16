/**
 * WebMCP-Tool-Definition (lokal, framework-agnostic).
 *
 * Diese Form bleibt stabil, auch wenn der WebMCP-Polyfill oder die native
 * Spec sich ändern. Der Adapter ist dafür verantwortlich, die Definition
 * in die jeweils erwartete Polyfill-Shape zu transformieren.
 */

import type { JsonValue } from './json-types.js';

export interface WebMcpToolDefinition<TInput = unknown, TOutput = JsonValue> {
	/** snake_case-Name, z.B. `cross_layer_query`. */
	readonly name: string;
	/** Englische Beschreibung für LLM-Audience. Max 1-2 Sätze. */
	readonly description: string;
	/** JSON-Schema für Tool-Input. Wird ans Manifest exportiert. */
	readonly inputSchema: Readonly<Record<string, unknown>>;
	/** JSON-Schema für Tool-Output. Wird ans Manifest exportiert. */
	readonly outputSchema: Readonly<Record<string, unknown>>;
	/**
	 * Handler liefert serialisierbares JSON. Tools müssen alle Provenance-Felder
	 * (FR40) im Output durchreichen.
	 */
	readonly handler: (input: TInput) => Promise<TOutput>;
}
