import { describe, expect, it } from 'vitest';
import { paddedMaxBounds, type FitBounds } from './map-fit-constraints.js';

describe('paddedMaxBounds', () => {
	it('puffert eine Fit-Bbox um 8% je Achse', () => {
		const fitTo: FitBounds = [
			[13.0, 52.3],
			[13.8, 52.7]
		];
		const result = paddedMaxBounds(fitTo);

		expect(result[0][0]).toBeCloseTo(13.0 - 0.8 * 0.08, 5);
		expect(result[0][1]).toBeCloseTo(52.3 - 0.4 * 0.08, 5);
		expect(result[1][0]).toBeCloseTo(13.8 + 0.8 * 0.08, 5);
		expect(result[1][1]).toBeCloseTo(52.7 + 0.4 * 0.08, 5);
	});

	it('puffert Längen- und Breiten-Achse unabhängig voneinander (unterschiedliche Spannweiten)', () => {
		const fitTo: FitBounds = [
			[13.0, 52.4],
			[13.5, 52.5]
		];
		const result = paddedMaxBounds(fitTo);

		const lngPad = result[1][0] - 13.5;
		const latPad = result[1][1] - 52.5;
		expect(lngPad).toBeGreaterThan(latPad);
	});

	it('faellt bei einer degenerierten Bbox (span 0) auf einen Mindest-Puffer zurueck statt einen Punkt zu liefern', () => {
		const fitTo: FitBounds = [
			[13.4, 52.5],
			[13.4, 52.5]
		];
		const result = paddedMaxBounds(fitTo);

		expect(result[0][0]).toBeLessThan(13.4);
		expect(result[0][1]).toBeLessThan(52.5);
		expect(result[1][0]).toBeGreaterThan(13.4);
		expect(result[1][1]).toBeGreaterThan(52.5);
	});

	it('liefert eine Box, die die urspruengliche Fit-Bbox vollstaendig umschliesst', () => {
		const fitTo: FitBounds = [
			[12.9, 52.25],
			[13.9, 52.75]
		];
		const [[minLng, minLat], [maxLng, maxLat]] = paddedMaxBounds(fitTo);

		expect(minLng).toBeLessThanOrEqual(fitTo[0][0]);
		expect(minLat).toBeLessThanOrEqual(fitTo[0][1]);
		expect(maxLng).toBeGreaterThanOrEqual(fitTo[1][0]);
		expect(maxLat).toBeGreaterThanOrEqual(fitTo[1][1]);
	});

	it('Review Triage Log #2: fällt bei nicht-finiten Werten (leere turf-bbox liefert Infinity) auf einen endlichen Mindest-Puffer zurück statt NaN/Infinity zu liefern', () => {
		const fitTo: FitBounds = [
			[Infinity, Infinity],
			[-Infinity, -Infinity]
		];
		const result = paddedMaxBounds(fitTo);

		for (const [lng, lat] of result) {
			expect(Number.isFinite(lng)).toBe(true);
			expect(Number.isFinite(lat)).toBe(true);
		}
	});

	it('normalisiert vertauschte min/max, statt eine invertierte Box zu liefern', () => {
		// min/max vertauscht: die zweite Koordinate liegt "kleiner" als die erste.
		const fitTo: FitBounds = [
			[13.5, 52.6],
			[13.1, 52.2]
		];
		const [[minLng, minLat], [maxLng, maxLat]] = paddedMaxBounds(fitTo);

		expect(minLng).toBeLessThan(maxLng);
		expect(minLat).toBeLessThan(maxLat);
	});
});
