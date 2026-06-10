/**
 * scripts/lint-profiles.ts (Story 11.7).
 *
 * Fakten-Lint-Gate für KI-Profile: jede Zahl im Prosa-Text muss aus der
 * Datenbasis stammen, keine Gedankenstriche. Rekonstruiert den ProfileInput pro
 * Slug über dasselbe Lib wie der Generator (`build.ts`). Exit 1 bei Verstoß.
 *
 * Run: `pnpm lint:profiles`. CI-Gate vor dem Mergen generierter Profile.
 */

import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { closeDb } from '../src/lib/server/db/index.js';
import { buildAllInputs } from './lib/profiles/build.js';
import { factLint } from './lib/profiles/fact-lint.js';

const DIRS: ('kiez' | 'bezirk')[] = ['kiez', 'bezirk'];

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[lint:profiles] DATABASE_URL fehlt — abort.\n');
		process.exit(1);
	}
	const inputs = await buildAllInputs(DIRS);
	const byKey = new Map(inputs.map((b) => [`${b.pageType}/${b.slug}`, b]));

	let checked = 0;
	let failed = 0;
	let stale = 0;
	for (const pageType of DIRS) {
		const dir = join(process.cwd(), 'src/lib/content', `${pageType}-profile`);
		if (!existsSync(dir)) continue;
		const files = (await readdir(dir)).filter((f) => f.endsWith('.md'));
		for (const file of files) {
			const raw = await readFile(join(dir, file), 'utf-8');
			const fm = matter(raw);
			const slug = (fm.data.slug as string) ?? file.replace(/\.md$/, '');
			const built = byKey.get(`${pageType}/${slug}`);
			checked += 1;
			if (!built) {
				process.stderr.write(`[lint:profiles] FAIL ${pageType}/${slug}: kein passender Datensatz (orphan)\n`);
				failed += 1;
				continue;
			}
			if (fm.data.inputHash !== built.inputHash) {
				process.stderr.write(
					`[lint:profiles] STALE ${pageType}/${slug}: inputHash veraltet — neu generieren\n`
				);
				stale += 1;
			}
			const res = factLint(fm.content, built.input);
			if (!res.ok) {
				failed += 1;
				const parts: string[] = [];
				if (res.unbackedNumbers.length > 0)
					parts.push(`ungedeckte Zahlen: ${res.unbackedNumbers.join(', ')}`);
				if (res.hasDash) parts.push('Gedankenstrich gefunden');
				if (res.stigmaHits.length > 0)
					parts.push(`Stigma-Begriffe (Kriminalität/Sicherheit): ${res.stigmaHits.join(', ')}`);
				process.stderr.write(`[lint:profiles] FAIL ${pageType}/${slug}: ${parts.join('; ')}\n`);
			}
		}
	}

	process.stdout.write(`[lint:profiles] checked=${checked} failed=${failed} stale=${stale}\n`);
	await closeDb();
	if (failed > 0 || stale > 0) process.exit(1);
}

main().catch(async (err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[lint:profiles] FATAL: ${msg}\n`);
	await closeDb().catch(() => undefined);
	process.exit(1);
});
