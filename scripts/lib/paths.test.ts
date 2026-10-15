import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	IMPLEMENTATION_ARTIFACTS_DIR,
	PLANNING_ARTIFACTS_DIR,
	PROCESS_DIR,
	REPO_ROOT,
	SPIKE_ARTIFACTS_DIR
} from './paths.js';

describe('paths', () => {
	it('REPO_ROOT zeigt auf das Verzeichnis mit package.json', () => {
		expect(existsSync(join(REPO_ROOT, 'package.json'))).toBe(true);
	});

	it('Prozessmaterial liegt unter docs/process', () => {
		expect(PROCESS_DIR).toBe(join(REPO_ROOT, 'docs', 'process'));
		expect(IMPLEMENTATION_ARTIFACTS_DIR).toBe(join(PROCESS_DIR, 'implementation-artifacts'));
		expect(PLANNING_ARTIFACTS_DIR).toBe(join(PROCESS_DIR, 'planning-artifacts'));
		expect(SPIKE_ARTIFACTS_DIR).toBe(join(PROCESS_DIR, 'spike-artifacts'));
	});

	// Nur Ordner mit getrackten Dateien. Gitignorierte Unterordner (screenshots, brainstorming) fehlen im Clone.
	it('getrackte Prozessordner existieren', () => {
		for (const dir of [IMPLEMENTATION_ARTIFACTS_DIR, PLANNING_ARTIFACTS_DIR, SPIKE_ARTIFACTS_DIR]) {
			expect(existsSync(dir)).toBe(true);
		}
	});
});
