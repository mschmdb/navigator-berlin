import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * GH-93: Der Score heißt überall „Kiez-Score“ (EN „Kiez score“). Die alten
 * Namen „Umwelt- & Infrastruktur-Score“, „Bezirks-Score“ und die Route
 * `/umwelt-infrastruktur-score` dürfen in Messages und Quellcode nicht mehr
 * vorkommen. Ausnahme: der Redirect, der die alte URL auf `/kiez-score`
 * umleitet, und seine Tests.
 */

const ROOT = join(import.meta.dirname, '..', '..', '..');

const OLD_NAMES: RegExp[] = [
	/Umwelt- (&|&amp;|und) Infrastruktur-Score/,
	/Environment (&|and) infrastructure score/i,
	/Bezirks-Score/,
	/\bdistrict score\b/i,
	/\bBezirk score\b/,
	/Kiez-Score (·|:) Gesamt/,
	/Kiez score: overall/i
];

const OLD_ROUTE = /umwelt-infrastruktur-score/;

/** Dateien, die die alte Route bewusst nennen (301-Redirect und Tests). */
const ROUTE_ALLOWLIST = new Set([
	'src/lib/seo/renamed-route-redirect.ts',
	'src/lib/seo/renamed-route-redirect.test.ts',
	'src/lib/seo/score-name.test.ts'
]);

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		if (name === 'paraglide' || name === 'node_modules' || name.startsWith('.')) continue;
		const path = join(dir, name);
		if (statSync(path).isDirectory()) walk(path, out);
		else if (/\.(ts|svelte|json|txt)$/.test(name)) out.push(path);
	}
	return out;
}

const files = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'messages'))].map((p) => ({
	rel: relative(ROOT, p),
	text: readFileSync(p, 'utf8')
}));

describe('Score-Name (GH-93)', () => {
	it.each(OLD_NAMES.map((re) => [re.source, re] as const))(
		'kein alter Score-Name %s in src und messages',
		(_label, re) => {
			const hits = files.filter(
				(f) => f.rel !== 'src/lib/seo/score-name.test.ts' && re.test(f.text)
			);
			expect(hits.map((f) => f.rel)).toEqual([]);
		}
	);

	it('keine alte Route /umwelt-infrastruktur-score außerhalb des Redirects', () => {
		const hits = files.filter((f) => !ROUTE_ALLOWLIST.has(f.rel) && OLD_ROUTE.test(f.text));
		expect(hits.map((f) => f.rel)).toEqual([]);
	});

	it('Route /kiez-score existiert', () => {
		const page = join(ROOT, 'src', 'routes', '(with-header)', 'kiez-score', '+page.svelte');
		expect(() => statSync(page)).not.toThrow();
	});
});
