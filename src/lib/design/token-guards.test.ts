import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLORS } from '$lib/components/atlas/internal/colors.js';

/*
 * Wächter für das Design-Fundament (GH-86). Tailwind-Klassen stehen in Strings,
 * ESLint sieht sie nicht zuverlässig. Dieser Scan meldet Datei und Zeile, sobald
 * Rohwerte zurückkommen: freie Schriftgrößen, `focus:` statt `focus-visible:`,
 * Hex-Farben in Komponenten.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const APP_CSS = readFileSync(join(SRC, 'app.css'), 'utf8');

function svelteFiles(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			if (name === 'paraglide') continue;
			out.push(...svelteFiles(path));
		} else if (name.endsWith('.svelte')) {
			out.push(path);
		}
	}
	return out;
}

/** Kommentare zählen nicht: sie dürfen Hex-Werte als Referenz nennen. */
function stripComments(source: string): string {
	return source
		.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
		.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
		.replace(/(^|[^:"'`])\/\/.*$/gm, (m, p: string) => p + ' '.repeat(m.length - p.length));
}

interface Hit {
	file: string;
	line: number;
	text: string;
}

function findHits(pattern: RegExp): Hit[] {
	const hits: Hit[] = [];
	for (const file of svelteFiles(SRC)) {
		const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
		lines.forEach((text, i) => {
			pattern.lastIndex = 0;
			if (pattern.test(text)) {
				hits.push({ file: relative(ROOT, file), line: i + 1, text: text.trim() });
			}
		});
	}
	return hits;
}

const format = (hits: Hit[]) => hits.map((h) => `${h.file}:${h.line}  ${h.text}`).join('\n');

describe('Design-Fundament: Rohwerte in Komponenten', () => {
	it('nutzt keine freien Pixel-Schriftgrößen (Dichte-Skala statt text-[Npx])', () => {
		const hits = findHits(/text-\[\d+(\.\d+)?px\]/);
		expect(format(hits)).toBe('');
	});

	it('setzt in SVG keine Schrift unter 11 px', () => {
		const hits = findHits(/font-size="(?:[0-9]|10)(?:\.\d+)?"/);
		expect(format(hits)).toBe('');
	});

	it('nutzt focus-visible statt focus', () => {
		const hits = findHits(/(?:^|[\s"'`{])focus:[a-z]/);
		expect(format(hits)).toBe('');
	});

	it('enthält keine Hex-Farben außerhalb von Kommentaren', () => {
		const hits = findHits(/(?<![\w&/-])#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b(?![\w-])/);
		const real = hits.filter((h) => !/href="#|id="#|#\{|\{#|aria-[a-z]+="#/.test(h.text));
		expect(format(real)).toBe('');
	});
});

describe('Design-Fundament: Tokens', () => {
	it.each([
		['--text-dense-meta', '0.6875rem'],
		['--text-dense-label', '0.75rem'],
		['--text-dense-value', '0.8125rem'],
		['--leading-body', '1.45'],
		['--leading-dense', '1.35'],
		['--target-min', '24px']
	])('definiert %s = %s', (name, value) => {
		expect(APP_CSS).toMatch(new RegExp(`\\n\\s*${name}:\\s*${value.replace('.', '\\.')};`));
	});

	it('mappt die Dichte-Skala und Zeilenabstände als Tailwind-Utilities', () => {
		const theme = APP_CSS.slice(APP_CSS.indexOf('@theme inline'));
		for (const name of ['--text-dense-meta', '--text-dense-label', '--text-dense-value']) {
			expect(theme).toContain(`${name}: var(${name});`);
		}
		expect(theme).toContain('--leading-body: var(--leading-body);');
		expect(theme).toContain('--leading-dense: var(--leading-dense);');
	});

	it('zeigt den globalen Fokus auch an summary und Formularfeldern', () => {
		const rule = APP_CSS.match(/:where\(([^)]*)\):focus-visible/);
		expect(rule?.[1]).toBeDefined();
		for (const el of ['a', 'button', 'summary', 'input', 'select', 'textarea']) {
			expect(rule![1]).toMatch(new RegExp(`(^|[ ,])${el}($|[ ,])`));
		}
	});
});

describe('Design-Fundament: colors.ts spiegelt app.css', () => {
	const kebab = (key: string) =>
		key
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.replace(/([a-zA-Z])(\d)/g, '$1-$2')
			.toLowerCase();

	const cssValue = (name: string): string | null => {
		const m = APP_CSS.match(new RegExp(`\\n\\s*--${name}:\\s*(#[0-9a-fA-F]{6});`));
		return m ? m[1]!.toLowerCase() : null;
	};

	it('hat für jeden Schlüssel mit CSS-Gegenstück denselben Hex-Wert', () => {
		const mismatches = Object.entries(COLORS)
			.map(([key, hex]) => ({ key, hex: hex.toLowerCase(), css: cssValue(kebab(key)) }))
			.filter((e) => e.css !== null && e.css !== e.hex)
			.map((e) => `${e.key}: colors.ts ${e.hex} ≠ app.css ${e.css}`);
		expect(mismatches.join('\n')).toBe('');
	});

	it('führt Wärme- und Kühle-Orte als Tokens in beiden Quellen', () => {
		expect(cssValue('umwelt-kuehle-orte')).toBe(COLORS.umweltKuehleOrte.toLowerCase());
		expect(cssValue('umwelt-waerme-orte')).toBe(COLORS.umweltWaermeOrte.toLowerCase());
		expect(COLORS.umweltWaermeOrte.toLowerCase()).toBe('#b5390a');
	});
});
