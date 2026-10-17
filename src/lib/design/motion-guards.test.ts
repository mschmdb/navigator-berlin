import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Wächter für Reduced Motion (GH-91, Leitlinie 9). CSS-Bewegung fängt eine globale
 * Regel in app.css ab. JS-Bewegung (Smooth-Scroll, animierte Karten-Sprünge) sieht
 * diese Regel nicht und muss den Wunsch selbst abfragen.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

function sourceFiles(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			if (name === 'paraglide') continue;
			out.push(...sourceFiles(path));
		} else if (/\.(svelte|ts)$/.test(name) && !/\.(test|spec)\./.test(name)) {
			out.push(path);
		}
	}
	return out;
}

describe('Reduced Motion', () => {
	it('app.css schaltet Animationen und Übergänge global ab', () => {
		const css = readFileSync(join(SRC, 'app.css'), 'utf8');
		const block = css.match(
			/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\*,\s*\*::before,\s*\*::after\s*\{([^}]*)\}/
		);
		expect(block, 'globale Regel für *, *::before, *::after fehlt').not.toBeNull();
		const body = block![1]!;
		expect(body).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
		expect(body).toMatch(/animation-iteration-count:\s*1\s*!important/);
		expect(body).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
		expect(body).toMatch(/scroll-behavior:\s*auto\s*!important/);
	});

	it('kein festes Smooth-Scroll per JS', () => {
		const offenders: string[] = [];
		for (const file of sourceFiles(SRC)) {
			const text = readFileSync(file, 'utf8');
			text.split('\n').forEach((line, i) => {
				if (/behavior:\s*['"]smooth['"]/.test(line)) {
					offenders.push(`${relative(ROOT, file)}:${i + 1}`);
				}
			});
		}
		expect(offenders).toEqual([]);
	});

	it('kein fest animiertes fitBounds', () => {
		const offenders: string[] = [];
		for (const file of sourceFiles(SRC)) {
			const text = readFileSync(file, 'utf8');
			text.split('\n').forEach((line, i) => {
				if (/animate:\s*true/.test(line)) offenders.push(`${relative(ROOT, file)}:${i + 1}`);
			});
		}
		expect(offenders).toEqual([]);
	});
});
