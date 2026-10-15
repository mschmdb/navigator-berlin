import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	IMPLEMENTATION_ARTIFACTS_DIR,
	PLANNING_ARTIFACTS_DIR,
	PROCESS_DIR,
	REPO_ROOT
} from './paths.js';

/** Liest `key = "wert"` aus einer Tabelle der einfachen BMAD-TOML-Datei. */
function readTomlString(text: string, table: string, key: string): string | undefined {
	let current = '';
	for (const line of text.split('\n')) {
		const header = line.match(/^\[([^\]]+)\]\s*$/);
		if (header) {
			current = header[1];
			continue;
		}
		const pair = line.match(/^(\w+)\s*=\s*"([^"]*)"\s*$/);
		if (pair && current === table && pair[1] === key) return pair[2];
	}
	return undefined;
}

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		if (entry === 'node_modules' || entry === 'paraglide') continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, out);
		else out.push(full);
	}
	return out;
}

describe('BMAD-Override und scripts/lib/paths.ts', () => {
	const toml = readFileSync(join(REPO_ROOT, '_bmad', 'custom', 'config.toml'), 'utf-8');
	const fromRoot = (value: string | undefined) =>
		(value ?? '').replace('{project-root}', REPO_ROOT);

	it('output_folder entspricht PROCESS_DIR', () => {
		expect(fromRoot(readTomlString(toml, 'core', 'output_folder'))).toBe(PROCESS_DIR);
	});

	it('planning_artifacts und implementation_artifacts entsprechen den Konstanten', () => {
		expect(fromRoot(readTomlString(toml, 'modules.bmm', 'planning_artifacts'))).toBe(
			PLANNING_ARTIFACTS_DIR
		);
		expect(fromRoot(readTomlString(toml, 'modules.bmm', 'implementation_artifacts'))).toBe(
			IMPLEMENTATION_ARTIFACTS_DIR
		);
	});
});

describe('Altpfad _bmad-output', () => {
	const ALLOWED = new Set([
		'scripts/publish-update/filter-commit.ts',
		'scripts/publish-update/filter-commit.test.ts',
		'scripts/lib/process-paths-consistency.test.ts'
	]);

	it('kommt in scripts/ und src/ nicht mehr vor (außer in der Denylist)', () => {
		const offenders = [...walk(join(REPO_ROOT, 'scripts')), ...walk(join(REPO_ROOT, 'src'))]
			.map((file) => relative(REPO_ROOT, file))
			.filter((file) => /\.(ts|js|svelte|json|md)$/.test(file) && !ALLOWED.has(file))
			.filter((file) => readFileSync(join(REPO_ROOT, file), 'utf-8').includes('_bmad-output'));
		expect(offenders).toEqual([]);
	});
});
