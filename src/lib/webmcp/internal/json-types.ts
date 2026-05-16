/**
 * JSON-typesafe Values. Liefert Tool-Output-Typen ohne `any`.
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
	[key: string]: JsonValue | undefined;
}
export type JsonArray = JsonValue[];
