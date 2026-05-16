import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MIGRATIONS_DIR = resolve(process.cwd(), 'drizzle/migrations');

describe('db:migrate (Story 2.0 AC-2)', () => {
	it('migrations folder exists with at least one SQL file', () => {
		expect(existsSync(MIGRATIONS_DIR)).toBe(true);
		const sqlFiles = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
		expect(sqlFiles.length).toBeGreaterThan(0);
	});

	it('initial migration creates all 6 expected tables', () => {
		const sqlFiles = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
		const allSql = sqlFiles.map((f) => readFileSync(resolve(MIGRATIONS_DIR, f), 'utf-8')).join('\n');
		const expected = [
			'bezirk_stats',
			'kiez_stats',
			'bezirk_score',
			'kiez_score',
			'faq_qna',
			'llms_content'
		];
		for (const table of expected) {
			expect(allSql, `Migration enthält keine CREATE TABLE für ${table}`).toMatch(
				new RegExp(`CREATE TABLE\\s+"${table}"`, 'i')
			);
		}
	});

	it('migrations declare FK constraints (kiez_stats + kiez_score → bezirk_stats)', () => {
		const sqlFiles = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
		const allSql = sqlFiles.map((f) => readFileSync(resolve(MIGRATIONS_DIR, f), 'utf-8')).join('\n');
		expect(allSql).toMatch(/kiez_stats_bezirk_slug_bezirk_stats_slug_fk/);
		expect(allSql).toMatch(/kiez_score_bezirk_slug_bezirk_stats_slug_fk/);
	});

	it('migrate-script exists at scripts/db/migrate.ts', () => {
		const migratePath = resolve(process.cwd(), 'scripts/db/migrate.ts');
		expect(existsSync(migratePath)).toBe(true);
	});
});
