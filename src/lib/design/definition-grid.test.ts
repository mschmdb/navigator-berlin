import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Wächter für Definitionslisten (#105, WCAG 1.4.10 Reflow).
 * Ein Raster aus `max-content` und `1fr` kann auf 320 px nicht schrumpfen:
 * die 1fr-Spalte hat ihre Mindestbreite aus dem längsten Wort. Solche Listen
 * nutzen die Klasse `definition-grid` aus app.css: mobil untereinander,
 * ab sm zweispaltig, Werte brechen bei Bedarf um.
 */

const ROOT = process.cwd();

function svelteFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return svelteFiles(path);
		return name.endsWith('.svelte') ? [path] : [];
	});
}

describe('Definitionslisten laufen auf schmalen Bildschirmen nicht über (#105)', () => {
	it('app.css definiert definition-grid mit schrumpfbarer Wertspalte', () => {
		const css = readFileSync(join(ROOT, 'src/app.css'), 'utf8');
		const block = css.match(/\.definition-grid\s*\{[^}]*\}/)?.[0] ?? '';
		expect(block).toMatch(/display:\s*grid/);
		expect(css).toMatch(
			/\.definition-grid\s*\{[^}]*grid-template-columns:\s*max-content\s+minmax\(0,\s*1fr\)/
		);
		expect(css).toMatch(/\.definition-grid\s*>\s*dd\s*\{[^}]*overflow-wrap:\s*anywhere/);
	});

	it('kein Raster aus max-content und ungeschütztem 1fr in Komponenten', () => {
		const offenders = svelteFiles(join(ROOT, 'src'))
			.filter((file) => /grid-cols-\[max-content_1fr\]/.test(readFileSync(file, 'utf8')))
			.map((file) => file.replace(`${ROOT}/`, ''));
		expect(offenders).toEqual([]);
	});

	it('Fließtext auf Leseseiten bricht lange Links und Bezeichner um', () => {
		const css = readFileSync(join(ROOT, 'src/app.css'), 'utf8');
		expect(css).toMatch(
			/\.text-measure\s+:where\(p,\s*li,\s*dd\)\s*\{[^}]*overflow-wrap:\s*break-word/
		);
	});
});
