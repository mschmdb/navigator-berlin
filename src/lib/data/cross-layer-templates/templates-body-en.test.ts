import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadTemplatesFromRawMap } from './loader.js';

const ROOT = __dirname;
const PLACEHOLDER = /\{([a-z0-9_]+)\}/g;

function collectYaml(dir: string, acc: Record<string, string> = {}): Record<string, string> {
	for (const name of readdirSync(dir)) {
		const abs = join(dir, name);
		if (statSync(abs).isDirectory()) collectYaml(abs, acc);
		else if (name.endsWith('.yaml') || name.endsWith('.yml')) acc[abs] = readFileSync(abs, 'utf-8');
	}
	return acc;
}

function placeholders(body: string): string[] {
	return [...body.matchAll(PLACEHOLDER)].map((m) => m[1]!).sort();
}

const templates = loadTemplatesFromRawMap(collectYaml(ROOT)).flatMap((b) => b.templates);

describe('Cross-Layer-Templates: EN-Pflicht (i18n C4a)', () => {
	it('findet mindestens ein Template', () => {
		expect(templates.length).toBeGreaterThan(0);
	});

	it.each(templates.map((t) => [t.id, t] as const))('%s hat body_en', (_id, t) => {
		expect(t.body_en, `Template ${t.id} ohne body_en`).toBeTruthy();
	});

	it.each(templates.map((t) => [t.id, t] as const))(
		'%s: body_en nutzt dieselben Platzhalter wie body_de',
		(_id, t) => {
			expect(placeholders(t.body_en ?? '')).toEqual(placeholders(t.body_de));
		}
	);
});
