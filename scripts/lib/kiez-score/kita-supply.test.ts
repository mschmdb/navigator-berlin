import { describe, expect, it } from 'vitest';
import type { Feature } from 'geojson';
import { parseEPlatz, plaetzeProKind, aggregateKitaPlaetzeByLor } from './kita-supply.js';

describe('parseEPlatz', () => {
	it('parst numerische Strings', () => {
		expect(parseEPlatz('20')).toBe(20);
		expect(parseEPlatz('310')).toBe(310);
	});
	it('leer / nicht-numerisch / null → 0', () => {
		expect(parseEPlatz('')).toBe(0);
		expect(parseEPlatz('abc')).toBe(0);
		expect(parseEPlatz(null)).toBe(0);
		expect(parseEPlatz(undefined)).toBe(0);
	});
	it('negative → 0', () => {
		expect(parseEPlatz('-5')).toBe(0);
	});
	it('akzeptiert auch number-Typ', () => {
		expect(parseEPlatz(42)).toBe(42);
	});
});

describe('plaetzeProKind', () => {
	it('Quotient Plätze / Kinder', () => {
		expect(plaetzeProKind(100, 300)).toBeCloseTo(0.333, 3);
	});
	it('kinder null → null (kein Nenner)', () => {
		expect(plaetzeProKind(100, null)).toBeNull();
	});
	it('kinder 0 → null (Division-by-Zero-Safe)', () => {
		expect(plaetzeProKind(100, 0)).toBeNull();
	});
	it('keine Plätze → 0', () => {
		expect(plaetzeProKind(0, 300)).toBe(0);
	});
});

function lor(id: string, ring: [number, number][]): Feature {
	return {
		type: 'Feature',
		geometry: { type: 'Polygon', coordinates: [ring] },
		properties: { PLR_ID: id }
	};
}
function kita(lng: number, lat: number, ePlatz: string): Feature {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [lng, lat] },
		properties: { e_platz: ePlatz }
	};
}

describe('aggregateKitaPlaetzeByLor', () => {
	const square: [number, number][] = [
		[0, 0],
		[0, 10],
		[10, 10],
		[10, 0],
		[0, 0]
	];
	const far: [number, number][] = [
		[100, 100],
		[100, 110],
		[110, 110],
		[110, 100],
		[100, 100]
	];

	it('summiert e_platz der Kitas im LOR-Polygon', () => {
		const out = aggregateKitaPlaetzeByLor(
			[lor('A', square), lor('B', far)],
			[kita(5, 5, '20'), kita(6, 6, '30'), kita(105, 105, '99')],
			(f) => String(f.properties?.PLR_ID)
		);
		expect(out.A).toBe(50);
		expect(out.B).toBe(99);
	});

	it('LOR ohne Kita → 0', () => {
		const out = aggregateKitaPlaetzeByLor([lor('A', square)], [kita(105, 105, '40')], (f) =>
			String(f.properties?.PLR_ID)
		);
		expect(out.A).toBe(0);
	});

	it('nicht-parsebares e_platz zählt 0', () => {
		const out = aggregateKitaPlaetzeByLor(
			[lor('A', square)],
			[kita(5, 5, ''), kita(6, 6, '10')],
			(f) => String(f.properties?.PLR_ID)
		);
		expect(out.A).toBe(10);
	});
});
