/**
 * CLI-Entry für /publish-update. Story 5.8 AC-8.
 *
 * Wires: argv → range-resolve → per-commit filter → subagent-classify →
 * forbidden-token-lint → atomic draft-write.
 *
 * Exit-Code 0 = Pipeline durchgelaufen (auch bei Skips/Lint-_FAIL_-Drafts).
 * Exit-Code 1 = Preflight-Fail oder unerwarteter Fehler.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseRangeArgs, type RangeArg } from './resolve-commit-range.js';
import { classifyChangedFiles } from './filter-commit.js';
import { lintBody } from './forbidden-tokens.js';
import { writeDraft } from './write-draft.js';
import { classifyAndDraftCommit, type SubagentExecutor } from './invoke-classifier.js';

const exec = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const DRAFTS_DIR = join(REPO_ROOT, '_content', 'updates', '_drafts');
const SYSTEM_PROMPT_PATH = join(__dirname, 'system-prompt.txt');

export interface MainResult {
	readonly exitCode: number;
	readonly reportLines: readonly string[];
}

export async function main(
	argv: readonly string[],
	deps: { subagent?: SubagentExecutor } = {}
): Promise<MainResult> {
	const report: string[] = [];

	const preflight = await runPreflight();
	if (!preflight.ok) {
		report.push(`✗ Preflight-Fail: ${preflight.reason}`);
		return { exitCode: 1, reportLines: report };
	}

	const range = parseRangeArgs(argv);
	if (range.kind === 'error') {
		report.push(`✗ Arg-Error: ${range.message}`);
		return { exitCode: 1, reportLines: report };
	}

	const systemPrompt = await readFile(SYSTEM_PROMPT_PATH, 'utf8');
	const subagent = deps.subagent ?? createClaudeSubagent();

	const commits = await resolveCommits(range);
	if (commits.length === 0) {
		report.push('ℹ️ Keine Commits im Range');
		return { exitCode: 0, reportLines: report };
	}

	let wrote = 0;
	let skipped = 0;
	let failed = 0;

	for (const sha of commits) {
		const changedFiles = await gitShowChangedFiles(sha);
		const classification = classifyChangedFiles(changedFiles);
		if (!classification.relevant) {
			report.push(`⏭  ${sha.slice(0, 7)} skip: ${classification.reason}`);
			skipped++;
			continue;
		}

		const [diff, commitMessage, commitDateIso] = await Promise.all([
			gitShowDiff(sha),
			gitCommitMessage(sha),
			gitCommitDateIso(sha)
		]);

		const draftResult = await classifyAndDraftCommit(
			{ sha, commitMessage, diff, publicPaths: classification.publicPaths },
			{ systemPrompt, subagent }
		);

		if (draftResult.kind === 'skip') {
			report.push(`⏭  ${sha.slice(0, 7)} subagent-skip: ${draftResult.reason}`);
			skipped++;
			continue;
		}

		const lintResult = lintBody(draftResult.body);
		const writeOut = await writeDraft({
			commitSha: sha,
			commitDateIso,
			draft: {
				title_de: draftResult.title_de,
				summary_de: draftResult.summary_de,
				category: draftResult.category,
				tags: [...draftResult.tags],
				body: draftResult.body
			},
			lintResult,
			draftsDir: DRAFTS_DIR
		});

		if (lintResult.ok) {
			report.push(`✓  ${sha.slice(0, 7)} draft: ${writeOut.path}`);
			wrote++;
		} else {
			report.push(
				`⚠ ${sha.slice(0, 7)} _FAIL_ draft (${lintResult.violations.length} violations): ${writeOut.path}`
			);
			failed++;
		}
	}

	report.push('');
	report.push(`Summary: ${wrote} written, ${skipped} skipped, ${failed} _FAIL_`);
	return { exitCode: 0, reportLines: report };
}

async function runPreflight(): Promise<{ ok: true } | { ok: false; reason: string }> {
	try {
		const { stdout } = await exec('git', ['status', '--porcelain'], { cwd: REPO_ROOT });
		if (stdout.trim() !== '') {
			return { ok: false, reason: 'Working-Tree nicht clean (git status --porcelain liefert Output)' };
		}
	} catch (err) {
		return { ok: false, reason: `git status fehlgeschlagen: ${(err as Error).message}` };
	}
	try {
		await access(SYSTEM_PROMPT_PATH);
	} catch {
		return { ok: false, reason: `system-prompt.txt nicht gefunden: ${SYSTEM_PROMPT_PATH}` };
	}
	return { ok: true };
}

async function resolveCommits(range: Exclude<RangeArg, { kind: 'error' }>): Promise<string[]> {
	if (range.kind === 'commit') return [range.sha];
	const args = range.expr.startsWith('--since=')
		? ['log', range.expr, '--format=%H']
		: ['log', range.expr, '--format=%H'];
	const { stdout } = await exec('git', args, { cwd: REPO_ROOT });
	return stdout.trim().split('\n').filter(Boolean);
}

async function gitShowChangedFiles(sha: string): Promise<string[]> {
	const { stdout } = await exec('git', ['show', '--name-only', '--format=', sha], { cwd: REPO_ROOT });
	return stdout.trim().split('\n').filter(Boolean);
}

async function gitShowDiff(sha: string): Promise<string> {
	const { stdout } = await exec('git', ['show', '--format=', sha], { cwd: REPO_ROOT, maxBuffer: 50 * 1024 * 1024 });
	return stdout;
}

async function gitCommitMessage(sha: string): Promise<string> {
	const { stdout } = await exec('git', ['log', '-1', '--format=%B', sha], { cwd: REPO_ROOT });
	return stdout.trim();
}

async function gitCommitDateIso(sha: string): Promise<string> {
	const { stdout } = await exec('git', ['show', '-s', '--format=%aI', sha], { cwd: REPO_ROOT });
	return stdout.trim().slice(0, 10);
}

function createClaudeSubagent(): SubagentExecutor {
	return async (prompt) => {
		const { stdout } = await exec('claude', ['--print', '--append-system-prompt', prompt, '/dev/stdin'], {
			cwd: REPO_ROOT,
			maxBuffer: 10 * 1024 * 1024
		});
		return stdout;
	};
}

const isMainEntry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainEntry) {
	const argv = process.argv.slice(2);
	main(argv)
		.then((r) => {
			for (const line of r.reportLines) console.log(line);
			process.exit(r.exitCode);
		})
		.catch((err) => {
			console.error(`✗ Unerwarteter Fehler: ${(err as Error).message}`);
			process.exit(1);
		});
}
