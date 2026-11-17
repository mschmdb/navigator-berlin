import { describe, expect, it } from 'vitest';
import { CLUSTER_CHAPTER, toPageFaq } from './faq-items';
import { CHAPTERS } from './topics';

const item = (templateId: string, cluster: 'laerm' | 'gruen' | 'oepnv' | 'wohnen' | 'klima') => ({
	templateId,
	cluster,
	question: `Frage ${templateId}?`,
	answer: `Antwort ${templateId}.`,
	sortOrder: 0,
	templateText: ''
});

describe('toPageFaq', () => {
	it('keeps only answers without fact-check findings', () => {
		const out = toPageFaq([item('a', 'laerm'), item('b', 'gruen')], (i) =>
			i.templateId === 'b' ? [{ kind: 'zahl', message: 'falsch' }] : []
		);
		expect(out.items.map((i) => i.question)).toEqual(['Frage a?']);
		expect(out.dropped).toEqual([{ templateId: 'b', findings: ['zahl: falsch'] }]);
	});
	it('links each answer to its chapter', () => {
		const out = toPageFaq([item('a', 'oepnv'), item('k', 'klima')], () => []);
		expect(out.items.map((i) => i.chapter)).toEqual(['unterwegs', 'gruen']);
	});
	it('maps every cluster to an existing chapter', () => {
		const ids = new Set<string>(CHAPTERS.map((c) => c.id));
		for (const id of Object.values(CLUSTER_CHAPTER)) expect(ids.has(id)).toBe(true);
	});
});
