import { describe, expect, it } from 'vitest';
import { getLayerStrategy, isPrecomputed, LAYER_STRATEGY } from './strategy.js';

describe('layer-aggregate strategy', () => {
	it('PLR-Layer sind ordinal-distribution mit memberMode plr', () => {
		expect(LAYER_STRATEGY['laerm-2023']).toMatchObject({
			type: 'ordinal-distribution',
			memberMode: 'plr',
			valueKey: 'kategorie'
		});
		expect(LAYER_STRATEGY['wohnlagen-2024']).toMatchObject({
			valueKey: 'wol_mode',
			neutral: true
		});
	});

	it('klima-pet ist numeric-median spatial', () => {
		expect(LAYER_STRATEGY['klima-pet-2022']).toMatchObject({
			type: 'numeric-median',
			memberMode: 'spatial',
			valueKey: 'pet14h'
		});
	});

	it('coverage + area Layer spatial', () => {
		expect(LAYER_STRATEGY['denkmal-2024'].type).toBe('coverage-share');
		expect(LAYER_STRATEGY['gruenanlagen'].type).toBe('area-share');
	});

	it('bodenrichtwerte not-aggregatable', () => {
		expect(LAYER_STRATEGY['bodenrichtwerte'].type).toBe('not-aggregatable');
		expect(isPrecomputed(LAYER_STRATEGY['bodenrichtwerte'])).toBe(false);
	});

	it('Stigma-Layer haben neutral-Flag', () => {
		expect(LAYER_STRATEGY['mss-gesamtindex-2025'].neutral).toBe(true);
		expect(LAYER_STRATEGY['umweltgerechtigkeit-2023'].neutral).toBe(true);
	});

	it('unbekannter Point-Layer → point-density, nicht vorberechnet', () => {
		const s = getLayerStrategy('kitas-2024', 'Point');
		expect(s.type).toBe('point-density');
		expect(isPrecomputed(s)).toBe(false);
	});

	it('unbekannter LineString → not-aggregatable', () => {
		expect(getLayerStrategy('ubahn-netz', 'LineString').type).toBe('not-aggregatable');
	});

	it('expliziter Eintrag schlägt Geometrie-Default', () => {
		expect(getLayerStrategy('laerm-2023', 'Polygon').type).toBe('ordinal-distribution');
	});
});
