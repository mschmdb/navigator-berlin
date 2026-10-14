import { describe, expect, it } from 'vitest';
import { gridIdToCenter } from './grid-id.js';

describe('gridIdToCenter', () => {
	it('liefert den Zellmittelpunkt (SW-Ecke + 50 m)', () => {
		expect(gridIdToCenter('CRS3035RES100mN3270000E4549800')).toEqual({ x: 4549850, y: 3270050 });
	});

	it('bricht bei ungueltiger ID ab und nennt sie', () => {
		expect(() => gridIdToCenter('CRS3035RES1000mN3270000E4549800')).toThrow(/CRS3035RES1000m/);
		expect(() => gridIdToCenter('quatsch')).toThrow(/quatsch/);
		expect(() => gridIdToCenter('')).toThrow(/Gitter-ID/);
	});
});
