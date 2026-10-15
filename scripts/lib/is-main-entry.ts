import { existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function resolveReal(path: string): string | null {
	const candidates = [path, `${path}.ts`, `${path}.js`, `${path}.mts`, `${path}.mjs`];
	for (const candidate of candidates) {
		if (existsSync(candidate)) return realpathSync(candidate);
	}
	return null;
}

/**
 * `true`, wenn das Modul direkt gestartet wurde (`tsx scripts/x.ts`), nicht
 * beim Import. Beide Seiten laufen durch `realpathSync`, `argv1` darf Symlink
 * sein oder die Endung weglassen.
 */
export function isMainEntry(importMetaUrl: string, argv1: string | undefined): boolean {
	if (!argv1) return false;
	const entry = resolveReal(argv1);
	if (!entry) return false;
	const self = resolveReal(fileURLToPath(importMetaUrl));
	return self !== null && self === entry;
}
