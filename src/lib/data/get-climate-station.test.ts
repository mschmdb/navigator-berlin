import { describe, expect, it } from 'vitest';
import { getNearestClimateStation, CLIMATE_STATIONS } from './get-climate-station.js';

describe('CLIMATE_STATIONS', () => {
	it('enthaelt 4 Berliner Stationen', () => {
		expect(CLIMATE_STATIONS).toHaveLength(4);
		expect(CLIMATE_STATIONS.map((s) => s.id).sort()).toEqual(['00400', '00403', '00427', '00433']);
	});
});

describe('getNearestClimateStation', () => {
	it('Steglitz-Punkt liefert Dahlem (00403)', () => {
		const s = getNearestClimateStation(52.456, 13.331);
		expect(s.id).toBe('00403');
	});

	it('Neukoelln-Punkt liefert Tempelhof (00433)', () => {
		const s = getNearestClimateStation(52.481, 13.435);
		expect(s.id).toBe('00433');
	});

	it('Buch-Punkt liefert Buch (00400)', () => {
		const s = getNearestClimateStation(52.631, 13.502);
		expect(s.id).toBe('00400');
	});

	it('Schoenefeld-Punkt liefert Brandenburg (00427)', () => {
		const s = getNearestClimateStation(52.38, 13.52);
		expect(s.id).toBe('00427');
	});
});
