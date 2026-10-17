import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * #110: `/kuehle-orte` leitet per 301 auf `/hitze` um. Kein interner Link,
 * keine Sitemap, kein llms-Eintrag und kein Translation-Register-Eintrag darf
 * die alte Seiten-Route noch nennen. Der Layer-Slug `/layer/kuehle-orte`,
 * Komponenten-Pfade (`components/kuehle-orte/`) und die externe Domain
 * `kuehle-orte.berlin.de` sind keine Seiten-Route und bleiben erlaubt.
 */
const ROOTS = ['src', 'scripts', 'tests'];
const SKIP_DIRS = new Set(['node_modules', 'paraglide', '__snapshots__']);
const ALLOWED_FILES = new Set([
	'src/lib/seo/renamed-route-redirect.ts',
	'src/lib/seo/renamed-route-redirect.test.ts',
	'src/lib/seo/kuehle-orte-route-guard.test.ts'
]);

// Relative Route: vor dem Schrägstrich steht kein Wortzeichen, Punkt, Bindestrich,
// Backslash oder weiterer Schrägstrich. Das schließt `/layer/kuehle-orte`,
// `components/kuehle-orte`, `../kuehle-orte`, `\/daten\/kuehle-orte` und
// `https://kuehle-orte.berlin.de` aus. Absolute URLs auf navigator.berlin
// prüft das zweite Muster.
const RELATIVE_ROUTE = /(?<![\w./\\-])\/(?:en\/)?kuehle-orte(?![\w.\\-])/;
const ABSOLUTE_ROUTE = /navigator\.berlin\/(?:en\/)?kuehle-orte(?![\w.\\-])/;
const isPageRoute = (line: string) => RELATIVE_ROUTE.test(line) || ABSOLUTE_ROUTE.test(line);

function listFiles(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		if (SKIP_DIRS.has(name)) continue;
		const full = join(dir, name);
		if (statSync(full).isDirectory()) out.push(...listFiles(full));
		else if (/\.(ts|svelte|js|json|txt)$/.test(name)) out.push(full);
	}
	return out;
}

describe('#110: keine Referenz auf die Seiten-Route /kuehle-orte', () => {
	it('kein Quelltext nennt /kuehle-orte als Seite', () => {
		const offenders: string[] = [];
		for (const root of ROOTS) {
			for (const file of listFiles(root)) {
				if (ALLOWED_FILES.has(file)) continue;
				const lines = readFileSync(file, 'utf8').split('\n');
				lines.forEach((line, i) => {
					if (isPageRoute(line)) offenders.push(`${file}:${i + 1}`);
				});
			}
		}
		expect(offenders).toEqual([]);
	});

	it('die Seiten-Route existiert nicht mehr', () => {
		expect(() => statSync('src/routes/(with-header)/kuehle-orte')).toThrow();
	});
});
