/**
 * Story 3 (Portal-Skeleton /berlin-wahlen): dedupliziert Quelle+Lizenz aus
 * der `/api/wahl/list`-Antwort für das Quellen-Akkordeon (`portal-quellen.svelte`).
 * Pure Funktion, testbar ohne Component-Mount.
 */

export interface WahlPortalQuelleInput {
	readonly sourceName: string;
	readonly license: string;
}

export interface WahlPortalQuelle {
	readonly name: string;
	readonly license: string;
}

export function deriveQuellen(entries: readonly WahlPortalQuelleInput[]): WahlPortalQuelle[] {
	const seen = new Map<string, WahlPortalQuelle>();
	for (const entry of entries) {
		const key = `${entry.sourceName}__${entry.license}`;
		if (!seen.has(key)) {
			seen.set(key, { name: entry.sourceName, license: entry.license });
		}
	}
	return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
