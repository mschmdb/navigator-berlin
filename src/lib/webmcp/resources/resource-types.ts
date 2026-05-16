/**
 * Resource-Read-Type für `navigator://`-Resources.
 *
 * Resources sind read-only Mirrors aus dem UI-/URL-State.
 */

import type { JsonValue } from '../internal/json-types.js';

export interface WebMcpResourceRead {
	readonly uri: string;
	readonly mimeType: 'application/json';
	readonly content: JsonValue;
}

export interface WebMcpResourceDescriptor {
	readonly uriTemplate: string;
	readonly name: string;
	readonly description: string;
}
