import { describe, it, expect } from 'vitest';
import { BERLIN_NARRATIVE_MARKERS, markersInRange } from './narrative-markers.js';

describe('BERLIN_NARRATIVE_MARKERS', () => {
	it('contains the six confirmed anchor points in chronological order', () => {
		const years = BERLIN_NARRATIVE_MARKERS.map((m) => m.year);
		expect(years).toEqual([1763, 1871, 1945, 1961, 1989, 2018]);
	});

	it('every marker has a non-empty label', () => {
		for (const m of BERLIN_NARRATIVE_MARKERS) {
			expect(typeof m.label).toBe('string');
			expect(m.label.length).toBeGreaterThan(0);
		}
	});
});

describe('markersInRange', () => {
	it('filters markers strictly within an inclusive range', () => {
		const out = markersInRange(BERLIN_NARRATIVE_MARKERS, 1900, 1990);
		expect(out.map((m) => m.year)).toEqual([1945, 1961, 1989]);
	});

	it('returns empty if no markers fall in range', () => {
		const out = markersInRange(BERLIN_NARRATIVE_MARKERS, 2050, 2100);
		expect(out).toEqual([]);
	});

	it('returns all markers for the full historical range from 1700', () => {
		const out = markersInRange(BERLIN_NARRATIVE_MARKERS, 1700, 2030);
		expect(out).toHaveLength(BERLIN_NARRATIVE_MARKERS.length);
	});
});
