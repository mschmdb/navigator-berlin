import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lineItem, lineList, lineRow } from './line-list.js';

/*
 * Wächter für die Startseite (Epic #85, Leitlinie 4 und 29): Listen stehen als
 * Zeilen mit Trennlinie, nicht als gerahmte Karten. Erlaubt bleiben die
 * Screenshot-Rahmen der Kartenvorschau (ein Bild braucht eine Kante zum Grund)
 * und die Buttons aus `cta.ts`.
 */

const HOME_DIR = join(process.cwd(), 'src/lib/components/home');

/** Gerahmte Fläche: Radius und Rahmen in derselben Klassenliste. */
const BOXED = /class="[^"]*\brounded(?:-[a-z]+)?\b[^"]*\bborder\b(?!-)[^"]*"/;

/** Screenshot-Vorschau als Bild mit Kante, kein Karten-Baukasten. */
const ALLOWED = [/overflow-hidden rounded border border-rule bg-bg-muted/];

function homeSvelteFiles(): string[] {
	return readdirSync(HOME_DIR)
		.filter((n) => n.endsWith('.svelte'))
		.map((n) => join(HOME_DIR, n));
}

describe('Startseite ohne Karten-Baukasten', () => {
	it('hat keine gerahmten Karten außer der Screenshot-Vorschau', () => {
		const hits: string[] = [];
		for (const file of homeSvelteFiles()) {
			const lines = readFileSync(file, 'utf8').split('\n');
			lines.forEach((text, i) => {
				if (BOXED.test(text) && !ALLOWED.some((re) => re.test(text))) {
					hits.push(`${file.replace(HOME_DIR, 'home')}:${i + 1}`);
				}
			});
		}
		expect(hits).toEqual([]);
	});
});

describe('line-list Klassen', () => {
	it('trennt Zeilen mit einer Linie und ohne Radius', () => {
		expect(lineItem).toMatch(/\bborder-t\b/);
		expect(lineItem).toMatch(/\bborder-rule\b/);
		expect(`${lineList} ${lineItem} ${lineRow}`).not.toMatch(/\brounded\b|\bshadow\b/);
	});

	it('macht die ganze Zeile zum Klickziel mit Mindesthöhe', () => {
		expect(lineRow).toMatch(/min-h-\(--target-min\)/);
		expect(lineRow).toMatch(/\bflex\b/);
	});

	it('schließt die Liste unten mit einer Linie ab', () => {
		expect(lineList).toMatch(/\bborder-b\b/);
	});
});
