import { describe, it, expect } from 'vitest';
import { parseTemplateYaml, loadAllFaqTemplates } from './load-templates.js';

const VALID_YAML = `
cluster: laerm
locale: de
templates:
  - id: laerm-dominant-bezirk
    applicableTo: [bezirk]
    requires: [laerm.dominantCategory]
    question: "Wie laut ist {name}?"
    answer: "Im Bezirk {name} dominiert die Lärm-Klasse {laermKategorie}."
`;

describe('parseTemplateYaml', () => {
	it('parsed gültiges YAML zu FaqTemplateFile', () => {
		const file = parseTemplateYaml(VALID_YAML);
		expect(file.cluster).toBe('laerm');
		expect(file.locale).toBe('de');
		expect(file.templates).toHaveLength(1);
		expect(file.templates[0]?.applicableTo).toEqual(['bezirk']);
	});

	it('wirft bei Schema-Verstoß (fehlende cluster-Property)', () => {
		const broken = `
locale: de
templates: []
`;
		expect(() => parseTemplateYaml(broken)).toThrow();
	});

	it('wirft bei ungültiger YAML-Syntax', () => {
		expect(() => parseTemplateYaml(': : :')).toThrow();
	});
});

describe('loadAllFaqTemplates (Integration)', () => {
	it('lädt mindestens den Lärm-Cluster aus dem Repo', async () => {
		const loaded = await loadAllFaqTemplates();
		const laerm = loaded.find((t) => t.cluster === 'laerm' && t.locale === 'de');
		expect(laerm).toBeDefined();
		expect(laerm?.file.templates.length).toBeGreaterThanOrEqual(6);
	});

	it('alle Phase-1-Cluster (5) haben mindestens eine DE-Datei', async () => {
		const loaded = await loadAllFaqTemplates();
		const deClusters = new Set(loaded.filter((t) => t.locale === 'de').map((t) => t.cluster));
		expect(deClusters).toContain('laerm');
		expect(deClusters).toContain('gruen');
		expect(deClusters).toContain('oepnv');
		expect(deClusters).toContain('wohnen');
		expect(deClusters).toContain('klima');
	});
});
