import { describe, expect, it } from 'vitest';
import { diffLayerSlugs, layerIdFor, outlineLayerIdFor, sourceIdFor } from './layer-diff.js';

describe('diffLayerSlugs', () => {
	it('alle hinzufügen wenn current leer', () => {
		expect(diffLayerSlugs([], ['a', 'b'])).toEqual({ toAdd: ['a', 'b'], toRemove: [] });
	});

	it('alle entfernen wenn next leer', () => {
		expect(diffLayerSlugs(['a', 'b'], [])).toEqual({ toAdd: [], toRemove: ['a', 'b'] });
	});

	it('Add+Remove gemischt', () => {
		expect(diffLayerSlugs(['a', 'b'], ['b', 'c'])).toEqual({
			toAdd: ['c'],
			toRemove: ['a']
		});
	});

	it('keine Änderung wenn beides gleich', () => {
		expect(diffLayerSlugs(['a', 'b'], ['a', 'b'])).toEqual({ toAdd: [], toRemove: [] });
	});

	it('toAdd respektiert next-Reihenfolge', () => {
		const { toAdd } = diffLayerSlugs([], ['c', 'a', 'b']);
		expect(toAdd).toEqual(['c', 'a', 'b']);
	});
});

describe('sourceIdFor / layerIdFor', () => {
	it('konsistente ID-Schemata', () => {
		expect(sourceIdFor('bezirke')).toBe('navigator-source-bezirke');
		expect(layerIdFor('bezirke')).toBe('navigator-layer-bezirke');
	});

	it('handhabt Slug mit Bindestrichen', () => {
		expect(sourceIdFor('mietspiegel-wohnlage')).toBe('navigator-source-mietspiegel-wohnlage');
	});
});

describe('outlineLayerIdFor', () => {
	it('hängt -outline an die Haupt-Layer-ID', () => {
		expect(outlineLayerIdFor('kiez-score-ruhe-luft')).toBe(
			'navigator-layer-kiez-score-ruhe-luft-outline'
		);
	});
});
