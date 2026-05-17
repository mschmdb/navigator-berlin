/**
 * Story 7.6: Story-Map-Generator.
 *
 * Liest `_bmad-output/implementation-artifacts/sprint-status.yaml` und
 * schreibt eine Markdown-Tabelle nach `docs/architecture/story-map.md`.
 *
 * Pure YAML-parsing, kein Subagent.
 *
 * Run: `pnpm doc:story-map`.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SPRINT_STATUS_PATH = join(
	REPO_ROOT,
	'_bmad-output',
	'implementation-artifacts',
	'sprint-status.yaml'
);
const OUT_PATH = join(REPO_ROOT, 'docs', 'architecture', 'story-map.md');

export interface StoryRow {
	readonly key: string;
	readonly epic: string;
	readonly status: string;
	readonly comment: string;
}

/**
 * Raw line-parse statt yaml-load: js-yaml strippt Inline-Comments (`# ...`)
 * silently — wir wollen sie aber als Story-Kommentar behalten.
 *
 * Format: `  N-K-slug: STATUS  # OPTIONAL COMMENT`
 */
const STORY_LINE_RE = /^\s+(\d+)-([a-z0-9-]+):\s+([^\s#]+(?:\s+[^\s#]+)*?)\s*(?:#\s*(.+))?\s*$/;

export function parseSprintStatus(yamlText: string): StoryRow[] {
	const rows: StoryRow[] = [];
	let inStatusBlock = false;
	for (const line of yamlText.split('\n')) {
		if (line.startsWith('development_status:')) {
			inStatusBlock = true;
			continue;
		}
		if (!inStatusBlock) continue;
		if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
			inStatusBlock = false;
			continue;
		}
		const trimmedLine = line.trimStart();
		if (trimmedLine.startsWith('#') || trimmedLine === '') continue;
		const m = line.match(STORY_LINE_RE);
		if (!m) continue;
		const [, epicNum, slugRest, status, comment] = m;
		const key = `${epicNum}-${slugRest}`;
		rows.push({
			key,
			epic: `Epic ${epicNum}`,
			status: status.trim(),
			comment: (comment ?? '').trim()
		});
	}
	return rows;
}

export function renderStoryMapMarkdown(rows: readonly StoryRow[], generatedAt: string): string {
	const byEpic = new Map<string, StoryRow[]>();
	for (const r of rows) {
		const arr = byEpic.get(r.epic) ?? [];
		arr.push(r);
		byEpic.set(r.epic, arr);
	}

	const sections: string[] = [];
	for (const epic of [...byEpic.keys()].sort()) {
		const epicRows = byEpic.get(epic) ?? [];
		sections.push(`### ${epic}\n`);
		sections.push('| Story | Status | Kommentar |');
		sections.push('|---|---|---|');
		for (const r of epicRows) {
			const statusBadge = badge(r.status);
			const commentShort =
				r.comment.length > 120 ? r.comment.slice(0, 117) + '…' : r.comment;
			sections.push(`| \`${r.key}\` | ${statusBadge} | ${commentShort || '—'} |`);
		}
		sections.push('');
	}

	const totalRows = rows.length;
	const totals = {
		done: rows.filter((r) => r.status === 'done').length,
		inProgress: rows.filter((r) => r.status === 'in-progress').length,
		readyForDev: rows.filter((r) => r.status === 'ready-for-dev').length,
		backlog: rows.filter((r) => r.status === 'backlog').length,
		other: 0
	};
	totals.other = totalRows - totals.done - totals.inProgress - totals.readyForDev - totals.backlog;

	const header = [
		'---',
		'type: architecture',
		'audience: both',
		`last-verified: ${generatedAt}`,
		'related:',
		'  - docs/INDEX.md',
		'  - docs/pipelines/data-flow.md',
		'---',
		'',
		'# Story-Map',
		'',
		`Auto-generiert via \`pnpm doc:story-map\` aus \`_bmad-output/implementation-artifacts/sprint-status.yaml\`. Stand: ${generatedAt}.`,
		'',
		`**${totalRows} Stories total**: ✅ ${totals.done} done · 🚧 ${totals.inProgress} in-progress · 📋 ${totals.readyForDev} ready-for-dev · ⏳ ${totals.backlog} backlog · ▫️ ${totals.other} other`,
		'',
		'## Pro Epic',
		''
	].join('\n');

	return header + sections.join('\n') + '\n';
}

function badge(status: string): string {
	if (status === 'done') return '✅ done';
	if (status === 'in-progress') return '🚧 in-progress';
	if (status === 'ready-for-dev') return '📋 ready-for-dev';
	if (status === 'backlog') return '⏳ backlog';
	if (status === 'cancelled') return '❌ cancelled';
	if (status === 'deferred') return '↪ deferred';
	if (status.startsWith('deferred-to-')) return `↪ ${status}`;
	return `▫️ ${status}`;
}

async function main(): Promise<void> {
	const yaml = await readFile(SPRINT_STATUS_PATH, 'utf8');
	const rows = parseSprintStatus(yaml);
	const today = new Date().toISOString().slice(0, 10);
	const md = renderStoryMapMarkdown(rows, today);
	await mkdir(dirname(OUT_PATH), { recursive: true });
	await writeFile(OUT_PATH, md, 'utf8');
	process.stdout.write(`[generate-story-map] wrote ${OUT_PATH} (${rows.length} stories)\n`);
}

const isMainEntry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainEntry) {
	main().catch((err) => {
		process.stderr.write(`[generate-story-map] FATAL: ${(err as Error).message}\n`);
		process.exit(1);
	});
}
