/**
 * Subagent-Wrapper: ruft Claude-CLI mit System-Prompt-Lock auf, validiert
 * Response gegen DraftResultSchema. Story 5.8 AC-4.
 *
 * Subagent-Executor wird per Dependency-Injection übergeben (für Tests
 * mockable, in main.ts wird der echte `claude --print --append-system-prompt`
 * Aufruf injected).
 */

import { parseDraftResult, type DraftResult } from './draft-result-schema.js';

const MAX_DIFF_LINES = 3000;
const TRUNCATE_PER_FILE_LINES = 200;

export interface ClassifierInput {
	readonly sha: string;
	readonly commitMessage: string;
	readonly diff: string;
	readonly publicPaths: readonly string[];
}

export type SubagentExecutor = (prompt: string) => Promise<string>;

export interface ClassifyOptions {
	readonly systemPrompt: string;
	readonly subagent: SubagentExecutor;
}

export async function classifyAndDraftCommit(
	input: ClassifierInput,
	opts: ClassifyOptions
): Promise<DraftResult & { __truncated?: boolean }> {
	const diffLines = input.diff.split('\n');
	const truncated = diffLines.length > MAX_DIFF_LINES;
	const effectiveDiff = truncated ? truncateDiff(input.diff, input.publicPaths) : input.diff;

	const userPrompt = buildUserPrompt({
		sha: input.sha,
		commitMessage: input.commitMessage,
		diff: effectiveDiff,
		publicPaths: input.publicPaths,
		truncated
	});

	const fullPrompt = `${opts.systemPrompt}\n\n${userPrompt}`;
	const rawResponse = await opts.subagent(fullPrompt);

	const cleaned = extractJsonObject(rawResponse);
	let parsed: unknown;
	try {
		parsed = JSON.parse(cleaned);
	} catch {
		return {
			kind: 'skip',
			reason: `Subagent-Response kein gültiges JSON: ${cleaned.slice(0, 80)}`
		};
	}

	const result = parseDraftResult(parsed);
	if (!result.ok) {
		return { kind: 'skip', reason: `Schema-Verstoß: ${result.error}` };
	}

	if (truncated && result.value.kind === 'draft') {
		return { ...result.value, __truncated: true };
	}
	return result.value;
}

function truncateDiff(diff: string, publicPaths: readonly string[]): string {
	const sections: string[] = [];
	sections.push(
		`[Diff truncated. Originale Zeilen-Zahl > ${MAX_DIFF_LINES}. Auszug pro Allowlist-Datei (erste ${TRUNCATE_PER_FILE_LINES} Zeilen).]`
	);
	const fileBlocks = splitByFileHeader(diff);
	for (const block of fileBlocks) {
		const path = extractPathFromHeader(block.header);
		if (!publicPaths.includes(path)) continue;
		const trimmed = block.body.split('\n').slice(0, TRUNCATE_PER_FILE_LINES).join('\n');
		sections.push(`\n${block.header}\n${trimmed}`);
	}
	return sections.join('\n');
}

interface FileBlock {
	readonly header: string;
	readonly body: string;
}

function splitByFileHeader(diff: string): FileBlock[] {
	const blocks: FileBlock[] = [];
	const lines = diff.split('\n');
	let current: { header: string; body: string[] } | null = null;
	for (const line of lines) {
		if (line.startsWith('diff --git ')) {
			if (current) blocks.push({ header: current.header, body: current.body.join('\n') });
			current = { header: line, body: [] };
		} else if (current) {
			current.body.push(line);
		}
	}
	if (current) blocks.push({ header: current.header, body: current.body.join('\n') });
	return blocks;
}

function extractPathFromHeader(header: string): string {
	const m = header.match(/b\/(.+)$/);
	return m?.[1] ?? '';
}

function buildUserPrompt(input: {
	sha: string;
	commitMessage: string;
	diff: string;
	publicPaths: readonly string[];
	truncated: boolean;
}): string {
	return [
		'## Eingabe',
		`Commit-SHA: ${input.sha}`,
		`Commit-Message:\n${input.commitMessage}`,
		`Public-Files (Allowlist-Match):\n${input.publicPaths.map((p) => `- ${p}`).join('\n')}`,
		input.truncated ? '\n*Hinweis: Commit ist groß, Diff wurde gekürzt.*' : '',
		'## Diff',
		'```diff',
		input.diff,
		'```',
		'',
		'## Anweisung',
		'Klassifiziere diesen Commit. Antwort MUSS gültiges JSON nach DraftResultSchema sein:',
		'- `{ "kind": "skip", "reason": "..." }` falls nicht public-relevant',
		'- `{ "kind": "draft", "category": "...", "title_de": "...", "summary_de": "...", "tags": [...], "body": "..." }` falls relevant'
	]
		.filter(Boolean)
		.join('\n');
}

function extractJsonObject(raw: string): string {
	const trimmed = raw.trim();
	// Strip markdown code-fences if present
	const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
	if (fenceMatch) return fenceMatch[1].trim();
	// Find first { ... last } (greedy)
	const first = trimmed.indexOf('{');
	const last = trimmed.lastIndexOf('}');
	if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
	return trimmed;
}
