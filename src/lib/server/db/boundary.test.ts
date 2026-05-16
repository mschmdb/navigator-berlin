import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * Architecture-Boundary-Test (Story 2.0 AC-3, AC-7-A3):
 * Kein Client-Code (`src/lib/components/**`, `src/lib/data/**`, `+page.svelte`)
 * darf aus `$lib/server/**` importieren. SvelteKit erzwingt das zur Build-Zeit,
 * dieser Test fängt Verletzungen schon im Unit-Test ab.
 */
describe('Architecture boundary: $lib/server/** not imported from client code', () => {
	function findImports(searchPattern: string, paths: string[]): string[] {
		const args = paths.join(' ');
		try {
			const out = execSync(`grep -rln "${searchPattern}" ${args} 2>/dev/null || true`, {
				encoding: 'utf-8'
			}).trim();
			return out ? out.split('\n').filter(Boolean) : [];
		} catch {
			return [];
		}
	}

	it('src/lib/components/ does not import $lib/server/**', () => {
		const offenders = findImports(
			"from ['\\\"]\\$lib/server",
			['src/lib/components']
		);
		expect(offenders, `Offending files: ${offenders.join(', ')}`).toEqual([]);
	});

	it('src/lib/data/ does not import $lib/server/** (excluding .remote.ts / .server.ts)', () => {
		const offenders = findImports(
			"from ['\\\"]\\$lib/server",
			['src/lib/data']
		).filter((f) => !/\.(remote|server)\.ts$/.test(f));
		expect(offenders, `Offending files: ${offenders.join(', ')}`).toEqual([]);
	});

	it('+page.svelte / +layout.svelte do not import $lib/server/**', () => {
		const offenders = findImports("from ['\\\"]\\$lib/server", ['src/routes']).filter(
			(f) => /\+page\.svelte$|\+layout\.svelte$/.test(f)
		);
		expect(offenders, `Offending files: ${offenders.join(', ')}`).toEqual([]);
	});

	it('schema modules are at src/lib/server/db/schema/ (not src/lib/db/)', () => {
		const src = readFileSync('src/lib/server/db/schema/index.ts', 'utf-8');
		expect(src).toMatch(/bezirk-stats/);
	});
});
