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

	// i18n Block B4a: delegiert an getLayerDisplayName (layer-palette-filter.ts),
	// das schon vor B4a locale-fähig war.
	describe('opts.locale (EN)', () => {
		it('liefert die EN-Message wenn opts.locale gesetzt ist', () => {
			expect(sourceLabel('laerm-2023', { locale: 'en' })).toBe('Noise pollution 2023');
			expect(sourceLabel('oepnv-composite', { locale: 'en' })).toBe(
				'Public transport stops (BVG + S-Bahn)'
			);
		});
		it('ohne opts bleibt DE (Boundary: geteilte Helfer ohne opts.locale)', () => {
			expect(sourceLabel('laerm-2023')).toBe('Lärmbelastung 2023');
		});
	});
});
