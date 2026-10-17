import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Wächter für die Zeilenlänge der Leseseiten (#90, Leitlinie 14: 45 bis 90 Zeichen).
 * Absätze, Listenpunkte und Definitionen auf diesen Seiten folgen --measure (70 Zeichen).
 * Tabellen und Überschriften dürfen breiter laufen.
 */

const ROOT = process.cwd();
const ROUTES = join(ROOT, 'src/routes/(with-header)');

const READING_PAGES = [
	'methodik/+page.svelte',
	'methodik/kiez-score/+page.svelte',
	'methodik/wahldaten/+page.svelte',
	'lizenzen/+page.svelte',
	'ueber/+page.svelte',
	'updates/+page.svelte',
	'webmcp/+page.svelte',
	'architektur/+page.svelte',
	'datenschutz/+page.svelte',
	'impressum/+page.svelte'
];

describe('Leseseiten begrenzen die Zeilenlänge (#90)', () => {
	it('app.css definiert --measure und die Klasse text-measure', () => {
		const css = readFileSync(join(ROOT, 'src/app.css'), 'utf8');
		expect(css).toMatch(/--measure:\s*70ch/);
		expect(css).toMatch(/\.text-measure\s+:where\(p,\s*li,\s*dd\)/);
	});

	it.each(READING_PAGES)('%s setzt text-measure am Seitencontainer', (file) => {
		const source = readFileSync(join(ROUTES, file), 'utf8');
		expect(source).toMatch(/<(article|main)\b[^>]*class="[^"]*\btext-measure\b/);
	});
});
