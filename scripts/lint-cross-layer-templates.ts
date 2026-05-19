/**
 * CLI-Linter für Cross-Layer-Templates (Story 6.7).
 *
 * Scannt src/lib/data/cross-layer-templates/-YAML-Files auf:
 * 1. Forbidden-Tokens aus Wahl-Editorial-Lock (Hochburg, Wahlsieger, Erdrutsch, …)
 * 2. „lebenswert" und Varianten (MEMORY feedback_no_lebenswert)
 * 3. Wertende Vergleichs-Adjektive (dominiert, weit vor, knapp hinter)
 * 4. Em-dashes (MEMORY feedback_no_em_dashes)
 *
 * Exit 0 = ok, Exit 1 = mind. eine Violation.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as parseYaml } from 'js-yaml';
import { WAHL_FORBIDDEN_PATTERNS, type Pattern } from './wahlen/lib/wahl-forbidden-tokens.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const TEMPLATE_ROOT = join(REPO_ROOT, 'src/lib/data/cross-layer-templates');

async function walkYaml(dir: string, acc: string[]): Promise<void> {
	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch {
		return;
	}
	for (const name of entries) {
		const abs = join(dir, name);
		const s = await stat(abs);
		if (s.isDirectory()) {
			await walkYaml(abs, acc);
		} else if (name.endsWith('.yaml') || name.endsWith('.yml')) {
			acc.push(abs);
		}
	}
}

const CROSS_LAYER_EXTRA_PATTERNS: readonly Pattern[] = [
	{
		name: 'dominiert-von',
		regex: /\b(?:dominiert(?:e)?\s+von|wird\s+dominiert)\b/i,
		hint: 'Wertende Verknüpfung. Ersatz: stärkste Partei, höchster Anteil.'
	},
	{
		name: 'weit-vor',
		regex: /\bweit\s+vor\b/i,
		hint: 'Distanz-Wertung. Ersatz: Prozentpunkt-Differenz nennen ohne Adjektiv.'
	},
	{
		name: 'knapp-hinter',
		regex: /\bknapp\s+(?:hinter|vor)\b/i,
		hint: 'Distanz-Wertung. Ersatz: Prozentpunkt-Differenz nennen ohne Adjektiv.'
	},
	{
		name: 'klar-gewonnen',
		regex: /\b(?:klar|deutlich)\s+(?:gewonnen|verloren|geschlagen)\b/i,
		hint: 'Sport-Metapher + Wertung. Ersatz: höchster Anteil mit X %.'
	},
	{
		name: 'einwohner-besser',
		regex: /\bbesser(?:e)?\s+(?:wohnen|leben|kiez|adresse)\b/i,
		hint: 'Bewertung von Wohnqualität verboten. Ersatz: strukturelle Beschreibung.'
	}
];

const ALL_PATTERNS = [...WAHL_FORBIDDEN_PATTERNS, ...CROSS_LAYER_EXTRA_PATTERNS];

interface Violation {
	readonly file: string;
	readonly line: number;
	readonly token: string;
	readonly snippet: string;
	readonly hint: string;
}

function scanRenderableText(value: string, file: string, field: string): Violation[] {
	const out: Violation[] = [];
	const lines = value.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		for (const p of ALL_PATTERNS) {
			if (p.regex.test(line)) {
				out.push({
					file: `${file}#${field}`,
					line: i + 1,
					token: p.name,
					snippet: line.trim().slice(0, 140),
					hint: p.hint
				});
			}
		}
	}
	return out;
}

interface TemplateLike {
	readonly id?: string;
	readonly body_de?: string;
}

interface TemplateFileLike {
	readonly templates?: readonly TemplateLike[];
}

function scanFile(raw: string, file: string): Violation[] {
	let parsed: TemplateFileLike;
	try {
		parsed = parseYaml(raw) as TemplateFileLike;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return [
			{
				file,
				line: 0,
				token: 'yaml-parse-error',
				snippet: msg.slice(0, 140),
				hint: 'YAML-Parse fehlgeschlagen. Bitte Syntax prüfen.'
			}
		];
	}
	const out: Violation[] = [];
	const templates = parsed.templates ?? [];
	for (const t of templates) {
		const id = t.id ?? '<no-id>';
		if (typeof t.body_de === 'string') {
			out.push(...scanRenderableText(t.body_de, file, `templates.${id}.body_de`));
		}
	}
	return out;
}

async function main(): Promise<void> {
	const files: string[] = [];
	await walkYaml(TEMPLATE_ROOT, files);
	if (files.length === 0) {
		process.stdout.write('[lint-cross-layer-templates] no YAML files found\n');
		return;
	}
	const violations: Violation[] = [];
	for (const abs of files) {
		const raw = await readFile(abs, 'utf-8');
		violations.push(...scanFile(raw, relative(REPO_ROOT, abs)));
	}
	if (violations.length > 0) {
		for (const v of violations) {
			process.stderr.write(
				`${v.file}:${v.line} [${v.token}] ${v.snippet}\n  hint: ${v.hint}\n\n`
			);
		}
		process.stderr.write(
			`[lint-cross-layer-templates] ${files.length} files scanned, ${violations.length} violations.\n`
		);
		process.exit(1);
	}
	process.stdout.write(
		`[lint-cross-layer-templates] ${files.length} files scanned, 0 violations.\n`
	);
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[lint-cross-layer-templates] error: ${msg}\n`);
	process.exit(2);
});
