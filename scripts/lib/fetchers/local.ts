import { readFile } from 'node:fs/promises';

/**
 * Story 15.2: Liest ein vorgebautes GeoJSON von der Platte (kind 'local'). Kein Netz,
 * keine Allowlist, kein Retry, deterministischer File-Read. Wirft mit Pfad bei fehlender Datei.
 */
export async function fetchLocalGeoJson(localPath: string): Promise<string> {
	try {
		return await readFile(localPath, 'utf-8');
	} catch (err) {
		throw new Error(`Local source: Datei nicht lesbar: ${localPath} (${String(err)})`);
	}
}
