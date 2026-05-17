import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeDraft, type DraftPayload } from './write-draft.js';

const cleanLint = { ok: true, violations: [] } as const;
const dirtyLint = {
	ok: false,
	violations: [{ token: 'em-dash', line: 5, snippet: 'foo — bar' }]
} as const;

const sample: DraftPayload = {
	title_de: 'Lärm-Update für Kreuzberg',
	summary_de: 'Strategische Lärmkartierung 2024 ist live.',
	category: 'daten-update',
	tags: ['laerm', 'kreuzberg'],
	body: 'Ein einfacher Body.\n'
};

let workDir: string;

beforeEach(async () => {
	workDir = await mkdtemp(join(tmpdir(), 'pubupd-'));
});

afterEach(async () => {
	await rm(workDir, { recursive: true, force: true });
});

describe('writeDraft', () => {
	it('schreibt File mit deterministischem Slug aus title_de', async () => {
		const r = await writeDraft({
			commitSha: 'abc1234567',
			commitDateIso: '2026-05-17',
			draft: sample,
			lintResult: cleanLint,
			draftsDir: workDir
		});
		expect(r.ok).toBe(true);
		expect(r.path).toMatch(/2026-05-17-laerm-update-fuer-kreuzberg\.md$/);
		const txt = await readFile(r.path, 'utf8');
		expect(txt).toContain('title_de: "Lärm-Update für Kreuzberg"');
		expect(txt).toContain('category: daten-update');
		expect(txt).toContain('tags: ["laerm", "kreuzberg"]');
		expect(txt).toContain('Ein einfacher Body.');
	});

	it('_FAIL_-Präfix bei lint-violation + Header im Body', async () => {
		const r = await writeDraft({
			commitSha: 'def5678',
			commitDateIso: '2026-05-17',
			draft: sample,
			lintResult: dirtyLint,
			draftsDir: workDir
		});
		expect(r.ok).toBe(false);
		expect(r.path).toMatch(/_FAIL_2026-05-17-laerm-update-fuer-kreuzberg\.md$/);
		const txt = await readFile(r.path, 'utf8');
		expect(txt).toContain('Lint-Verstoß');
		expect(txt).toContain('Zeile 5');
		expect(txt).toContain('em-dash');
	});

	it('Slug-Kollision → Suffix mit short-sha', async () => {
		await writeDraft({
			commitSha: 'sha1aaa',
			commitDateIso: '2026-05-17',
			draft: sample,
			lintResult: cleanLint,
			draftsDir: workDir
		});
		const r2 = await writeDraft({
			commitSha: 'sha2bbb',
			commitDateIso: '2026-05-17',
			draft: sample,
			lintResult: cleanLint,
			draftsDir: workDir
		});
		expect(r2.path).toMatch(/-sha2bb\.md$/);
		const files = await readdir(workDir);
		expect(files).toHaveLength(2);
	});

	it('atomic-write: kein .tmp übrig nach erfolgreichem Write', async () => {
		await writeDraft({
			commitSha: 'abc',
			commitDateIso: '2026-05-17',
			draft: sample,
			lintResult: cleanLint,
			draftsDir: workDir
		});
		const files = await readdir(workDir);
		expect(files.every((f) => !f.endsWith('.tmp'))).toBe(true);
	});

	it('legt draftsDir an wenn nicht vorhanden', async () => {
		const nested = join(workDir, 'nested', 'subdir');
		const r = await writeDraft({
			commitSha: 'abc',
			commitDateIso: '2026-05-17',
			draft: sample,
			lintResult: cleanLint,
			draftsDir: nested
		});
		expect(r.path).toContain('nested/subdir');
	});

	it('leerer title_de → Fallback auf short-sha als slug', async () => {
		const r = await writeDraft({
			commitSha: 'fedcba9',
			commitDateIso: '2026-05-17',
			draft: { ...sample, title_de: '!!!' },
			lintResult: cleanLint,
			draftsDir: workDir
		});
		expect(r.path).toMatch(/2026-05-17-fedcba\.md$/);
	});

	it('keine tags → Frontmatter ohne tags-Zeile', async () => {
		const r = await writeDraft({
			commitSha: 'abc',
			commitDateIso: '2026-05-17',
			draft: { ...sample, tags: [] },
			lintResult: cleanLint,
			draftsDir: workDir
		});
		const txt = await readFile(r.path, 'utf8');
		expect(txt).not.toContain('tags:');
	});
});
