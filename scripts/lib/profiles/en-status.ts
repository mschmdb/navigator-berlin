/**
 * Status einer `<slug>.en.md` gegenüber ihrer DE-Datei (i18n Block C5).
 * - `orphan`: keine DE-Datei zum Slug.
 * - `stale`: `sourceInputHash` weicht vom aktuellen `inputHash` ab.
 */
export type EnStatus = 'ok' | 'orphan' | 'stale';

export function classifyEnProfile(
	enData: Record<string, unknown>,
	deInputHash: string | undefined,
	deExists: boolean
): EnStatus {
	if (!deExists) return 'orphan';
	if (typeof deInputHash !== 'string' || enData.sourceInputHash !== deInputHash) return 'stale';
	return 'ok';
}
