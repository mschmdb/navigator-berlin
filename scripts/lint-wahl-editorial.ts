import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import {
	lintWahlText,
	WAHL_FORBIDDEN_PATTERNS,
	WAHL_FORBIDDEN_PATTERNS_EN,
	type LintViolation,
	type Pattern
} from './wahlen/lib/wahl-forbidden-tokens.js';

const ROOT = process.cwd();

/**
 * i18n Block B: die Paraglide-Message-Quellen tragen die gesamte
 * Wahlportal-Prosa. `de.json` bekommt die normalen (DE) Forbidden-Patterns
 * wie jede andere Wahl-Datei, `en.json` bekommt ausschließlich die
 * EN-Musterliste (Boundary Spec i18n Block B: "EN bekommt eigene
 * Forbidden-Tokens (nur auf en.json)").
 *
 * Exportiert (Review-Fund), damit die Datei-zu-Musterliste-Zuordnung selbst
 * unit-testbar ist, statt nur implizit über `main()` geprüft zu werden.
 */
export const MESSAGE_FILE_PATTERNS: readonly {
	readonly path: string;
	readonly patterns: readonly Pattern[];
}[] = [
	{ path: 'messages/de.json', patterns: WAHL_FORBIDDEN_PATTERNS },
	{ path: 'messages/en.json', patterns: WAHL_FORBIDDEN_PATTERNS_EN }
];

const TARGET_PATHS: readonly string[] = [
	'src/lib/components/atlas/inspector-panel/wahl-section.svelte',
	'src/lib/data/get-wahl-results-at-point.ts',
	'src/lib/data/partei-farben.ts',
	'src/lib/data/wahl-gruppe-label.ts',
	'src/routes/api/wahl/results-at-point/+server.ts',
	'docs/wahldaten-methodik.md'
];

const SCAN_FILE_PATTERN = /(wahl-|\bwahl\b).*\.(svelte|ts)$/i;
/** Portal-Verzeichnisse (Story 3): jede .svelte/.ts-Datei ist wahl-relevant, kein Namens-Filter nötig. */
const ALL_FILES_PATTERN = /\.(svelte|ts)$/i;

interface ScanDirConfig {
	readonly dir: string;
	readonly pattern: RegExp;
}

const SCAN_DIR_CONFIGS: readonly ScanDirConfig[] = [
	{ dir: 'src/lib/components/atlas/inspector-panel', pattern: SCAN_FILE_PATTERN },
	{ dir: 'src/lib/components/wahl-portal', pattern: ALL_FILES_PATTERN },
	{ dir: 'src/routes/(with-header)/berlin-wahlen', pattern: ALL_FILES_PATTERN }
];

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
	for (const { dir, pattern } of SCAN_DIR_CONFIGS) {
		const absDir = join(ROOT, dir);
		if (!(await pathExists(absDir))) continue;
		const entries = await readdir(absDir, { recursive: true, withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isFile()) continue;
			if (!pattern.test(entry.name)) continue;
			if (entry.name.endsWith('.test.ts')) continue;
			all.add(join(entry.parentPath ?? absDir, entry.name));
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

	let messageFilesScanned = 0;
	for (const { path, patterns } of MESSAGE_FILE_PATTERNS) {
		const abs = join(ROOT, path);
		// Review-Fund: eine fehlende Message-Datei wurde bisher STILL
		// übersprungen (0 Verstöße gemeldet, obwohl gar nicht gescannt wurde) --
		// das ist ein stiller Lint-Gate-Ausfall. Eine fehlende Datei ist jetzt
		// selbst ein Fehler.
		if (!(await pathExists(abs))) {
			console.error(`[lint-wahl-editorial] Message-Datei fehlt: ${path}`);
			process.exit(1);
		}
		messageFilesScanned++;
		const text = await readFile(abs, 'utf-8');
		const result = lintWahlText(text, patterns);
		if (!result.ok) {
			for (const v of result.violations) {
				failures.push({ file: abs, violation: v });
			}
		}
	}

	const totalScanned = files.length + messageFilesScanned;
	if (failures.length === 0) {
		console.log(`[lint-wahl-editorial] ${totalScanned} files scanned, 0 violations.`);
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

// Review-Fund: Guard, damit `MESSAGE_FILE_PATTERNS` (oben) unit-testbar
// importiert werden kann, ohne dass `main()` als Nebeneffekt mitlaeuft.
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
