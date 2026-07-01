/**
 * Story 7.4: Pipeline-Atlas-Generator.
 *
 * Liest `scripts/lib/sources.ts` (Source-of-Truth für externe Datenquellen)
 * und schreibt eine tabellarische Übersicht nach `docs/pipelines/data-flow.md`.
 *
 * Deterministisch, kein Subagent, kein Halluzinations-Risiko.
 *
 * Run: `pnpm doc:pipelines`.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES } from './lib/sources.js';
import type { SourceConfig } from './lib/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT_PATH = join(REPO_ROOT, 'docs', 'pipelines', 'data-flow.md');

export interface DataFlowRow {
	readonly slug: string;
	readonly bundle: string;
	readonly kind: string;
	readonly source: string;
	readonly license: string;
	readonly stand: string;
	/** Story 15.7: vorgelagertes Build-Script, das den (lokalen) Input erzeugt. '-' wenn keins. */
	readonly buildStep: string;
}

export function buildRowsFromSources(sources: readonly SourceConfig[]): DataFlowRow[] {
	return sources.map((s) => ({
		slug: s.slug,
		bundle: s.bundleGroup ?? '—',
		kind: s.kind,
		source: shortenUrl(s.sourceUrl),
		license: s.license,
		stand: formatStand(s.sourceUpdatedAt),
		buildStep: s.buildStep ?? '-'
	}));
}

function shortenUrl(url: string): string {
	if (!url) return '—';
	try {
		const u = new URL(url);
		return `${u.host}${u.pathname.length > 50 ? u.pathname.slice(0, 50) + '…' : u.pathname}`;
	} catch {
		return url;
	}
}

function formatStand(iso: string | undefined | null): string {
	if (!iso) return '—';
	return iso.slice(0, 10);
}

export function renderDataFlowMarkdown(rows: readonly DataFlowRow[], generatedAt: string): string {
	const grouped = new Map<string, DataFlowRow[]>();
	for (const row of rows) {
		const arr = grouped.get(row.bundle) ?? [];
		arr.push(row);
		grouped.set(row.bundle, arr);
	}

	const sections: string[] = [];
	const bundleNames = [...grouped.keys()].sort();
	for (const bundle of bundleNames) {
		const bundleRows = grouped.get(bundle) ?? [];
		sections.push(`### ${bundle}\n`);
		sections.push('| Slug | Kind | Source | Lizenz | Stand | Build-Schritt |');
		sections.push('|---|---|---|---|---|---|');
		for (const r of bundleRows) {
			sections.push(
				`| \`${r.slug}\` | ${r.kind} | ${r.source} | ${r.license} | ${r.stand} | ${r.buildStep === '-' ? '-' : `\`${r.buildStep}\``} |`
			);
		}
		sections.push('');
	}

	const header = [
		'---',
		'type: pipeline',
		'audience: both',
		`last-verified: ${generatedAt}`,
		'related:',
		'  - docs/INDEX.md',
		'  - docs/recovery/wiedereinstieg.md',
		'---',
		'',
		'# Data-Flow-Atlas',
		'',
		`Auto-generiert via \`pnpm doc:pipelines\` aus \`scripts/lib/sources.ts\`. Stand: ${generatedAt}.`,
		'',
		`**${rows.length} Layer total**, gruppiert nach Bundle.`,
		'',
		'## Pro-Bundle-Übersicht',
		''
	].join('\n');

	return header + sections.join('\n') + '\n';
}

async function main(): Promise<void> {
	const rows = buildRowsFromSources(SOURCES);
	const today = new Date().toISOString().slice(0, 10);
	const md = renderDataFlowMarkdown(rows, today);
	await mkdir(dirname(OUT_PATH), { recursive: true });
	await writeFile(OUT_PATH, md, 'utf8');
	process.stdout.write(`[generate-data-flow-doc] wrote ${OUT_PATH} (${rows.length} layers)\n`);
}

const isMainEntry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainEntry) {
	main().catch((err) => {
		process.stderr.write(`[generate-data-flow-doc] FATAL: ${(err as Error).message}\n`);
		process.exit(1);
	});
}
