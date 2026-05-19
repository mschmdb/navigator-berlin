/**
 * Wrapper für data:wahl-fetch: fährt pro Wahl-Slug einen separaten
 * Node-Subprozess via `pnpm data:wahl-fetch --only=<slug>`. Vorteil:
 * Node-Heap (XLSX-Parser, geparste Rows) wird zwischen Wahlen freigegeben,
 * Build-Container mit niedrigem Memory-Limit crasht nicht mehr.
 *
 * Sequenziell um Postgres-Concurrent-Writes zu vermeiden.
 */

import 'dotenv/config';
import { spawn } from 'node:child_process';
import { WAHL_SOURCES } from './wahlen/lib/sources.js';

function run(slug: string): Promise<number> {
	return new Promise((resolve) => {
		const child = spawn('pnpm', ['data:wahl-fetch', `--only=${slug}`], {
			stdio: 'inherit',
			env: process.env
		});
		child.on('exit', (code) => resolve(code ?? 1));
	});
}

async function main(): Promise<void> {
	const slugs = WAHL_SOURCES.map((s) => s.slug);
	console.log(`[wahl-fetch-chunked] fetching ${slugs.length} wahlen sequenziell`);
	for (const slug of slugs) {
		console.log(`\n[wahl-fetch-chunked] --- ${slug} ---`);
		const code = await run(slug);
		if (code !== 0) {
			console.error(`[wahl-fetch-chunked] ${slug} exited ${code}, aborting`);
			process.exit(code);
		}
	}
	console.log(`\n[wahl-fetch-chunked] done · ${slugs.length} wahlen imported`);
}

main();
