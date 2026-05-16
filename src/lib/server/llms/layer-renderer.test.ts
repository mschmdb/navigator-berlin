import { describe, it, expect } from 'vitest';
import { renderLayerMarkdown, type LayerRenderInput } from './layer-renderer.js';

const baseInput: LayerRenderInput = {
	slug: 'laerm-2023',
	name: 'Lärmbelastung 2023',
	short: 'Tages-Lärmpegel pro Planungsraum (Umweltatlas)',
	long: 'Kategorisierte Lärm-Gesamtbelastung pro LOR-Planungsraum. Quelle: Berliner Umweltatlas 2023.',
	unit: 'kategorial (niedrig, mittel, hoch, sehr hoch)',
	valueScaleExplain: 'niedrig (gut) bis sehr hoch (problematisch)',
	license: 'dl-de/zero-2-0',
	sourceUpdatedAt: '2023-09-15',
	bundleGroup: 'C: Umwelt',
	featureCount: 542
};

describe('renderLayerMarkdown', () => {
	it('starts with H2 "## Layer {Name}"', () => {
		const md = renderLayerMarkdown(baseInput);
		expect(md.split('\n')[0]).toBe('## Layer Lärmbelastung 2023');
	});

	it('includes Slug, License, Stand attribution', () => {
		const md = renderLayerMarkdown(baseInput);
		expect(md).toContain('laerm-2023');
		expect(md).toContain('dl-de/zero-2-0');
		expect(md).toContain('2023-09-15');
	});

	it('includes Long-Description as methodology paragraph', () => {
		const md = renderLayerMarkdown(baseInput);
		expect(md).toContain('Kategorisierte Lärm-Gesamtbelastung');
	});

	it('includes value-scale explanation when available', () => {
		const md = renderLayerMarkdown(baseInput);
		expect(md).toContain('niedrig (gut) bis sehr hoch');
	});

	it('omits value-scale section when not provided', () => {
		const md = renderLayerMarkdown({ ...baseInput, valueScaleExplain: undefined });
		expect(md).not.toContain('Werte-Skala:');
	});

	it('never contains banned word "lebenswert"', () => {
		const md = renderLayerMarkdown(baseInput);
		expect(md.toLowerCase()).not.toContain('lebenswert');
	});

	it('never contains em-dashes (U+2014)', () => {
		const md = renderLayerMarkdown(baseInput);
		expect(md).not.toContain('—');
	});

	it('is deterministic for same input', () => {
		expect(renderLayerMarkdown(baseInput)).toBe(renderLayerMarkdown(baseInput));
	});

	it('replaces banned words in long-description via stigma-lint', () => {
		const tainted: LayerRenderInput = {
			...baseInput,
			long: 'Sehr lebenswerte Gegend laut Layer-Beschreibung.'
		};
		const md = renderLayerMarkdown(tainted);
		expect(md.toLowerCase()).not.toContain('lebenswert');
		expect(md).toContain('[REDAKTIONSFEHLER]');
	});
});
