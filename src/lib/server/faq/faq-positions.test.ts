import { describe, it, expect } from 'vitest';
import { computeFaqPositions, faqPositionKey } from './faq-positions.js';
import type { LoadedTemplate } from './load-templates.js';
import { parseFaqTemplateFile, type ClusterKey, type TemplateLocale } from './template-schema.js';

function file(cluster: ClusterKey, locale: TemplateLocale, ids: string[]): LoadedTemplate {
	return {
		cluster,
		locale,
		file: parseFaqTemplateFile({
			cluster,
			locale,
			templates: ids.map((id) => ({
				id,
				applicableTo: ['kiez'],
				requires: [],
				question: 'Frage?',
				answer: 'Antwort.'
			}))
		})
	};
}

const pos = (m: ReadonlyMap<string, number>, c: ClusterKey, id: string) =>
	m.get(faqPositionKey(c, id));

describe('computeFaqPositions', () => {
	it('ordnet Cluster in CLUSTER_KEYS-Folge, unabhängig von der Ladefolge', () => {
		const m = computeFaqPositions([file('klima', 'de', ['t-k1']), file('laerm', 'de', ['t-l1'])]);
		expect(pos(m, 'laerm', 't-l1')!).toBeLessThan(pos(m, 'klima', 't-k1')!);
	});

	it('folgt innerhalb eines Clusters der YAML-Position, nicht dem Alphabet', () => {
		const m = computeFaqPositions([file('laerm', 'de', ['z-first', 'a-second', 'm-third'])]);
		expect(pos(m, 'laerm', 'z-first')!).toBeLessThan(pos(m, 'laerm', 'a-second')!);
		expect(pos(m, 'laerm', 'a-second')!).toBeLessThan(pos(m, 'laerm', 'm-third')!);
	});

	it('gibt der DE-Reihenfolge Vorrang vor abweichender EN-Reihenfolge', () => {
		const m = computeFaqPositions([
			file('laerm', 'de', ['t-b', 't-a']),
			file('laerm', 'en', ['t-a', 't-b'])
		]);
		expect(pos(m, 'laerm', 't-b')!).toBeLessThan(pos(m, 'laerm', 't-a')!);
	});

	it('nimmt Templates, die nur in EN stehen, nach den DE-Templates auf', () => {
		const m = computeFaqPositions([
			file('laerm', 'de', ['t-a']),
			file('laerm', 'en', ['t-a', 't-x'])
		]);
		expect(pos(m, 'laerm', 't-x')!).toBeGreaterThan(pos(m, 'laerm', 't-a')!);
	});

	it('vergibt Positionen über Cluster hinweg streng aufsteigend', () => {
		const m = computeFaqPositions([
			file('laerm', 'de', ['t-l1', 't-l2']),
			file('gruen', 'de', ['t-g1'])
		]);
		expect(pos(m, 'laerm', 't-l2')!).toBeLessThan(pos(m, 'gruen', 't-g1')!);
	});

	it('liefert leere Map ohne Templates', () => {
		expect(computeFaqPositions([]).size).toBe(0);
	});
});
