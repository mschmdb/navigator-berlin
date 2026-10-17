import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../../scripts/lib/oklch-interpolate.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const APP_CSS = readFileSync(join(ROOT, 'src', 'app.css'), 'utf8');

// Nur Farb-Utilities mit Projekt-Token-Namen. Tailwind-Standardfarben (z. B. red-500) fallen nicht darunter.
const COLOR_UTILITY =
	/(?<![\w-])(?:text|bg|border|ring|outline|decoration|fill|stroke|divide)-((?:accent|ink|fg|rule|focus|state|severity|bg)(?:-[a-z0-9]+)*)(?![\w-])/g;

function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return sourceFiles(path);
		const isSource = /\.(svelte|ts)$/.test(name) && !/\.(test|spec)\.ts$/.test(name);
		return isSource ? [path] : [];
	});
}

function definedThemeColors(css: string): Set<string> {
	return new Set([...css.matchAll(/--color-([a-z0-9-]+):/g)].map((match) => match[1]));
}

function rootToken(css: string, name: string): string {
	const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('@theme inline'));
	const match = rootBlock.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
	if (!match) throw new Error(`Token --${name} fehlt in :root`);
	return match[1];
}

describe('Farb-Tokens', () => {
	it('jede Farb-Utility in src hat ein Theme-Token in app.css', () => {
		const defined = definedThemeColors(APP_CSS);
		const missing = new Set<string>();
		for (const file of sourceFiles(join(ROOT, 'src'))) {
			for (const match of readFileSync(file, 'utf8').matchAll(COLOR_UTILITY)) {
				if (!defined.has(match[1])) missing.add(`${match[1]} (${relative(ROOT, file)})`);
			}
		}
		expect([...missing]).toEqual([]);
	});

	it('accent-strong als Linkfarbe erreicht 4,5:1 auf allen Flächen', () => {
		const accentStrong = rootToken(APP_CSS, 'accent-strong');
		for (const surface of ['bg', 'bg-elevated', 'accent-soft', 'bg-muted']) {
			expect(contrastRatio(accentStrong, rootToken(APP_CSS, surface))).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('Text in bg-elevated auf accent-strong erreicht 4,5:1 (Button-Hover)', () => {
		const ratio = contrastRatio(
			rootToken(APP_CSS, 'bg-elevated'),
			rootToken(APP_CSS, 'accent-strong')
		);
		expect(ratio).toBeGreaterThanOrEqual(4.5);
	});

	it('accent-strong unterscheidet sich sichtbar von accent', () => {
		expect(rootToken(APP_CSS, 'accent-strong')).not.toBe(rootToken(APP_CSS, 'accent'));
	});

	it('bg-muted hebt sich von bg und bg-elevated ab und trägt ink-muted lesbar', () => {
		const muted = rootToken(APP_CSS, 'bg-muted');
		expect(muted).not.toBe(rootToken(APP_CSS, 'bg'));
		expect(contrastRatio(muted, rootToken(APP_CSS, 'bg-elevated'))).toBeGreaterThan(1.1);
		expect(contrastRatio(rootToken(APP_CSS, 'ink-muted'), muted)).toBeGreaterThanOrEqual(4.5);
	});
});
