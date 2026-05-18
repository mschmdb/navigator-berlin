import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { lintWahlText, type LintViolation } from './wahlen/lib/wahl-forbidden-tokens.js';

const ROOT = process.cwd();

const TARGET_PATHS: readonly string[] = [
	'src/lib/components/atlas/inspector-panel/wahl-section.svelte',
	'src/lib/data/get-wahl-results-at-point.ts',
	'src/lib/data/partei-farben.ts',
	'src/routes/api/wahl/results-at-point/+server.ts',
	'docs/wahldaten-methodik.md'
];

const SCAN_DIRS: readonly string[] = ['src/lib/components/atlas/inspector-panel'];
const SCAN_FILE_PATTERN = /(wahl-|\bwahl\b).*\.(svelte|ts)$/i;

async function pathExists(p: string): Promise<boolean> {
	try {
		await stat(p);
		return true;
	} catch {
		return false;
	}
}

async function collectScanFiles(): Promise<string[]> {
	const all = new Set<string>();
	for (const t of TARGET_PATHS) {
		const abs = join(ROOT, t);
		if (await pathExists(abs)) all.add(abs);
	}
	for (const dir of SCAN_DIRS) {
		const absDir = join(ROOT, dir);
		if (!(await pathExists(absDir))) continue;
		const entries = await readdir(absDir);
		for (const e of entries) {
			if (!SCAN_FILE_PATTERN.test(e)) continue;
			if (e.endsWith('.test.ts')) continue;
			all.add(join(absDir, e));
		}
	}
	return Array.from(all).sort();
}

async function main(): Promise<void> {
	const files = await collectScanFiles();
	const failures: { file: string; violation: LintViolation }[] = [];

	for (const file of files) {
		const text = await readFile(file, 'utf-8');
		const result = lintWahlText(text);
		if (!result.ok) {
			for (const v of result.violations) {
				failures.push({ file, violation: v });
			}
		}
	}

	if (failures.length === 0) {
		console.log(`[lint-wahl-editorial] ${files.length} files scanned, 0 violations.`);
		return;
	}

	console.error(`[lint-wahl-editorial] ${failures.length} Verstoß/Verstöße:`);
	for (const f of failures) {
		const rel = relative(ROOT, f.file);
		console.error(`  ${rel}:${f.violation.line} [${f.violation.token}]`);
		console.error(`    > ${f.violation.snippet}`);
		console.error(`    hint: ${f.violation.hint}`);
	}
	process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
