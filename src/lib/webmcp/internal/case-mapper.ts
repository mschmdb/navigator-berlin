/**
 * Pure-Function-Helper: case-Mapping zwischen camelCase (TS-Codebase) und
 * snake_case (WebMCP-Spec-Konvention für Tool-Names + Param-Keys).
 *
 * Mapping passiert ausschließlich an der Tool-Boundary:
 * - Input-Args: snake → camel (Adapter ruft TS-Functions)
 * - Output-Body: camel → snake (Tool serialisiert für LLM-Audience)
 *
 * Keine externe Dependency. Tiefen-Limit verhindert Cycles.
 */

const MAX_DEPTH = 8;

export function camelToSnake(input: string): string {
	return input.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
}

export function snakeToCamel(input: string): string {
	return input.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== 'object') return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

export function mapKeysToSnake(value: unknown, depth = 0): unknown {
	if (depth > MAX_DEPTH) return value;
	if (Array.isArray(value)) {
		return value.map((item) => mapKeysToSnake(item, depth + 1));
	}
	if (isPlainObject(value)) {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			out[camelToSnake(k)] = mapKeysToSnake(v, depth + 1);
		}
		return out;
	}
	return value;
}

export function mapKeysToCamel(value: unknown, depth = 0): unknown {
	if (depth > MAX_DEPTH) return value;
	if (Array.isArray(value)) {
		return value.map((item) => mapKeysToCamel(item, depth + 1));
	}
	if (isPlainObject(value)) {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			out[snakeToCamel(k)] = mapKeysToCamel(v, depth + 1);
		}
		return out;
	}
	return value;
}
