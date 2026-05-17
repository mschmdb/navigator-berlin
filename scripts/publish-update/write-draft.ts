/**
 * Draft-File-Writer für /publish-update. Story 5.8 AC-6.
 *
 * Schreibt atomic (tmp + rename) in `_content/updates/_drafts/`. Bei Lint-
 * Violation Präfix `_FAIL_` + Markdown-Header mit Verstoß-Liste. Slug-
 * Kollision → Suffix mit 6-char-SHA.
 */

import { writeFile, rename, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintResult } from './forbidden-tokens.js';
import { slugify } from './slugify.js';

export type DraftCategory = 'daten-update' | 'feature' | 'methodik' | 'datenquelle' | 'lizenz';

export interface DraftPayload {
	readonly title_de: string;
	readonly summary_de: string;
	readonly category: DraftCategory;
	readonly tags: readonly string[];
	readonly body: string;
}

export interface WriteDraftInput {
	readonly commitSha: string;
	readonly commitDateIso: string; // YYYY-MM-DD
	readonly draft: DraftPayload;
	readonly lintResult: LintResult;
	readonly draftsDir: string;
}

export interface WriteDraftOutput {
	readonly path: string;
	readonly ok: boolean;
}

function buildFrontmatter(d: DraftPayload, dateIso: string): string {
	const tags = d.tags.length > 0 ? `\ntags: [${d.tags.map((t) => `"${t}"`).join(', ')}]` : '';
	return [
		'---',
		`title_de: "${d.title_de.replace(/"/g, '\\"')}"`,
		`summary_de: "${d.summary_de.replace(/"/g, '\\"')}"`,
		`date: ${dateIso}`,
		`category: ${d.category}${tags}`,
		'---',
		''
	].join('\n');
}

function buildLintHeader(lint: LintResult): string {
	if (lint.ok) return '';
	const lines = [
		'> **Lint-Verstoß — vor Promote bearbeiten.**',
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
	const prefix = input.lintResult.ok ? '' : '_FAIL_';

	let fileName = `${prefix}${input.commitDateIso}-${safeSlug}.md`;
	let target = join(input.draftsDir, fileName);

	if (await pathExists(target)) {
		const shortSha = input.commitSha.slice(0, 6);
		fileName = `${prefix}${input.commitDateIso}-${safeSlug}-${shortSha}.md`;
		target = join(input.draftsDir, fileName);
	}

	const content =
		buildFrontmatter(input.draft, input.commitDateIso) +
		buildLintHeader(input.lintResult) +
		input.draft.body +
		(input.draft.body.endsWith('\n') ? '' : '\n');

	const tmp = `${target}.tmp`;
	await writeFile(tmp, content, 'utf8');
	await rename(tmp, target);

	return { path: target, ok: input.lintResult.ok };
}
