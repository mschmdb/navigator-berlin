/**
 * Build-Time-Step: schreibt `static/webmcp-manifest.json` aus dem
 * Pure-Function-Builder.
 *
 * Nutzbar via `pnpm webmcp:manifest`. Wird optional in `prebuild` integriert.
 * Output ist `.gitignore`-frei (Source-of-Truth ist der TS-Builder).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWebMcpManifest } from '../src/lib/webmcp/internal/manifest-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(REPO_ROOT, 'static', 'webmcp-manifest.json');

async function main(): Promise<void> {
	const manifest = buildWebMcpManifest();
	const json = JSON.stringify(manifest, null, 2);
	await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
	await writeFile(OUTPUT_PATH, json + '\n', 'utf8');
	process.stdout.write(`webmcp-manifest.json written: ${OUTPUT_PATH}\n`);
	process.stdout.write(`spec_version: ${manifest.spec_version}\n`);
	process.stdout.write(`tools: ${manifest.tools.length}\n`);
	process.stdout.write(`resources: ${manifest.resources.length}\n`);
	process.stdout.write(`prompts: ${manifest.prompts.length}\n`);
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`Failed to build webmcp-manifest.json: ${msg}\n`);
	process.exit(1);
});
