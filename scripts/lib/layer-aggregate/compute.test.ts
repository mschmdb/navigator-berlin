import { describe, expect, it } from 'vitest';
import { polygon } from '@turf/helpers';
import type { Feature } from 'geojson';
import { computeLayerEntry, type ComputeContext } from './compute.js';
import { buildSpatialTargets } from './member-assignment.js';
import type { LorHierarchy } from '../kiez-score/lor-hierarchy.js';
import type { LayerStrategy } from './strategy.js';

const hierarchy: LorHierarchy = {
	bezirksregionen: [
		{
			bzrId: '011001',
			name: 'Tiergarten',
			slug: 'tiergarten',
			bezirkSlug: 'mitte',
			areaM2: 1000,
			planungsraeume: [
				{ plrId: '01100101', bez: '01', areaM2: 500 },
				{ plrId: '01100102', bez: '01', areaM2: 500 }
			]
		}
	],
	bezirke: [
		{
			slug: 'mitte',
			name: 'Mitte',
			bezCode: '01',
			planungsraeume: [
				{ plrId: '01100101', bez: '01', areaM2: 500 },
				{ plrId: '01100102', bez: '01', areaM2: 500 }
			]
		}
	]
};

const squareGeom = polygon([
	[
		[13.0, 52.0],
		[13.1, 52.0],
		[13.1, 52.1],
		[13.0, 52.1],
		[13.0, 52.0]
	]
]).geometry;

const brFeatures: Feature[] = [
	{ type: 'Feature', properties: { BZR_ID: '011001' }, geometry: squareGeom }
];
const bezFeatures: Feature[] = [
	{ type: 'Feature', properties: { Gemeinde_name: 'Mitte' }, geometry: squareGeom }
];

const ctx: ComputeContext = {
	hierarchy,
	targets: buildSpatialTargets(brFeatures, bezFeatures, hierarchy)
};

function plrFeature(plrId: string, kategorie: string): Feature {
	return {
		type: 'Feature',
		properties: { plr_id: plrId, kategorie },
		geometry: { type: 'Point', coordinates: [13.05, 52.05] }
	};
}

describe('computeLayerEntry · ordinal PLR', () => {
	const strategy: LayerStrategy = {
		type: 'ordinal-distribution',
		memberMode: 'plr',
		valueKey: 'kategorie'
	};
	const source = [plrFeature('01100101', 'hoch'), plrFeature('01100102', 'gering')];

	it('liefert ordinal-distribution mit Kiez/Bezirk/Berlin', () => {
		const entry = computeLayerEntry(strategy, source, ctx);
		expect(entry.type).toBe('ordinal-distribution');
		expect(entry.kiez['tiergarten'].type).toBe('ordinal-distribution');
		expect(entry.bezirk['mitte']).toBeDefined();
		expect(entry.berlin.type).toBe('ordinal-distribution');
	});

	it('Determinismus: zwei Läufe byte-identisch', () => {
		const a = computeLayerEntry(strategy, source, ctx);
		const b = computeLayerEntry(strategy, source, ctx);
		expect(JSON.stringify(a)).toBe(JSON.stringify(b));
	});

	it('neutral-Flag durchgereicht', () => {
		const entry = computeLayerEntry({ ...strategy, neutral: true }, source, ctx);
		expect(entry.neutral).toBe(true);
	});
});

describe('computeLayerEntry · coverage-share spatial', () => {
	const strategy: LayerStrategy = { type: 'coverage-share', memberMode: 'spatial' };
	const source = [
		polygon([
			[
				[13.0, 52.0],
				[13.05, 52.0],
				[13.05, 52.1],
				[13.0, 52.1],
				[13.0, 52.0]
			]
		])
	];

	it('liefert coverage-share, Berlin = Summe der Kiez-Hits / Berlin-Fläche', () => {
		const entry = computeLayerEntry(strategy, source, ctx);
		expect(entry.type).toBe('coverage-share');
		const berlin = entry.berlin;
		if (berlin.type !== 'coverage-share') throw new Error('wrong type');
		// linke Hälfte überlappt → ~50% Coverage.
		expect(berlin.share).toBeGreaterThan(30);
		expect(berlin.share).toBeLessThan(70);
	});
});

describe('computeLayerEntry · weighted-mean PLR', () => {
	const strategy: LayerStrategy = {
		type: 'weighted-mean',
		memberMode: 'plr',
		valueKey: 'miete_summe',
		weightKey: 'wohnungen',
		minWeight: 30
	};
	function mieteFeature(plrId: string, miete: number, wohnungen: number): Feature {
		return {
			type: 'Feature',
			properties: { plr_id: plrId, miete_summe: miete * wohnungen, wohnungen },
			geometry: { type: 'Point', coordinates: [13.05, 52.05] }
		};
	}

	it('Kiez und Bezirk sind wohnungsgewichtet (11,00), nicht Median', () => {
		const source = [mieteFeature('01100101', 10, 90), mieteFeature('01100102', 20, 10)];
		const entry = computeLayerEntry(strategy, source, ctx);
		expect(entry.type).toBe('weighted-mean');
		expect(entry.kiez['tiergarten']).toMatchObject({
			type: 'weighted-mean',
			mean: 11,
			wohnungen: 100
		});
		expect(entry.bezirk['mitte']).toMatchObject({ mean: 11 });
		expect(entry.berlin).toMatchObject({ mean: 11, wohnungen: 100 });
	});

	it('unter 30 Wohnungen: mean null', () => {
		const source = [mieteFeature('01100101', 10, 29)];
		const entry = computeLayerEntry(strategy, source, ctx);
		expect(entry.kiez['tiergarten']).toMatchObject({ mean: null, wohnungen: 29 });
	});

	it('PLR ohne Feature zaehlt als 0 Wohnungen (01100102 fehlt in der Quelle)', () => {
		const source = [mieteFeature('01100101', 10, 30)];
		expect(hierarchy.bezirksregionen[0].planungsraeume).toHaveLength(2);
		const entry = computeLayerEntry(strategy, source, ctx);
		expect(entry.kiez['tiergarten']).toMatchObject({ mean: 10, wohnungen: 30 });
		expect(entry.bezirk['mitte']).toMatchObject({ mean: 10, wohnungen: 30 });
		expect(entry.berlin).toMatchObject({ mean: 10, wohnungen: 30 });
	});

	it('ohne minWeight (Default 0) zaehlt jede positive Wohnungszahl', () => {
		const loose: LayerStrategy = { ...strategy, minWeight: undefined };
		const entry = computeLayerEntry(loose, [mieteFeature('01100101', 10, 5)], ctx);
		expect(entry.kiez['tiergarten']).toMatchObject({ mean: 10, wohnungen: 5 });
	});

	it('wirft, wenn valueKey oder weightKey fehlt', () => {
		const source = [mieteFeature('01100101', 10, 30)];
		expect(() =>
			computeLayerEntry(
				{ type: 'weighted-mean', memberMode: 'plr', weightKey: 'wohnungen' },
				source,
				ctx
			)
		).toThrow(/valueKey/);
		expect(() =>
			computeLayerEntry(
				{ type: 'weighted-mean', memberMode: 'plr', valueKey: 'miete_summe' },
				source,
				ctx
			)
		).toThrow(/weightKey/);
	});
});
