import { describe, expect, it } from 'vitest';
import {
	buildHoverTooltipContent,
	pickTopmostHover,
	slugFromLayerId
} from './hover-tooltip-logic.js';

describe('buildHoverTooltipContent', () => {
	it('liefert layerName + valueText + shortExplain für laerm-2023', () => {
		const c = buildHoverTooltipContent('laerm-2023', {
			kategorie: 'hoch',
			plr_name: 'Kreuzberg-Nord'
		});
		expect(c.slug).toBe('laerm-2023');
		expect(c.layerName).toMatch(/Lärm/);
		expect(c.valueText).toMatch(/hoch/);
		expect(c.shortExplain).toMatch(/Lärmbelastung/);
		expect(c.hint).toMatch(/Klick/);
	});

	it('fallback für unbekannten Slug', () => {
		const c = buildHoverTooltipContent('unknown-xyz', 'foo');
		expect(c.layerName).toBe('unknown-xyz');
		expect(c.shortExplain).toBe('');
	});

	it('valueText nutzt formatLayerValue für klima-pet-2022', () => {
		const c = buildHoverTooltipContent('klima-pet-2022', { pet14h: 38.5 });
		expect(c.valueText).toMatch(/38,5 °C|38.5 °C/);
	});
});

describe('pickTopmostHover', () => {
	it('null bei leerem Array', () => {
		expect(pickTopmostHover([])).toBeNull();
	});

	it('liefert ersten Eintrag (queryRenderedFeatures liefert top-first)', () => {
		const features = [
			{ layer: { id: 'navigator-layer-laerm-2023' }, properties: { kategorie: 'hoch' } },
			{ layer: { id: 'navigator-layer-bezirke' }, properties: { Gemeinde_name: 'Mitte' } }
		];
		expect(pickTopmostHover(features)?.layer.id).toBe('navigator-layer-laerm-2023');
	});
});

describe('slugFromLayerId', () => {
	it('extrahiert Slug aus prefix', () => {
		expect(slugFromLayerId('navigator-layer-laerm-2023')).toBe('laerm-2023');
	});

	it('null für unbekannten prefix', () => {
		expect(slugFromLayerId('maplibre-attribution')).toBeNull();
	});
});
