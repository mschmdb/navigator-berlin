import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

afterEach(() => {
	vi.restoreAllMocks();
	vi.resetModules();
});

describe('loadCrossLayerTemplates', () => {
	it('liefert die Templates auch ohne src/ im Arbeitsverzeichnis (Prod-Image, #116)', async () => {
		const emptyDir = mkdtempSync(join(tmpdir(), 'nav-runtime-'));
		vi.spyOn(process, 'cwd').mockReturnValue(emptyDir);
		const { loadCrossLayerTemplates } = await import('./cross-layer-templates-loader.js');
		const bundles = await loadCrossLayerTemplates();
		expect(bundles.length).toBeGreaterThan(0);
		expect(bundles.some((b) => b.bundle === 'wahl' && b.templates.length > 0)).toBe(true);
	});
});
