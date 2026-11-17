import { describe, expect, it } from 'vitest';
import { packRegions, unpackRegions, packWahl, unpackWahl } from './pack';
import { LABELS, METRICS } from './topics';
import { DIMS, type RegionSnapshot } from './types';
import type { WahlBundle } from './wahl-types';

const region = (slug: string, parent: string | null, v: number): RegionSnapshot => ({
	slug,
	name: slug.toUpperCase(),
	parentSlug: parent,
	parentName: parent ? `Bezirk ${parent}` : null,
	dims: Object.fromEntries(
		DIMS.map((d, i) => [d, i === 2 ? null : v + i])
	) as RegionSnapshot['dims'],
	metrics: Object.fromEntries(
		METRICS.map((m, i) => [m, i === 0 ? null : v * i])
	) as RegionSnapshot['metrics'],
	labels: Object.fromEntries(
		LABELS.map((l, i) => [l, i === 1 ? null : `stufe ${i}`])
	) as RegionSnapshot['labels']
});

describe('packRegions', () => {
	const regions = [region('a', 'x', 1), region('b', 'x', 2), region('c', null, 3)];
	it('round-trips every field, including nulls', () => {
		expect(unpackRegions(packRegions(regions))).toEqual(regions);
	});
	it('stores names and repeated texts once', () => {
		const json = JSON.stringify(packRegions(regions));
		expect(json.match(/Bezirk x/g)).toHaveLength(1);
		expect(json.match(/stufe 0/g)).toHaveLength(1);
	});
	it('stores metric values as whole numbers with the smallest exact scale', () => {
		const r = region('a', null, 1);
		const packed = packRegions([
			{ ...r, metrics: { ...r.metrics, pet: 33.874, laermDb: 47.7 } },
			{ ...r, slug: 'b', metrics: { ...r.metrics, pet: 30, laermDb: 46 } }
		]);
		expect(packed.metrics[METRICS.indexOf('pet')]).toEqual([33874, 30000]);
		expect(packed.metrics[METRICS.indexOf('laermDb')]).toEqual([477, 460]);
		expect(unpackRegions(packed)[0].metrics.pet).toBe(33.874);
		expect(unpackRegions(packed)[1].metrics.laermDb).toBe(46);
	});
	it('is much smaller than the plain list', () => {
		const many = Array.from({ length: 143 }, (_, i) => region(`kiez-${i}`, `b${i % 12}`, i));
		expect(JSON.stringify(packRegions(many)).length).toBeLessThan(
			JSON.stringify(many).length * 0.5
		);
	});
});

describe('packWahl', () => {
	const bundle: WahlBundle = {
		btw: [
			{ jahr: 2021, partei: 'SPD', farbe: '#E3000F', anteil: 20.5 },
			{ jahr: 2025, partei: 'SPD', farbe: '#E3000F', anteil: 15.25 }
		],
		agh: [],
		bvv: [{ jahr: 2021, partei: 'CDU', farbe: '#000000', anteil: 30 }]
	};
	it('round-trips and keeps each party colour once', () => {
		const packed = packWahl(bundle);
		expect(unpackWahl(packed)).toEqual(bundle);
		expect(JSON.stringify(packed).match(/E3000F/g)).toHaveLength(1);
	});
});
