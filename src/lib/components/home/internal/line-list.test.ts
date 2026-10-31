import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lineItem, lineList, lineRow } from './line-list.js';

/*
 * Wächter für die Startseite (Epic #85, Leitlinie 4 und 29): Listen stehen als
 * Zeilen mit Trennlinie, nicht als gerahmte Karten. Bewusste Ausnahme (#171):
 * die Aufgaben-Kacheln der Startseite. Erlaubt bleiben außerdem die Buttons
 * aus `cta.ts`.
 */

const HOME_DIR = join(process.cwd(), 'src/lib/components/home');

/** Gerahmte Fläche: Radius und Rahmen im selben Text (class-Attribut oder String-Literal). */
const BOXED =
	/\brounded(?:-[a-z]+)?\b[\s\S]*\bborder\b(?!-)|\bborder\b(?!-)[\s\S]*\brounded(?:-[a-z]+)?\b/;

/** `class="…"` über Zeilen hinweg sowie '…', "…" und `…` ohne Zeilenumbruch. */
const CANDIDATES = /class="[^"]*"|'[^'\n]*'|"[^"\n]*"|`[^`\n]*`/g;

/** Aufgaben-Kachel (#171) und Screenshot-Rahmen der Vorschau: je eine Kante zum Grund. */
const TILE = /\brounded border border-rule bg-bg-elevated\b/;
const PREVIEW_FRAME = /overflow-hidden rounded border border-rule bg-bg-muted/;
const ALLOWED = [TILE, PREVIEW_FRAME];

function homeSvelteFiles(): string[] {
	return readdirSync(HOME_DIR)
		.filter((n) => n.endsWith('.svelte'))
		.map((n) => join(HOME_DIR, n));
}

function boxedMatches(): { file: string; text: string; allowed: boolean }[] {
	const found: { file: string; text: string; allowed: boolean }[] = [];
	for (const file of homeSvelteFiles()) {
		for (const [text] of readFileSync(file, 'utf8').matchAll(CANDIDATES)) {
			if (BOXED.test(text)) {
				found.push({
					file: file.replace(HOME_DIR, 'home'),
					text,
					allowed: ALLOWED.some((re) => re.test(text))
				});
			}
		}
	}
	return found;
}

describe('Startseite ohne Karten-Baukasten', () => {
	it('hat keine gerahmten Karten außer den Aufgaben-Kacheln und dem Vorschau-Rahmen', () => {
		const hits = boxedMatches()
			.filter((h) => !h.allowed)
			.map((h) => `${h.file}: ${h.text}`);
		expect(hits).toEqual([]);
	});

	it('findet Kachel und Vorschau-Rahmen, der Wächter ist nicht blind', () => {
		const found = boxedMatches();
		expect(found.some((h) => h.file.endsWith('home-task-tile.svelte') && TILE.test(h.text))).toBe(
			true
		);
		expect(
			found.some((h) => h.file.endsWith('home-preview-link.svelte') && PREVIEW_FRAME.test(h.text))
		).toBe(true);
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
