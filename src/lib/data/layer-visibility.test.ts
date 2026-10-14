import { describe, expect, it } from 'vitest';
import { hasLayerDetailPage } from './layer-visibility.js';

describe('hasLayerDetailPage', () => {
	it('liefert true bei mapRelevant true', () => {
		expect(hasLayerDetailPage({ mapRelevant: true })).toBe(true);
	});

	it('liefert false bei Build-only-Layer', () => {
		expect(hasLayerDetailPage({ inspectorRelevant: false, mapRelevant: false })).toBe(false);
	});

	it('liefert true wenn nur inspectorRelevant false ist', () => {
		expect(hasLayerDetailPage({ inspectorRelevant: false })).toBe(true);
		expect(hasLayerDetailPage({ inspectorRelevant: false, mapRelevant: true })).toBe(true);
	});

	it('liefert true wenn nur mapRelevant false ist', () => {
		expect(hasLayerDetailPage({ mapRelevant: false })).toBe(true);
	});
});
