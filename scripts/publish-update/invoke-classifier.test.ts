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
				title_en: 'New feature',
				summary_en: 'Description of the new feature.',
				body_en: 'Body text.',
				tags: ['feature'],
				body: 'Body-Text.'
			});
		const r = await classifyAndDraftCommit(baseInput, { systemPrompt, subagent });
		expect(r.kind).toBe('draft');
		if (r.kind !== 'draft') throw new Error('unreachable');
		expect(r.category).toBe('feature');
		expect(r.title_en).toBe('New feature');
		expect(r.summary_en).toBe('Description of the new feature.');
		expect(r.body_en).toBe('Body text.');
	});

	it('skip, wenn der Subagent die EN-Fassung weglässt', async () => {
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
		expect(r.kind).toBe('skip');
		if (r.kind !== 'skip') throw new Error('unreachable');
		expect(r.reason).toContain('Schema-Verstoß');
	});

	it('Prompt verlangt title_en, summary_en und body_en im Antwort-JSON', async () => {
		let seen = '';
		const subagent = async (prompt: string) => {
			seen = prompt;
			return JSON.stringify({ kind: 'skip', reason: 'egal' });
		};
		await classifyAndDraftCommit(baseInput, { systemPrompt, subagent });
		expect(seen).toContain('"title_en"');
		expect(seen).toContain('"summary_en"');
		expect(seen).toContain('"body_en"');
	});

	it('passt Subagent-JSON-skip durch', async () => {
		const subagent = async () => JSON.stringify({ kind: 'skip', reason: 'kein Public-Wert' });
		const r = await classifyAndDraftCommit(baseInput, { systemPrompt, subagent });
		expect(r.kind).toBe('skip');
	});

	it('extrahiert JSON aus markdown-fences', async () => {
		const subagent = async () => '```json\n{"kind":"skip","reason":"so weit, so gut"}\n```';
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
			JSON.stringify({
				kind: 'draft',
				category: 'unknown-cat',
				title_de: '',
				summary_de: '',
				tags: [],
				body: ''
			});
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
				title_en: 'X',
				summary_en: 'Y',
				body_en: 'Z',
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

describe('system-prompt.txt (i18n C4d)', () => {
	it('beschreibt die EN-Fassung und die JSON-Felder', async () => {
		const { readFile } = await import('node:fs/promises');
		const { join, dirname } = await import('node:path');
		const { fileURLToPath } = await import('node:url');
		const prompt = await readFile(
			join(dirname(fileURLToPath(import.meta.url)), 'system-prompt.txt'),
			'utf8'
		);
		for (const field of ['title_en', 'summary_en', 'body_en']) {
			expect(prompt, field).toContain(`"${field}"`);
		}
		expect(prompt).toContain('/en');
		expect(prompt).toContain('auch für den englischen Body');
	});
});
