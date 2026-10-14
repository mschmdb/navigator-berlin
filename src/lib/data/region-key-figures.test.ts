import { describe, expect, it } from 'vitest';
import { buildKeyFigures, KEY_FIGURE_LAYERS } from './region-key-figures.js';
import type {
	LayerAggregate,
	LayerAggregateEntry,
	LayerAggregatesFile,
	OrdinalDistributionAggregate
} from './layer-aggregates-types.js';

function entry(
	type: LayerAggregate['type'],
	kiez: Record<string, LayerAggregate>,
	bezirk: Record<string, LayerAggregate>,
	berlin: LayerAggregate
): LayerAggregateEntry {
	return { type, kiez, bezirk, berlin };
}

const wm = (mean: number | null): LayerAggregate => ({
	type: 'weighted-mean',
	mean,
	wohnungen: 100
});
const share = (s: number): LayerAggregate => ({ type: 'area-share', share: s });
const cov = (s: number): LayerAggregate => ({ type: 'coverage-share', share: s });
const med = (v: number): LayerAggregate => ({
	type: 'numeric-median',
	median: v,
	min: 0,
	max: 50,
	contributingMembers: 1,
	totalMembers: 1,
	coverage: '1/1'
});
const ord = (classes: [string, number][]): OrdinalDistributionAggregate => ({
	type: 'ordinal-distribution',
	classes: classes.map(([label, s]) => ({ label, share: s })),
	dominant: classes[0]?.[0] ?? null,
	contributingMembers: 1,
	totalMembers: 1,
	coverage: '1/1'
});

const FILE: LayerAggregatesFile = {
	schemaVersion: 1,
	generatedAt: '2026-10-14',
	aggregates: {
		'zensus-bestandsmiete-2022': entry(
			'weighted-mean',
			{ reuterstrasse: wm(8.1), 'heerstrasse-spandau': wm(null) },
			{ neukoelln: wm(7.5) },
			wm(7.66)
		),
		'zensus-altbau-anteil-2022': entry(
			'weighted-mean',
			{ reuterstrasse: wm(60) },
			{ neukoelln: wm(45) },
			wm(39.49)
		),
		'laerm-2023': entry(
			'ordinal-distribution',
			{
				reuterstrasse: ord([
					['mittel', 50],
					['hoch', 30],
					['sehr hoch', 10],
					['gering', 10]
				]),
				ruhig: ord([['gering', 100]])
			},
			{ neukoelln: ord([['hoch', 20.5]]) },
			ord([
				['mittel', 50],
				['hoch', 25]
			])
		),
		gruenanlagen: entry(
			'area-share',
			{ reuterstrasse: share(3.2) },
			{ neukoelln: share(4) },
			share(6.6)
		),
		'klima-pet-2022': entry(
			'numeric-median',
			{ reuterstrasse: med(37.2) },
			{ neukoelln: med(36) },
			med(36)
		),
		'milieuschutz-erhaltungsmiete': entry(
			'coverage-share',
			{ reuterstrasse: cov(100) },
			{ neukoelln: cov(40) },
			cov(6)
		)
	}
};

describe('buildKeyFigures', () => {
	it('liefert sechs Kacheln in fester Reihenfolge', () => {
		const figures = buildKeyFigures(FILE, { kind: 'kiez', slug: 'reuterstrasse' });
		expect(figures.map((f) => f.layer)).toEqual([...KEY_FIGURE_LAYERS]);
		expect(figures.map((f) => f.id)).toEqual([
			'bestandsmiete',
			'altbau',
			'laerm',
			'gruen',
			'hitze',
			'milieuschutz'
		]);
	});

	it('liest Kiez- und Berlin-Werte aller Aggregat-Typen', () => {
		const f = buildKeyFigures(FILE, { kind: 'kiez', slug: 'reuterstrasse' });
		expect(f.map((x) => [x.value, x.berlin])).toEqual([
			[8.1, 7.66],
			[60, 39.49],
			[null, null],
			[3.2, 6.6],
			[37.2, 36],
			[100, 6]
		]);
		expect(f.map((x) => x.unit)).toEqual([
			'eur-m2',
			'percent',
			'level',
			'percent',
			'celsius',
			'percent'
		]);
	});

	it('liest Bezirkswerte aus dem bezirk-Block', () => {
		const f = buildKeyFigures(FILE, { kind: 'bezirk', slug: 'neukoelln' });
		expect(f[0]?.value).toBe(7.5);
		expect(f[2]?.level).toBe('hoch');
	});

	it('setzt value auf null bei fehlendem Slug und behält den Berlin-Wert', () => {
		const f = buildKeyFigures(FILE, { kind: 'kiez', slug: 'unbekannt' });
		expect(f.every((x) => x.value === null)).toBe(true);
		expect(f[0]?.berlin).toBe(7.66);
	});

	it('setzt value auf null, wenn das Aggregat null meldet', () => {
		const f = buildKeyFigures(FILE, { kind: 'kiez', slug: 'heerstrasse-spandau' });
		expect(f[0]?.value).toBeNull();
	});

	it('nimmt bei Lärm die überwiegende Stufe, auch für Berlin', () => {
		const f = buildKeyFigures(FILE, { kind: 'kiez', slug: 'reuterstrasse' });
		expect(f[2]?.level).toBe('mittel');
		expect(f[2]?.berlinLevel).toBe('mittel');
		expect(f[2]?.value).toBeNull();
	});

	it('meldet bei Lärm ohne Klassen oder ohne dominant keine Angabe', () => {
		const file: LayerAggregatesFile = {
			...FILE,
			aggregates: {
				...FILE.aggregates,
				'laerm-2023': entry(
					'ordinal-distribution',
					{
						leer: ord([]),
						ohneDominant: { ...ord([['gering', 100]]), dominant: null },
						ruhig: ord([['gering', 100]])
					},
					{},
					ord([['gering', 100]])
				)
			}
		};
		expect(buildKeyFigures(file, { kind: 'kiez', slug: 'leer' })[2]?.level).toBeNull();
		expect(buildKeyFigures(file, { kind: 'kiez', slug: 'ohneDominant' })[2]?.level).toBeNull();
		expect(buildKeyFigures(file, { kind: 'kiez', slug: 'ruhig' })[2]?.level).toBe('gering');
	});

	it('wirft nicht, wenn die kiez- oder bezirk-Map im Eintrag fehlt', () => {
		const broken = {
			...FILE,
			aggregates: {
				...FILE.aggregates,
				gruenanlagen: { type: 'area-share', berlin: share(6.6) }
			}
		} as unknown as LayerAggregatesFile;
		expect(buildKeyFigures(broken, { kind: 'kiez', slug: 'x' })[3]?.value).toBeNull();
		expect(buildKeyFigures(broken, { kind: 'bezirk', slug: 'x' })[3]?.berlin).toBe(6.6);
	});

	it('fällt bei Dubletten auf name-bezirk zurück', () => {
		const file: LayerAggregatesFile = {
			...FILE,
			aggregates: {
				...FILE.aggregates,
				gruenanlagen: entry('area-share', { 'heerstrasse-spandau': share(9) }, {}, share(6.6))
			}
		};
		const f = buildKeyFigures(file, { kind: 'kiez', slug: 'heerstrasse', bezirkSlug: 'spandau' });
		expect(f[3]?.value).toBe(9);
	});

	it('liefert null-Werte, wenn die Aggregate-Datei fehlt', () => {
		const f = buildKeyFigures(null, { kind: 'kiez', slug: 'reuterstrasse' });
		expect(f).toHaveLength(6);
		expect(f.every((x) => x.value === null && x.berlin === null)).toBe(true);
	});

	it('ignoriert Aggregate mit unerwartetem Typ', () => {
		const file: LayerAggregatesFile = {
			...FILE,
			aggregates: {
				...FILE.aggregates,
				gruenanlagen: entry('weighted-mean', { reuterstrasse: wm(1) }, {}, wm(2))
			}
		};
		const f = buildKeyFigures(file, { kind: 'kiez', slug: 'reuterstrasse' });
		expect(f[3]?.value).toBeNull();
	});
});
