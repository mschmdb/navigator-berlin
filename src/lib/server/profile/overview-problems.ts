import { isStrictBuild } from '$lib/build/strict-build.js';

/**
 * Meldet Vollständigkeitsprobleme der Übersichtsseiten (S7). Lokale Builds
 * warnen nur, der Strict-Build (S5) bricht ab, damit Prod keine Seite mit
 * stillschweigend fehlenden Einträgen ausliefert.
 */
export function reportOverviewProblems(scope: string, problems: readonly string[]): void {
	if (problems.length === 0) return;
	const text = `[overview:${scope}] ${problems.join(' ')}`;
	if (isStrictBuild()) throw new Error(text);
	console.warn(text);
}
