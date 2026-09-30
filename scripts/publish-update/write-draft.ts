/**
 * Draft-File-Writer für /publish-update. Story 5.8 AC-6.
 *
 * Schreibt atomic (tmp + rename) in `_content/updates/_drafts/`. Bei Lint-
 * Violation Präfix `_FAIL_` + Markdown-Header mit Verstoß-Liste. Slug-
 * Kollision → Suffix mit 6-char-SHA.
 *
 * i18n C4d: Neben `<datei>.md` entsteht die EN-Schwester `<datei>.en.md`
 * (nur Body, kein Frontmatter). `title_en`/`summary_en` stehen im DE-Frontmatter.
 * Verstößt eine der beiden Fassungen, tragen beide Dateien `_FAIL_`.
 */

import { writeFile, rename, mkdir, access, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { LintResult } from './forbidden-tokens.js';
import { slugify } from './slugify.js';

export type DraftCategory = 'daten-update' | 'feature' | 'methodik' | 'datenquelle' | 'lizenz';

export interface DraftPayload {
	readonly title_de: string;
	readonly summary_de: string;
	readonly category: DraftCategory;
	readonly title_en: string;
	readonly summary_en: string;
	readonly tags: readonly string[];
	readonly body: string;
	readonly body_en: string;
}

export interface WriteDraftInput {
	readonly commitSha: string;
	readonly commitDateIso: string; // YYYY-MM-DD
	readonly draft: DraftPayload;
	/** Lint-Ergebnis des DE-Bodys. */
	readonly lintResult: LintResult;
	/** Lint-Ergebnis des EN-Bodys. */
	readonly lintResultEn: LintResult;
	readonly draftsDir: string;
}

export interface WriteDraftOutput {
	readonly path: string;
	/** Pfad der EN-Schwesterdatei `<datei>.en.md`. */
	readonly pathEn: string;
	readonly ok: boolean;
}

/** YAML-sicher: JSON-Strings sind gültige YAML-Double-Quoted-Strings (Backslash, Umbruch, Anführungszeichen). */
function yamlString(value: string): string {
	return JSON.stringify(value);
}

function buildFrontmatter(d: DraftPayload, dateIso: string): string {
	const tags = d.tags.length > 0 ? `\ntags: [${d.tags.map((t) => `"${t}"`).join(', ')}]` : '';
	return [
		'---',
		`title_de: ${yamlString(d.title_de)}`,
		`summary_de: ${yamlString(d.summary_de)}`,
		`title_en: ${yamlString(d.title_en)}`,
		`summary_en: ${yamlString(d.summary_en)}`,
		`date: ${dateIso}`,
		`category: ${d.category}${tags}`,
		'---',
		''
	].join('\n');
}

function buildLintHeader(lint: LintResult, note: string): string {
	if (lint.ok) return '';
	const lines = [
		`> **Lint-Verstoß in ${note}, vor Promote bearbeiten.**`,
		'>',
		...lint.violations.map((v) => `> - Zeile ${v.line}: \`${v.token}\` (\`${v.snippet}\`)`)
	];
	return lines.join('\n') + '\n\n';
}

async function pathExists(p: string): Promise<boolean> {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}

export async function writeDraft(input: WriteDraftInput): Promise<WriteDraftOutput> {
	await mkdir(input.draftsDir, { recursive: true });

	const baseSlug = slugify(input.draft.title_de);
	const safeSlug = baseSlug.length > 0 ? baseSlug : input.commitSha.slice(0, 6);
	const allOk = input.lintResult.ok && input.lintResultEn.ok;
	const prefix = allOk ? '' : '_FAIL_';

	const baseStem = `${prefix}${input.commitDateIso}-${safeSlug}`;
	let stem = baseStem;
	if (await anyExists(input.draftsDir, stem)) {
		stem = `${baseStem}-${input.commitSha.slice(0, 6)}`;
		const shaStem = stem;
		for (let n = 2; await anyExists(input.draftsDir, stem); n++) {
			stem = `${shaStem}-${n}`;
		}
	}
	const target = join(input.draftsDir, `${stem}.md`);
	const targetEn = join(input.draftsDir, `${stem}.en.md`);
	const enName = basename(targetEn);

	const enNote = input.lintResultEn.ok
		? ''
		: `> **Lint-Verstoß in der EN-Fassung \`${enName}\`, vor Promote bearbeiten.**\n\n`;
	const content =
		buildFrontmatter(input.draft, input.commitDateIso) +
		buildLintHeader(input.lintResult, 'der DE-Fassung') +
		enNote +
		withTrailingNewline(input.draft.body);
	const contentEn =
		buildLintHeader(input.lintResultEn, 'der EN-Fassung') +
		withTrailingNewline(input.draft.body_en);

	await writePair([
		{ target, content },
		{ target: targetEn, content: contentEn }
	]);

	return { path: target, pathEn: targetEn, ok: allOk };
}

async function anyExists(dir: string, stem: string): Promise<boolean> {
	return (
		(await pathExists(join(dir, `${stem}.md`))) || (await pathExists(join(dir, `${stem}.en.md`)))
	);
}

function withTrailingNewline(text: string): string {
	return text + (text.endsWith('\n') ? '' : '\n');
}

/** Schreibt alle `.tmp`-Dateien, benennt dann um. Bei Fehler bleibt weder Draft noch `.tmp` zurück. */
async function writePair(files: readonly { target: string; content: string }[]): Promise<void> {
	const renamed: string[] = [];
	try {
		for (const f of files) await writeFile(`${f.target}.tmp`, f.content, 'utf8');
		for (const f of files) {
			await rename(`${f.target}.tmp`, f.target);
			renamed.push(f.target);
		}
	} catch (err) {
		await Promise.allSettled(
			[...files.map((f) => `${f.target}.tmp`), ...renamed].map((p) => rm(p, { force: true }))
		);
		throw err;
	}
}
