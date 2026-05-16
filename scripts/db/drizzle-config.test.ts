import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CONFIG_PATH = resolve(process.cwd(), 'drizzle.config.ts');

describe('drizzle.config.ts (Story 2.0 AC-1 smoke)', () => {
	it('config file exists at repo root', () => {
		expect(existsSync(CONFIG_PATH)).toBe(true);
	});

	it('references DATABASE_URL via process.env', () => {
		const src = readFileSync(CONFIG_PATH, 'utf-8');
		expect(src).toMatch(/process\.env\.DATABASE_URL/);
	});

	it('points schema to src/lib/server/db/schema/index.ts (server-only boundary)', () => {
		const src = readFileSync(CONFIG_PATH, 'utf-8');
		expect(src).toMatch(/\.\/src\/lib\/server\/db\/schema\/index\.ts/);
	});

	it('writes migrations to drizzle/migrations', () => {
		const src = readFileSync(CONFIG_PATH, 'utf-8');
		expect(src).toMatch(/\.\/drizzle\/migrations/);
	});

	it('declares postgresql dialect', () => {
		const src = readFileSync(CONFIG_PATH, 'utf-8');
		expect(src).toMatch(/dialect:\s*['"]postgresql['"]/);
	});

	it('throws clear German error when DATABASE_URL missing', () => {
		const src = readFileSync(CONFIG_PATH, 'utf-8');
		expect(src).toMatch(/DATABASE_URL ist nicht gesetzt/);
	});
});
