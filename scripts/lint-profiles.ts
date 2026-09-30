/**
 * scripts/lint-profiles.ts (Story 11.7).
 *
 * Fakten-Lint-Gate für KI-Profile: jede Zahl im Prosa-Text muss aus der
 * Datenbasis stammen, keine Gedankenstriche. Rekonstruiert den ProfileInput pro
 * Slug über dasselbe Lib wie der Generator (`build.ts`). Prüft auch `<slug>.en.md`
 * (i18n Block C5: Stale-Hash, Orphan, EN-Stigma). Exit 1 bei Verstoß.
 *
 * Run: `pnpm lint:profiles`. CI-Gate vor dem Mergen generierter Profile.
 */

import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { closeDb } from '../src/lib/server/db/index.js';
import { buildAllInputs } from './lib/profiles/build.js';
import { lintProfileDir } from './lib/profiles/lint-dir.js';

const DIRS: ('kiez' | 'bezirk')[] = ['kiez', 'bezirk'];

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[lint:profiles] DATABASE_URL fehlt, abort.\n');
		process.exit(1);
	}
	const inputs = await buildAllInputs(DIRS);
	const byKey = new Map(inputs.map((b) => [`${b.pageType}/${b.slug}`, b]));

	const counts = {
		de: { checked: 0, failed: 0, stale: 0 },
		en: { checked: 0, failed: 0, stale: 0 }
	};
	for (const pageType of DIRS) {
		const dir = join(process.cwd(), 'src/lib/content', `${pageType}-profile`);
		if (!existsSync(dir)) continue;
		const names = (await readdir(dir)).filter((f) => f.endsWith('.md'));
		const files = await Promise.all(
			names.map(async (name) => ({ name, raw: await readFile(join(dir, name), 'utf-8') }))
		);
		const res = lintProfileDir({ pageType, files, byKey });
		for (const loc of ['de', 'en'] as const) {
			counts[loc].checked += res[loc].checked;
			counts[loc].failed += res[loc].failed;
			counts[loc].stale += res[loc].stale;
		}
		for (const msg of res.messages) process.stderr.write(`${msg}\n`);
	}

	for (const loc of ['de', 'en'] as const) {
		const c = counts[loc];
		process.stdout.write(
			`[lint:profiles] ${loc.toUpperCase()} checked=${c.checked} failed=${c.failed} stale=${c.stale}\n`
		);
	}
	await closeDb();
	if (Object.values(counts).some((c) => c.failed > 0 || c.stale > 0)) process.exit(1);
}

main().catch(async (err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[lint:profiles] FATAL: ${msg}\n`);
	await closeDb().catch(() => undefined);
	process.exit(1);
});
