import { describe, expect, it } from 'vitest';
import { aggregateLayerForLevel } from './aggregate-layer-for-level.js';
import type { LayerAggregatesFile } from '$lib/data/layer-aggregates-types.js';

const ctx = { kiezSlug: 'tiergarten', bezirkSlug: 'mitte' };

const aggregates: LayerAggregatesFile = {
	schemaVersion: 1,
	generatedAt: '2026-05-20T00:00:00.000Z',
	aggregates: {
		'laerm-2023': {
			type: 'ordinal-distribution',
			kiez: {
				tiergarten: {
					type: 'ordinal-distribution',
					classes: [{ label: 'mittel', share: 100 }],
					dominant: 'mittel',
					contributingMembers: 3,
					totalMembers: 3,
					coverage: '3/3'
				}
			},
			bezirk: {
				mitte: {
					type: 'ordinal-distribution',
					classes: [{ label: 'hoch', share: 60 }],
					dominant: 'hoch',
					contributingMembers: 10,
					totalMembers: 10,
					coverage: '10/10'
				}
			},
			berlin: {
				type: 'ordinal-distribution',
				classes: [{ label: 'mittel', share: 50 }],
				dominant: 'mittel',
				contributingMembers: 540,
				totalMembers: 542,
				coverage: '540/542'
			}
		},
		'mss-gesamtindex-2025': {
			type: 'ordinal-distribution',
			neutral: true,
			kiez: {
				tiergarten: {
					type: 'ordinal-distribution',
					classes: [],
					dominant: null,
					contributingMembers: 1,
					totalMembers: 3,
					coverage: 'coverage:1/3-below-50%-threshold'
				}
			},
			bezirk: {},
			berlin: {
				type: 'ordinal-distribution',
				classes: [{ label: 'mittel', share: 100 }],
				dominant: 'mittel',
				contributingMembers: 542,
				totalMembers: 542,
				coverage: '542/542'
			}
		}
	}
};

describe('aggregateLayerForLevel', () => {
	it('address → Passthrough (kind address, distance-ring)', () => {
		const v = aggregateLayerForLevel('laerm-2023', 'address', ctx, aggregates, 'Polygon');
		expect(v.kind).toBe('address');
		expect(v.visualType).toBe('distance-ring');
	});

	it('kiez → Aggregat aus Pre-Aggregat (kiezSlug-Lookup)', () => {
		const v = aggregateLayerForLevel('laerm-2023', 'kiez', ctx, aggregates, 'Polygon');
		expect(v.kind).toBe('aggregate');
		expect(v.visualType).toBe('ordinal-distribution');
		expect(v.aggregate?.type).toBe('ordinal-distribution');
	});

	it('bezirk → Bezirk-Aggregat', () => {
		const v = aggregateLayerForLevel('laerm-2023', 'bezirk', ctx, aggregates, 'Polygon');
		expect(v.kind).toBe('aggregate');
		if (v.aggregate?.type !== 'ordinal-distribution') throw new Error('type');
		expect(v.aggregate.dominant).toBe('hoch');
	});

	it('berlin → Berlin-Aggregat (kein Slug nötig)', () => {
		const v = aggregateLayerForLevel('laerm-2023', 'berlin', ctx, aggregates, 'Polygon');
		expect(v.kind).toBe('aggregate');
		if (v.aggregate?.type !== 'ordinal-distribution') throw new Error('type');
		expect(v.aggregate.coverage).toBe('540/542');
	});

	it('neutral-Flag durchgereicht (Stigma-Layer)', () => {
		const v = aggregateLayerForLevel('mss-gesamtindex-2025', 'berlin', ctx, aggregates, 'Polygon');
		expect(v.neutral).toBe(true);
	});

	it('below-threshold (ordinal dominant null) → kind below-threshold + coverageNote', () => {
		const v = aggregateLayerForLevel('mss-gesamtindex-2025', 'kiez', ctx, aggregates, 'Polygon');
		expect(v.kind).toBe('below-threshold');
		expect(v.coverageNote).toContain('below-50%-threshold');
	});

	it('Layer ohne Aggregat + Polygon → not-aggregatable Disclaimer', () => {
		const v = aggregateLayerForLevel('bodenrichtwerte', 'kiez', ctx, aggregates, 'Polygon');
		expect(v.kind).toBe('not-aggregatable');
		expect(v.disclaimer).toBe('brw-not-aggregatable');
	});

	it('Layer ohne Aggregat + Point → point-density', () => {
		const v = aggregateLayerForLevel('kitas-2024', 'bezirk', ctx, aggregates, 'Point');
		expect(v.kind).toBe('point-density');
		expect(v.visualType).toBe('point-density');
	});

	it('Kiez-Slug-Disambiguierungs-Fallback: plain miss → ${slug}-${bezirkSlug}', () => {
		const aggDisamb: LayerAggregatesFile = {
			schemaVersion: 1,
			generatedAt: '2026-05-20T00:00:00.000Z',
			aggregates: {
				'laerm-2023': {
					type: 'ordinal-distribution',
					kiez: {
						'heerstrasse-spandau': {
							type: 'ordinal-distribution',
							classes: [{ label: 'gering', share: 100 }],
							dominant: 'gering',
							contributingMembers: 2,
							totalMembers: 2,
							coverage: '2/2'
						}
					},
					bezirk: {},
					berlin: {
						type: 'ordinal-distribution',
						classes: [],
						dominant: null,
						contributingMembers: 0,
						totalMembers: 0,
						coverage: '0/0'
					}
				}
			}
		};
		const v = aggregateLayerForLevel(
			'laerm-2023',
			'kiez',
			{ kiezSlug: 'heerstrasse', bezirkSlug: 'spandau' },
			aggDisamb,
			'Polygon'
		);
		expect(v.kind).toBe('aggregate');
		if (v.aggregate?.type !== 'ordinal-distribution') throw new Error('type');
		expect(v.aggregate.dominant).toBe('gering');
	});

	it('kiez ohne aufgelösten Slug → no-data (graceful)', () => {
		const v = aggregateLayerForLevel(
			'laerm-2023',
			'kiez',
			{ kiezSlug: null, bezirkSlug: null },
			aggregates,
			'Polygon'
		);
		expect(v.kind).toBe('no-data');
	});

	it('bezirk-Slug nicht im Aggregat (z.B. Brandenburg) → no-data', () => {
		const v = aggregateLayerForLevel('mss-gesamtindex-2025', 'bezirk', ctx, aggregates, 'Polygon');
		expect(v.kind).toBe('no-data');
	});

	it('aggregates null (noch nicht geladen) + Polygon → no-data (loading), nicht not-aggregatable', () => {
		const v = aggregateLayerForLevel('laerm-2023', 'kiez', ctx, null, 'Polygon');
		expect(v.kind).toBe('no-data');
	});

	it('aggregates null + Point → point-density (Runtime-Count, kein JSON nötig)', () => {
		const v = aggregateLayerForLevel('kitas-2024', 'bezirk', ctx, null, 'Point');
		expect(v.kind).toBe('point-density');
	});
});
