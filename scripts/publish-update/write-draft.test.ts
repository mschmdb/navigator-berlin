import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
	title_en: 'Noise update for Kreuzberg',
	summary_en: 'Strategic noise mapping 2024 is live.',
	tags: ['laerm', 'kreuzberg'],
	body: 'Ein einfacher Body.\n',
	body_en: 'A simple body.\n'
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
			lintResultEn: cleanLint,
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
			lintResultEn: cleanLint,
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
			lintResultEn: cleanLint,
			draftsDir: workDir
		});
		const r2 = await writeDraft({
			commitSha: 'sha2bbb',
			commitDateIso: '2026-05-17',
			draft: sample,
			lintResult: cleanLint,
			lintResultEn: cleanLint,
			draftsDir: workDir
		});
		expect(r2.path).toMatch(/-sha2bb\.md$/);
		const files = await readdir(workDir);
		expect(files).toHaveLength(4);
	});

	it('atomic-write: kein .tmp übrig nach erfolgreichem Write', async () => {
		await writeDraft({
			commitSha: 'abc',
			commitDateIso: '2026-05-17',
			draft: sample,
			lintResult: cleanLint,
			lintResultEn: cleanLint,
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
			lintResultEn: cleanLint,
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
			lintResultEn: cleanLint,
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
			lintResultEn: cleanLint,
			draftsDir: workDir
		});
		const txt = await readFile(r.path, 'utf8');
		expect(txt).not.toContain('tags:');
	});

	describe('EN-Schwesterdatei (i18n C4d)', () => {
		const dirtyEn = {
			ok: false,
			violations: [{ token: 'coolify', line: 2, snippet: 'deployed via Coolify' }]
		} as const;

		it('schreibt title_en und summary_en ins DE-Frontmatter', async () => {
			const r = await writeDraft({
				commitSha: 'abc1234567',
				commitDateIso: '2026-05-17',
				draft: sample,
				lintResult: cleanLint,
				lintResultEn: cleanLint,
				draftsDir: workDir
			});
			const txt = await readFile(r.path, 'utf8');
			expect(txt).toContain('title_en: "Noise update for Kreuzberg"');
			expect(txt).toContain('summary_en: "Strategic noise mapping 2024 is live."');
			expect(txt).not.toContain('A simple body.');
		});

		it('schreibt body_en als <datei>.en.md ohne Frontmatter', async () => {
			const r = await writeDraft({
				commitSha: 'abc1234567',
				commitDateIso: '2026-05-17',
				draft: sample,
				lintResult: cleanLint,
				lintResultEn: cleanLint,
				draftsDir: workDir
			});
			expect(r.pathEn).toMatch(/2026-05-17-laerm-update-fuer-kreuzberg\.en\.md$/);
			expect(r.pathEn.replace(/\.en\.md$/, '.md')).toBe(r.path);
			const en = await readFile(r.pathEn, 'utf8');
			expect(en).toBe('A simple body.\n');
			expect((await readdir(workDir)).sort()).toEqual([
				'2026-05-17-laerm-update-fuer-kreuzberg.en.md',
				'2026-05-17-laerm-update-fuer-kreuzberg.md'
			]);
		});

		it('EN-Lint-Verstoß: beide Dateien mit _FAIL_, Verstoß im EN-Header', async () => {
			const r = await writeDraft({
				commitSha: 'abc1234567',
				commitDateIso: '2026-05-17',
				draft: sample,
				lintResult: cleanLint,
				lintResultEn: dirtyEn,
				draftsDir: workDir
			});
			expect(r.ok).toBe(false);
			expect(r.path).toMatch(/_FAIL_2026-05-17-laerm-update-fuer-kreuzberg\.md$/);
			expect(r.pathEn).toMatch(/_FAIL_2026-05-17-laerm-update-fuer-kreuzberg\.en\.md$/);
			const en = await readFile(r.pathEn, 'utf8');
			expect(en).toContain('Lint-Verstoß');
			expect(en).toContain('Zeile 2');
			expect(en).toContain('coolify');
			const de = await readFile(r.path, 'utf8');
			expect(de).toContain('EN-Fassung');
			expect(de).toContain('.en.md');
			expect(de).not.toContain('\u2014');
		});

		it('DE-Lint-Verstoß: auch die EN-Datei trägt _FAIL_', async () => {
			const r = await writeDraft({
				commitSha: 'abc1234567',
				commitDateIso: '2026-05-17',
				draft: sample,
				lintResult: dirtyLint,
				lintResultEn: cleanLint,
				draftsDir: workDir
			});
			expect(r.pathEn).toMatch(/_FAIL_2026-05-17-laerm-update-fuer-kreuzberg\.en\.md$/);
			const en = await readFile(r.pathEn, 'utf8');
			expect(en).not.toContain('Lint-Verstoß');
		});

		it('Slug-Kollision: beide Dateien bekommen denselben short-sha-Suffix', async () => {
			const args = {
				commitDateIso: '2026-05-17',
				draft: sample,
				lintResult: cleanLint,
				lintResultEn: cleanLint,
				draftsDir: workDir
			};
			await writeDraft({ ...args, commitSha: 'sha1aaa' });
			const r2 = await writeDraft({ ...args, commitSha: 'sha2bbb' });
			expect(r2.path).toMatch(/-sha2bb\.md$/);
			expect(r2.pathEn).toMatch(/-sha2bb\.en\.md$/);
		});

		it('Kollision nur bei der EN-Datei zählt ebenfalls', async () => {
			await writeFile(join(workDir, '2026-05-17-laerm-update-fuer-kreuzberg.en.md'), 'alt');
			const r = await writeDraft({
				commitSha: 'sha3ccc',
				commitDateIso: '2026-05-17',
				draft: sample,
				lintResult: cleanLint,
				lintResultEn: cleanLint,
				draftsDir: workDir
			});
			expect(r.path).toMatch(/-sha3cc\.md$/);
			expect(r.pathEn).toMatch(/-sha3cc\.en\.md$/);
		});

		it('kein .tmp übrig nach dem Schreiben beider Dateien', async () => {
			await writeDraft({
				commitSha: 'abc',
				commitDateIso: '2026-05-17',
				draft: sample,
				lintResult: cleanLint,
				lintResultEn: cleanLint,
				draftsDir: workDir
			});
			expect((await readdir(workDir)).filter((f) => f.endsWith('.tmp'))).toEqual([]);
		});

		it('derselbe Commit erneut: nichts wird überschrieben, Zähler-Suffix', async () => {
			const args = {
				commitSha: 'samesha1',
				commitDateIso: '2026-05-17',
				draft: sample,
				lintResult: cleanLint,
				lintResultEn: cleanLint,
				draftsDir: workDir
			};
			const r1 = await writeDraft(args);
			const r2 = await writeDraft(args);
			const r3 = await writeDraft(args);
			expect(r2.path).toMatch(/-samesh\.md$/);
			expect(r3.path).toMatch(/-samesh-2\.md$/);
			expect(r3.pathEn).toMatch(/-samesh-2\.en\.md$/);
			expect(new Set([r1.path, r2.path, r3.path]).size).toBe(3);
			expect(await readdir(workDir)).toHaveLength(6);
		});

		it('scheitert das Schreiben der EN-Datei, bleibt kein DE-Draft und kein .tmp', async () => {
			const { mkdir } = await import('node:fs/promises');
			await mkdir(join(workDir, '2026-05-17-laerm-update-fuer-kreuzberg.en.md.tmp'));
			await expect(
				writeDraft({
					commitSha: 'abc1234567',
					commitDateIso: '2026-05-17',
					draft: sample,
					lintResult: cleanLint,
					lintResultEn: cleanLint,
					draftsDir: workDir
				})
			).rejects.toThrow();
			expect(await readdir(workDir)).toEqual(['2026-05-17-laerm-update-fuer-kreuzberg.en.md.tmp']);
		});

		it('Backslash, Anführungszeichen und Zeilenumbruch bleiben gültiges YAML', async () => {
			const matter = (await import('gray-matter')).default;
			const title_en = 'Path C:\\temp "quoted"\nsecond line';
			const r = await writeDraft({
				commitSha: 'abc1234567',
				commitDateIso: '2026-05-17',
				draft: { ...sample, title_en, summary_en: 'Ends with backslash \\' },
				lintResult: cleanLint,
				lintResultEn: cleanLint,
				draftsDir: workDir
			});
			const data = matter(await readFile(r.path, 'utf8')).data;
			expect(data.title_en).toBe(title_en);
			expect(data.summary_en).toBe('Ends with backslash \\');
			expect(data.title_de).toBe('Lärm-Update für Kreuzberg');
		});
	});
});
