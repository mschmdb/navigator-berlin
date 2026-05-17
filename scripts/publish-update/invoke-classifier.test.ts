import { describe, expect, it } from 'vitest';
import { classifyAndDraftCommit } from './invoke-classifier.js';

const systemPrompt = 'mock-system-prompt';

const baseInput = {
	sha: 'abc1234',
	commitMessage: 'feat: add foo',
	diff: 'diff --git a/src/routes/+page.svelte b/src/routes/+page.svelte\n+ foo',
	publicPaths: ['src/routes/+page.svelte']
};

describe('classifyAndDraftCommit', () => {
	it('passt Subagent-JSON-draft durch DraftResultSchema', async () => {
		const subagent = async () =>
			JSON.stringify({
				kind: 'draft',
				category: 'feature',
				title_de: 'Neue Funktion',
				summary_de: 'Beschreibung der neuen Funktion.',
				tags: ['feature'],
				body: 'Body-Text.'
			});
		const r = await classifyAndDraftCommit(baseInput, { systemPrompt, subagent });
		expect(r.kind).toBe('draft');
		if (r.kind !== 'draft') throw new Error('unreachable');
		expect(r.category).toBe('feature');
	});

	it('passt Subagent-JSON-skip durch', async () => {
		const subagent = async () => JSON.stringify({ kind: 'skip', reason: 'kein Public-Wert' });
		const r = await classifyAndDraftCommit(baseInput, { systemPrompt, subagent });
		expect(r.kind).toBe('skip');
	});

	it('extrahiert JSON aus markdown-fences', async () => {
		const subagent = async () =>
			'```json\n{"kind":"skip","reason":"so weit, so gut"}\n```';
		const r = await classifyAndDraftCommit(baseInput, { systemPrompt, subagent });
		expect(r.kind).toBe('skip');
	});

	it('skip bei JSON-parse-fail mit Begründung', async () => {
		const subagent = async () => 'definitiv kein json';
		const r = await classifyAndDraftCommit(baseInput, { systemPrompt, subagent });
		expect(r.kind).toBe('skip');
		if (r.kind !== 'skip') throw new Error('unreachable');
		expect(r.reason).toContain('kein gültiges JSON');
	});

	it('skip bei Schema-Verstoß mit Begründung', async () => {
		const subagent = async () =>
			JSON.stringify({ kind: 'draft', category: 'unknown-cat', title_de: '', summary_de: '', tags: [], body: '' });
		const r = await classifyAndDraftCommit(baseInput, { systemPrompt, subagent });
		expect(r.kind).toBe('skip');
		if (r.kind !== 'skip') throw new Error('unreachable');
		expect(r.reason).toContain('Schema-Verstoß');
	});

	it('__truncated-Marker bei großem Diff', async () => {
		const bigDiff =
			'diff --git a/src/routes/+page.svelte b/src/routes/+page.svelte\n' +
			Array.from({ length: 3500 }, (_, i) => `+ line ${i}`).join('\n');
		const subagent = async () =>
			JSON.stringify({
				kind: 'draft',
				category: 'feature',
				title_de: 'X',
				summary_de: 'Y',
				tags: [],
				body: 'Z'
			});
		const r = await classifyAndDraftCommit(
			{ ...baseInput, diff: bigDiff },
			{ systemPrompt, subagent }
		);
		expect((r as { __truncated?: boolean }).__truncated).toBe(true);
	});
});
