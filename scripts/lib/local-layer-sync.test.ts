import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SOURCES } from './sources.js';

/**
 * Lokale Quellen (`kind: 'local'`) entstehen in zwei Schritten: Der Build schreibt
 * `localPath`, erst `fetch-static.ts <slug>` kopiert ihn als Hash-Layer nach static/layers
 * und trägt ihn ins Manifest ein. Fehlt der zweite Schritt, zeigt die Karte einen alten
 * Stand (Wärme-Orte: 227 statt 252 Orte). Der Test vergleicht beide Stände.
 */

const LAYERS_DIR = 'static/layers';

interface ManifestLayer {
	slug: string;
	filename: string;
	sha256: string;
}

const manifest = JSON.parse(readFileSync(join(LAYERS_DIR, 'MANIFEST.json'), 'utf8')) as {
	layers: ManifestLayer[];
};

const localSources = SOURCES.filter((s) => s.kind === 'local' && s.localPath);

function sha256(path: string): string {
	return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('lokale Layer im Manifest', () => {
	it('kennt mindestens eine lokale Quelle', () => {
		expect(localSources.length).toBeGreaterThan(0);
	});

	for (const source of localSources) {
		it(`${source.slug}: Hash-Layer entspricht ${source.localPath}`, () => {
			const entry = manifest.layers.find((l) => l.slug === source.slug);
			expect(entry, `${source.slug} fehlt im Manifest`).toBeDefined();
			const layerPath = join(LAYERS_DIR, entry!.filename);
			expect(existsSync(layerPath), `${layerPath} fehlt`).toBe(true);
			expect(
				sha256(source.localPath!),
				`${source.localPath} ist neuer als der Karten-Layer. Lauf: pnpm exec tsx scripts/fetch-static.ts ${source.slug}`
			).toBe(entry!.sha256);
			expect(sha256(layerPath), `${layerPath} weicht vom Manifest-Hash ab`).toBe(entry!.sha256);
		});
	}
});
