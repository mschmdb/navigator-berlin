import { describe, expect, it } from 'vitest';
import { classifyChangedFiles } from './filter-commit.js';

describe('classifyChangedFiles', () => {
	it('Allowlist-only Commit → relevant', () => {
		const r = classifyChangedFiles([
			'src/routes/(with-header)/updates/+page.svelte',
			'src/lib/components/atlas/site-header.svelte'
		]);
		expect(r.relevant).toBe(true);
		expect(r.publicPaths).toHaveLength(2);
		expect(r.reason).toContain('allowlist-match');
	});

	it('Denylist-only Commit → NICHT relevant', () => {
		const r = classifyChangedFiles(['.env', '.github/workflows/deploy.yml']);
		expect(r.relevant).toBe(false);
		expect(r.reason).toContain('denylist');
		expect(r.publicPaths).toEqual([]);
	});

	it('Mixed-Commit → NICHT relevant + Split-Hinweis', () => {
		const r = classifyChangedFiles(['src/routes/+page.svelte', '.env.production']);
		expect(r.relevant).toBe(false);
		expect(r.reason).toContain('aufsplitten');
	});

	it('Leerer Diff (Merge-Commit) → NICHT relevant', () => {
		const r = classifyChangedFiles([]);
		expect(r.relevant).toBe(false);
		expect(r.reason).toContain('Merge-Commit');
	});

	it('.env-Add → NICHT relevant', () => {
		expect(classifyChangedFiles(['.env']).relevant).toBe(false);
		expect(classifyChangedFiles(['.env.local']).relevant).toBe(false);
	});

	it('scripts/lib/sources.ts → NICHT relevant', () => {
		const r = classifyChangedFiles(['scripts/lib/sources.ts']);
		expect(r.relevant).toBe(false);
		expect(r.reason).toContain('denylist');
	});

	it('Coolify/Docker/Lefthook → NICHT relevant', () => {
		expect(classifyChangedFiles(['coolify.yml']).relevant).toBe(false);
		expect(classifyChangedFiles(['docker-compose.yml']).relevant).toBe(false);
		expect(classifyChangedFiles(['Dockerfile']).relevant).toBe(false);
		expect(classifyChangedFiles(['lefthook.yml']).relevant).toBe(false);
	});

	it('_bmad-output / .claude/skills → NICHT relevant', () => {
		expect(classifyChangedFiles(['_bmad-output/sprint-status.yaml']).relevant).toBe(false);
		expect(classifyChangedFiles(['.claude/skills/publish-update/SKILL.md']).relevant).toBe(false);
	});

	it('ADR-Files → NICHT relevant', () => {
		expect(classifyChangedFiles(['docs/adr/ADR-015-hetzner.md']).relevant).toBe(false);
	});

	it('Pures Tooling-File ohne Match → NICHT relevant (keine Allowlist-Match)', () => {
		const r = classifyChangedFiles(['package.json', 'pnpm-lock.yaml']);
		expect(r.relevant).toBe(false);
		expect(r.reason).toBe('keine Allowlist-Match');
	});

	it('Updates-Content → relevant', () => {
		const r = classifyChangedFiles(['_content/updates/2026-05-17-test.md']);
		expect(r.relevant).toBe(true);
	});
});
