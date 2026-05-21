/**
 * Story 2.6 (Pure-Satori-Pivot 2026-05-16): verifiziert dass die OG-Pipeline-
 * Outputs in `.gitignore` stehen und Static-Pfad-Konventions-Files existieren.
 * Map-Snapshot-Pipeline + og:snapshots-Script wurden rückgebaut.
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

describe('Story 2.6: .gitignore + static/og/ convention', () => {
	it('ignores all OG-Pipeline build outputs', async () => {
		const content = await readFile(path.join(REPO_ROOT, '.gitignore'), 'utf8');
		expect(content).toContain('/static/og/bezirk/');
		expect(content).toContain('/static/og/kiez/');
		expect(content).toContain('/static/og/layer/');
	});

	it('keeps static/og/.gitkeep + README.md committed', () => {
		expect(existsSync(path.join(REPO_ROOT, 'static', 'og', '.gitkeep'))).toBe(true);
		expect(existsSync(path.join(REPO_ROOT, 'static', 'og', 'README.md'))).toBe(true);
	});

	it('package.json has og:images + og:all scripts (post Pure-Satori-Pivot, no og:snapshots)', async () => {
		const raw = await readFile(path.join(REPO_ROOT, 'package.json'), 'utf8');
		const pkg = JSON.parse(raw) as { scripts: Record<string, string> };
		expect(pkg.scripts['og:images']).toBeDefined();
		expect(pkg.scripts['og:all']).toBeDefined();
		expect(pkg.scripts['og:snapshots']).toBeUndefined();
	});
});
