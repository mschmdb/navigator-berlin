import { describe, it, expect } from 'vitest';
import {
	parseFaqTemplateFile,
	type FaqTemplateFile,
	CLUSTER_KEYS
} from './template-schema.js';

/**
 * Story 2.5b AC-1 + AC-8: Schema-Validation pro YAML-Template-Datei.
 *
 * TDD-First (ADR-012): jeder AC hat mind. 1 Failing-Test vor Implementation.
 */

const validInput: FaqTemplateFile = {
	cluster: 'laerm',
	locale: 'de',
	templates: [
		{
			id: 'laerm-dominant-bezirk',
			applicableTo: ['bezirk'],
			requires: ['laerm.dominantCategory'],
			question: 'Wie laut ist {name}?',
			answer: 'Im Bezirk {name} ist die Lärmlage {laermDominant}.'
		}
	]
};

describe('parseFaqTemplateFile (Valibot)', () => {
	it('akzeptiert valides Template-File', () => {
		const out = parseFaqTemplateFile(validInput);
		expect(out.cluster).toBe('laerm');
		expect(out.locale).toBe('de');
		expect(out.templates).toHaveLength(1);
		expect(out.templates[0]?.id).toBe('laerm-dominant-bezirk');
	});

	it('verwirft unbekannten Cluster-Key', () => {
		expect(() =>
			parseFaqTemplateFile({ ...validInput, cluster: 'verkehr-unknown' as unknown })
		).toThrow();
	});

	it('verwirft unbekannte Locale', () => {
		expect(() =>
			parseFaqTemplateFile({ ...validInput, locale: 'fr' as unknown })
		).toThrow();
	});

	it('verwirft Template ohne id', () => {
		expect(() =>
			parseFaqTemplateFile({
				...validInput,
				templates: [
					{
						applicableTo: ['bezirk'],
						requires: [],
						question: 'Frage?',
						answer: 'Antwort.'
					} as unknown
				]
			})
		).toThrow();
	});

	it('verwirft applicableTo mit unbekanntem Page-Type', () => {
		expect(() =>
			parseFaqTemplateFile({
				...validInput,
				templates: [
					{
						id: 'with-bad-type',
						applicableTo: ['plz' as unknown],
						requires: [],
						question: 'Frage?',
						answer: 'Antwort.'
					}
				]
			})
		).toThrow();
	});

	it('akzeptiert mehrere Page-Types in applicableTo', () => {
		const out = parseFaqTemplateFile({
			...validInput,
			templates: [
				{
					id: 'shared',
					applicableTo: ['bezirk', 'kiez', 'layer'],
					requires: [],
					question: 'Beispiel-Frage?',
					answer: 'Beispiel-Antwort.'
				}
			]
		});
		expect(out.templates[0]?.applicableTo).toEqual(['bezirk', 'kiez', 'layer']);
	});

	it('CLUSTER_KEYS enthält alle 5 Phase-1-Cluster', () => {
		expect(CLUSTER_KEYS).toContain('laerm');
		expect(CLUSTER_KEYS).toContain('gruen');
		expect(CLUSTER_KEYS).toContain('oepnv');
		expect(CLUSTER_KEYS).toContain('wohnen');
		expect(CLUSTER_KEYS).toContain('klima');
	});

	it('akzeptiert optionale editorialNote', () => {
		const out = parseFaqTemplateFile({
			...validInput,
			templates: [
				{
					id: 'with-note',
					applicableTo: ['kiez'],
					requires: [],
					question: 'Frage?',
					answer: 'Antwort-Text.',
					editorialNote: 'Hinweis: Werte beziehen sich auf den ganzen Kiez.'
				}
			]
		});
		expect(out.templates[0]?.editorialNote).toBe(
			'Hinweis: Werte beziehen sich auf den ganzen Kiez.'
		);
	});
});
