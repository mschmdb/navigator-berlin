import { describe, expect, it } from 'vitest';
import {
	barPercent,
	cumulativeSegments,
	proximityFraction,
	ringDashArray
} from './chart-scale.js';

describe('barPercent', () => {
	it('mappt value linear auf 0-100', () => {
		expect(barPercent(50, 0, 100)).toBe(50);
		expect(barPercent(0, 0, 100)).toBe(0);
		expect(barPercent(100, 0, 100)).toBe(100);
		expect(barPercent(30, 20, 70)).toBe(20);
	});

	it('clamped außerhalb min/max', () => {
		expect(barPercent(-10, 0, 100)).toBe(0);
		expect(barPercent(150, 0, 100)).toBe(100);
	});

	it('liefert 0 bei degeneriertem Bereich (min===max)', () => {
		expect(barPercent(50, 50, 50)).toBe(0);
	});
});

describe('cumulativeSegments', () => {
	it('normalisiert Shares auf 100% und liefert offset+width', () => {
		const segs = cumulativeSegments([{ share: 1 }, { share: 1 }, { share: 2 }]);
		expect(segs).toHaveLength(3);
		expect(segs[0]).toMatchObject({ offsetPct: 0, widthPct: 25 });
		expect(segs[1]).toMatchObject({ offsetPct: 25, widthPct: 25 });
		expect(segs[2]).toMatchObject({ offsetPct: 50, widthPct: 50 });
	});

	it('leere Liste → leeres Array', () => {
		expect(cumulativeSegments([])).toEqual([]);
	});

	it('Summe 0 → alle widthPct 0, kein NaN', () => {
		const segs = cumulativeSegments([{ share: 0 }, { share: 0 }]);
		expect(segs.every((s) => s.widthPct === 0)).toBe(true);
	});
});

describe('proximityFraction', () => {
	it('nah = voll (Fraction nahe 1), fern = leer', () => {
		expect(proximityFraction(0, 1000)).toBe(1);
		expect(proximityFraction(1000, 1000)).toBe(0);
		expect(proximityFraction(250, 1000)).toBe(0.75);
	});

	it('clamped jenseits max auf 0', () => {
		expect(proximityFraction(5000, 1000)).toBe(0);
	});

	it('maxMeters<=0 → 0 (kein Division-Crash)', () => {
		expect(proximityFraction(100, 0)).toBe(0);
	});
});

describe('ringDashArray', () => {
	it('liefert gefüllten Anteil + Rest des Umfangs', () => {
		expect(ringDashArray(0.5, 100)).toBe('50 100');
		expect(ringDashArray(1, 100)).toBe('100 100');
		expect(ringDashArray(0, 100)).toBe('0 100');
	});

	it('clamped Fraction auf 0-1', () => {
		expect(ringDashArray(1.5, 100)).toBe('100 100');
		expect(ringDashArray(-0.5, 100)).toBe('0 100');
	});
});
