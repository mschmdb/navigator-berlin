import { describe, expect, it } from 'vitest';
import { isResidentialLocation } from './residential-location.js';
import type { LayerHit } from '$lib/data';

function brwHit(nutzung: string | undefined): LayerHit {
	return {
		layer: 'bodenrichtwerte',
		value: nutzung === undefined ? { brw: 500 } : { brw: 500, nutzung },
		source: 'Bodenrichtwerte Berlin',
		updatedAt: '2026-01-01T00:00:00Z',
		license: 'CC BY 4.0'
	};
}

function otherHit(layer: string): LayerHit {
	return {
		layer,
		value: { foo: 'bar' },
		source: 'Test',
		updatedAt: '2026-01-01T00:00:00Z',
		license: 'CC BY 4.0'
	};
}

describe('isResidentialLocation', () => {
	it('returns true for Berlin code "W - Wohngebiet"', () => {
		expect(isResidentialLocation([brwHit('W - Wohngebiet')])).toBe(true);
	});

	it('returns true for Berlin code "M1 - Kerngebiet"', () => {
		expect(isResidentialLocation([brwHit('M1 - Kerngebiet')])).toBe(true);
	});

	it('returns true for Berlin code "M2 - Mischgebiet"', () => {
		expect(isResidentialLocation([brwHit('M2 - Mischgebiet')])).toBe(true);
	});

	it('returns true for BauNVO codes WA/WR/WS', () => {
		expect(isResidentialLocation([brwHit('WA - Allgemeines Wohngebiet')])).toBe(true);
		expect(isResidentialLocation([brwHit('WR - Reines Wohngebiet')])).toBe(true);
		expect(isResidentialLocation([brwHit('WS - Kleinsiedlungsgebiet')])).toBe(true);
	});

	it('returns true for BauNVO codes MD/MI/MK', () => {
		expect(isResidentialLocation([brwHit('MD - Dorfgebiet')])).toBe(true);
		expect(isResidentialLocation([brwHit('MI - Mischgebiet')])).toBe(true);
		expect(isResidentialLocation([brwHit('MK - Kerngebiet')])).toBe(true);
	});

	it('returns false for Kleingarten SF-KGA', () => {
		expect(isResidentialLocation([brwHit('SF-KGA - Sonstige Flächen - Kleingartenfläche')])).toBe(
			false
		);
	});

	it('returns false for Gewerbe G', () => {
		expect(isResidentialLocation([brwHit('G - Gewerbe')])).toBe(false);
	});

	it('returns false for Forst LF-F', () => {
		expect(isResidentialLocation([brwHit('LF-F - Flächen der Land-o. Forstwirtschaft')])).toBe(
			false
		);
	});

	it('returns false when bodenrichtwerte hit absent', () => {
		expect(isResidentialLocation([otherHit('milieuschutz')])).toBe(false);
	});

	it('returns false when no hits at all', () => {
		expect(isResidentialLocation([])).toBe(false);
	});

	it('returns false when bodenrichtwerte value has no nutzung prop', () => {
		expect(isResidentialLocation([brwHit(undefined)])).toBe(false);
	});

	it('handles bare code without " - description" suffix', () => {
		expect(isResidentialLocation([brwHit('W')])).toBe(true);
		expect(isResidentialLocation([brwHit('WA')])).toBe(true);
	});

	it('returns false for unknown nutzung prefix', () => {
		expect(isResidentialLocation([brwHit('XYZ - Unbekannt')])).toBe(false);
	});

	it('is case-sensitive on the code prefix (codes are uppercase by convention)', () => {
		expect(isResidentialLocation([brwHit('w - wohngebiet')])).toBe(false);
	});

	it('finds residential hit alongside non-residential hits', () => {
		expect(isResidentialLocation([otherHit('milieuschutz'), brwHit('W - Wohngebiet')])).toBe(true);
	});
});
