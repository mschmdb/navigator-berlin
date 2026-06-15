import { describe, it, expect } from 'vitest';
import { parseTemplateFile, loadTemplatesFromRawMap, findTemplatesForScope } from './loader.js';

const VALID_YAML = `
bundle: wahl
locale: de
templates:
  - id: wahl-a
    applicableTo: [kiez]
    requires: [x]
    body_de: "Im Kiez {kiez_name} kam {partei} auf {anteil}."
  - id: wahl-b
    applicableTo: [bezirk]
    requires: [y]
    body_de: "Im Bezirk {bezirk_name} kam {partei} auf {anteil}."
`;

describe('parseTemplateFile', () => {
	it('parsed YAML zu TemplateFile', () => {
		const tf = parseTemplateFile(VALID_YAML);
		expect(tf.bundle).toBe('wahl');
		expect(tf.locale).toBe('de');
		expect(tf.templates).toHaveLength(2);
	});

	it('wirft bei invalidem Schema', () => {
		expect(() =>
			parseTemplateFile(`
bundle: wahl
locale: en
templates: []
`)
		).toThrow();
	});
});

describe('loadTemplatesFromRawMap', () => {
	it('lädt mehrere Bundles', () => {
		const bundles = loadTemplatesFromRawMap({
			'wahl.de.yaml': VALID_YAML
		});
		expect(bundles).toHaveLength(1);
		expect(bundles[0].templates).toHaveLength(2);
	});

	it('reicht File-Pfad bei Error durch', () => {
		expect(() =>
			loadTemplatesFromRawMap({
				'bad.yaml': 'bundle: wahl\nlocale: en\ntemplates: []'
			})
		).toThrow(/bad.yaml/);
	});
});

describe('findTemplatesForScope', () => {
	it('filtert nach scope', () => {
		const bundles = loadTemplatesFromRawMap({ 'wahl.de.yaml': VALID_YAML });
		const kiezTemplates = findTemplatesForScope(bundles, 'kiez');
		expect(kiezTemplates).toHaveLength(1);
		expect(kiezTemplates[0].id).toBe('wahl-a');
	});

	it('liefert beide bei applicableTo:[bezirk,kiez]', () => {
		const yaml = `
bundle: wahl
locale: de
templates:
  - id: wahl-both
    applicableTo: [bezirk, kiez]
    requires: [x]
    body_de: "Im {name} kam {partei} auf {anteil}."
`;
		const bundles = loadTemplatesFromRawMap({ 'x.yaml': yaml });
		expect(findTemplatesForScope(bundles, 'bezirk')).toHaveLength(1);
		expect(findTemplatesForScope(bundles, 'kiez')).toHaveLength(1);
	});
});
