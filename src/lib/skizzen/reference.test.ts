import { describe, expect, it } from 'vitest';
import {
	aggregateProfile,
	parseReference,
	resolveReference,
	serializeReference
} from './reference';
import type { RegionSnapshot } from './types';
import { LABELS, METRICS, type LabelValues, type MetricValues } from './topics';

const noMetrics = Object.fromEntries(METRICS.map((m) => [m, null])) as MetricValues;
const noLabels = Object.fromEntries(LABELS.map((l) => [l, null])) as LabelValues;

function region(slug: string, composite: number | null, parentSlug = 'neukoelln'): RegionSnapshot {
	return {
		slug,
		name: slug.toUpperCase(),
		parentSlug,
		parentName: parentSlug,
		dims: {
			composite,
			ruheLuft: null,
			gruenHitze: null,
			mobilitaet: null,
			versorgung: null,
			wohnschutz: null,
			kultur: null,
			kriminalitaet: null
		},
		figures: {
			bestandsmiete: composite,
			altbau: null,
			gruen: null,
			hitze: null,
			milieuschutz: null
		},
		metrics: { ...noMetrics, laermDb: composite },
		labels: noLabels
	};
}

const ctx = {
	self: 'reuterstrasse',
	hasParent: true,
	neighbors: ['rixdorf'],
	similar: ['wrangelkiez'],
	all: new Set(['reuterstrasse', 'rixdorf', 'wrangelkiez', 'frohnau'])
};

describe('parseReference', () => {
	it('defaults to berlin', () => {
		expect(parseReference(null, ctx)).toEqual({ kind: 'berlin', slug: null });
		expect(parseReference('quatsch', ctx)).toEqual({ kind: 'berlin', slug: null });
	});
	it('reads bezirk only when the region has a parent', () => {
		expect(parseReference('bezirk', ctx)).toEqual({ kind: 'bezirk', slug: null });
		expect(parseReference('bezirk', { ...ctx, hasParent: false })).toEqual({
			kind: 'berlin',
			slug: null
		});
	});
	it('classifies a slug as neighbor, similar or free choice', () => {
		expect(parseReference('rixdorf', ctx)).toEqual({ kind: 'nachbar', slug: 'rixdorf' });
		expect(parseReference('wrangelkiez', ctx)).toEqual({ kind: 'aehnlich', slug: 'wrangelkiez' });
		expect(parseReference('frohnau', ctx)).toEqual({ kind: 'frei', slug: 'frohnau' });
	});
	it('never compares a region with itself', () => {
		expect(parseReference('reuterstrasse', ctx)).toEqual({ kind: 'berlin', slug: null });
	});
});

describe('serializeReference', () => {
	it('drops the param for berlin and writes kind or slug otherwise', () => {
		expect(serializeReference({ kind: 'berlin', slug: null })).toBeNull();
		expect(serializeReference({ kind: 'bezirk', slug: null })).toBe('bezirk');
		expect(serializeReference({ kind: 'frei', slug: 'frohnau' })).toBe('frohnau');
	});
	it('round-trips through parseReference', () => {
		for (const c of [
			{ kind: 'bezirk', slug: null },
			{ kind: 'nachbar', slug: 'rixdorf' },
			{ kind: 'frei', slug: 'frohnau' }
		] as const) {
			expect(parseReference(serializeReference(c), ctx)).toEqual(c);
		}
	});
});

describe('aggregateProfile', () => {
	it('builds median or mean per dimension and keeps given figures', () => {
		const rs = [region('a', 10), region('b', 20), region('c', 60)];
		const figures = { bestandsmiete: 7.66, altbau: 39.5, gruen: 6.6, hitze: 36, milieuschutz: 6 };
		const med = aggregateProfile('berlin', 'Berlin', rs, 'median', figures);
		expect(med.dims.composite).toBe(20);
		expect(med.figures.bestandsmiete).toBe(7.66);
		expect(aggregateProfile('bezirk', 'Neukölln', rs, 'mean', figures).dims.composite).toBe(30);
		expect(med.metrics.laermDb).toBe(20);
	});
	it('takes the own metrics of a Bezirk instead of the Kiez median when given', () => {
		const rs = [region('a', 10), region('b', 20)];
		const own = { metrics: { ...noMetrics, laermDb: 55 }, labels: { ...noLabels, mss: 'mittel' } };
		const p = aggregateProfile('bezirk', 'N', rs, 'mean', region('a', 1).figures, null, own);
		expect(p.metrics.laermDb).toBe(55);
		expect(p.labels.mss).toBe('mittel');
		expect(p.dims.composite).toBe(15);
	});
});

describe('resolveReference', () => {
	const berlin = aggregateProfile(
		'berlin',
		'Berlin',
		[region('a', 40)],
		'median',
		region('a', 1).figures
	);
	const bezirk = aggregateProfile(
		'bezirk',
		'Neukölln',
		[region('a', 45)],
		'mean',
		region('a', 1).figures
	);
	const regions = new Map([['rixdorf', region('rixdorf', 52)]]);

	it('returns the aggregate profiles for berlin and bezirk', () => {
		expect(resolveReference({ kind: 'berlin', slug: null }, { berlin, bezirk, regions })).toBe(
			berlin
		);
		expect(resolveReference({ kind: 'bezirk', slug: null }, { berlin, bezirk, regions })).toBe(
			bezirk
		);
	});
	it('returns a region profile for a slug reference', () => {
		const ref = resolveReference({ kind: 'nachbar', slug: 'rixdorf' }, { berlin, bezirk, regions });
		expect(ref.slug).toBe('rixdorf');
		expect(ref.label).toBe('RIXDORF');
		expect(ref.dims.composite).toBe(52);
	});
	it('falls back to berlin for unknown slugs or missing bezirk', () => {
		expect(resolveReference({ kind: 'frei', slug: 'x' }, { berlin, bezirk, regions })).toBe(berlin);
		expect(
			resolveReference({ kind: 'bezirk', slug: null }, { berlin, bezirk: null, regions })
		).toBe(berlin);
	});
});
