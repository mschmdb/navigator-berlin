import { describe, it, expect } from 'vitest';
import { sourceLabel } from './source-label.js';

describe('sourceLabel (Story 11.3/11.4-Fix)', () => {
	it('mappt bekannte Layer-Slugs auf lesbare Namen', () => {
		expect(sourceLabel('klima-pet-2022')).toBe('Gefühlte Temperatur 2022');
		expect(sourceLabel('laerm-2023')).toBe('Lärmbelastung 2023');
	});
	it('mappt synthetische Quellen (oepnv-composite)', () => {
		expect(sourceLabel('oepnv-composite')).toBe('ÖPNV-Haltestellen (BVG + S-Bahn)');
	});
	it('prettify-Fallback für unbekannte Slugs (kein roher Bindestrich-Slug)', () => {
		expect(sourceLabel('foo-bar-2099')).toBe('Foo Bar 2099');
	});
});
