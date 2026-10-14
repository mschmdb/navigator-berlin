import { describe, expect, it } from 'vitest';
import {
	buildLayerKiezRanking,
	buildRankingRegions,
	RANKING_SIZE,
	type RankingRegion
} from './layer-kiez-ranking.js';
import type { LayerAggregate, LayerAggregatesFile } from './layer-aggregates-types.js';

const REGION_COUNT = 12;

function regions(count = REGION_COUNT): Map<string, RankingRegion> {
	const map = new Map<string, RankingRegion>();
	for (let i = 0; i < count; i++) {
		const slug = `kiez-${String(i).padStart(2, '0')}`;
		map.set(slug, { slug, name: `Kiez ${i}`, bezirkName: 'Mitte' });
	}
	return map;
}

function aggregatesFor(
	slug: string,
	type: LayerAggregate['type'],
	kiez: Record<string, LayerAggregate>
): LayerAggregatesFile {
	return {
		schemaVersion: 1,
		generatedAt: '2026-10-14T00:00:00.000Z',
		aggregates: {
			[slug]: { type, kiez, bezirk: {}, berlin: Object.values(kiez)[0] }
		}
	};
}

function byIndex(
	make: (i: number) => LayerAggregate,
	count = REGION_COUNT
): Record<string, LayerAggregate> {
	const out: Record<string, LayerAggregate> = {};
	for (let i = 0; i < count; i++) out[`kiez-${String(i).padStart(2, '0')}`] = make(i);
	return out;
}

const NO_COMPOSITES = null;

function share(slug: string, type: 'area-share' | 'coverage-share', make: (i: number) => number) {
	return buildLayerKiezRanking({
		layerSlug: slug,
		aggregates: aggregatesFor(
			slug,
			type,
			byIndex((i) => ({ type, share: make(i) }))
		),
		composites: NO_COMPOSITES,
		regions: regions()
	});
}

describe('buildLayerKiezRanking', () => {
	it('weighted-mean: je 5 höchste und niedrigste, ohne Überschneidung', () => {
		const r = buildLayerKiezRanking({
			layerSlug: 'zensus-bestandsmiete-2022',
			aggregates: aggregatesFor(
				'zensus-bestandsmiete-2022',
				'weighted-mean',
				byIndex((i) => ({ type: 'weighted-mean', mean: 5 + i, wohnungen: 100 }))
			),
			composites: NO_COMPOSITES,
			regions: regions()
		});
		expect(r?.variant).toBe('neutral');
		expect(r?.unit).toBe('eur-m2');
		expect(r?.top.entries.map((e) => e.value)).toEqual([16, 15, 14, 13, 12]);
		expect(r?.bottom?.entries.map((e) => e.value)).toEqual([5, 6, 7, 8, 9]);
		expect(r?.top.entries).toHaveLength(RANKING_SIZE);
		expect(r?.top.entries[0]).toMatchObject({
			slug: 'kiez-11',
			name: 'Kiez 11',
			bezirkName: 'Mitte'
		});
	});

	it('weighted-mean Altbau: Einheit Prozent', () => {
		const r = buildLayerKiezRanking({
			layerSlug: 'zensus-altbau-anteil-2022',
			aggregates: aggregatesFor(
				'zensus-altbau-anteil-2022',
				'weighted-mean',
				byIndex((i) => ({ type: 'weighted-mean', mean: 10 + i, wohnungen: 100 }))
			),
			composites: NO_COMPOSITES,
			regions: regions()
		});
		expect(r?.unit).toBe('percent');
	});

	it('schließt Kieze ohne Wert (null) und ohne Region aus', () => {
		const kiez = byIndex((i) => ({
			type: 'weighted-mean',
			mean: i === 11 ? null : 5 + i,
			wohnungen: 100
		}));
		kiez['unbekannt'] = { type: 'weighted-mean', mean: 99, wohnungen: 100 };
		const r = buildLayerKiezRanking({
			layerSlug: 'zensus-bestandsmiete-2022',
			aggregates: aggregatesFor('zensus-bestandsmiete-2022', 'weighted-mean', kiez),
			composites: NO_COMPOSITES,
			regions: regions()
		});
		const all = [...(r?.top.entries ?? []), ...(r?.bottom?.entries ?? [])].map((e) => e.slug);
		expect(all).not.toContain('kiez-11');
		expect(all).not.toContain('unbekannt');
		expect(r?.top.entries[0].value).toBe(15);
	});

	it('numeric-median: nutzt den Median in Grad Celsius', () => {
		const r = buildLayerKiezRanking({
			layerSlug: 'klima-pet-2022',
			aggregates: aggregatesFor(
				'klima-pet-2022',
				'numeric-median',
				byIndex((i) => ({
					type: 'numeric-median',
					median: 30 + i,
					min: 0,
					max: 50,
					contributingMembers: 3,
					totalMembers: 3,
					coverage: '3/3'
				}))
			),
			composites: NO_COMPOSITES,
			regions: regions()
		});
		expect(r?.unit).toBe('celsius');
		expect(r?.top.entries[0].value).toBe(41);
	});

	it('area-share und coverage-share: Prozent', () => {
		for (const [type, slug] of [
			['area-share', 'gruenanlagen'],
			['coverage-share', 'denkmal-2024']
		] as const) {
			const r = share(slug, type, (i) => i + 1);
			expect(r?.unit).toBe('percent');
			expect(r?.top.entries[0].value).toBe(12);
			expect(r?.bottom?.entries[0].value).toBe(1);
		}
	});

	it('unbekannter Layer-Slug mit Aggregat: keine Rangliste', () => {
		expect(share('neuer-layer-2030', 'area-share', (i) => i)).toBeNull();
	});

	it('Lärm und Luft: keine Rangliste', () => {
		const ordinal: LayerAggregate = {
			type: 'ordinal-distribution',
			classes: [{ label: 'hoch', share: 100 }],
			dominant: 'hoch',
			contributingMembers: 3,
			totalMembers: 3,
			coverage: '3/3'
		};
		for (const slug of ['laerm-2023', 'luft-2023']) {
			expect(
				buildLayerKiezRanking({
					layerSlug: slug,
					aggregates: aggregatesFor(
						slug,
						'ordinal-distribution',
						byIndex(() => ordinal)
					),
					composites: NO_COMPOSITES,
					regions: regions()
				})
			).toBeNull();
		}
	});

	describe('Gleichstand am Schnitt', () => {
		it('Liste endet vor der Gleichstandsgruppe, Hinweis nennt Anzahl und Wert', () => {
			const r = share('milieuschutz-staedtebau', 'coverage-share', (i) => (i < 9 ? 0 : i));
			expect(r?.top.entries.map((e) => e.value)).toEqual([11, 10, 9]);
			expect(r?.top.tie).toEqual({ count: 9, value: 0 });
		});

		it('weniger als 3 Einträge: Liste entfällt, nur der Hinweis bleibt', () => {
			const r = share('milieuschutz-staedtebau', 'coverage-share', (i) => (i < 10 ? 0 : i));
			expect(r?.top.entries).toEqual([]);
			expect(r?.top.tie).toEqual({ count: 10, value: 0 });
			expect(r?.bottom?.entries).toEqual([]);
			expect(r?.bottom?.tie).toEqual({ count: 10, value: 0 });
		});

		it('Niedrigste endet ebenfalls vor einem Gleichstand', () => {
			const r = share('denkmal-2024', 'coverage-share', (i) => (i < 4 ? i : i < 8 ? 50 : 60 + i));
			expect(r?.bottom?.entries.map((e) => e.value)).toEqual([0, 1, 2, 3]);
			expect(r?.bottom?.tie).toEqual({ count: 4, value: 50 });
		});

		it('Gleichstand innerhalb der Liste ist kein Schnitt-Gleichstand und sortiert nach Name', () => {
			const r = share('gruenanlagen', 'area-share', (i) => (i < 2 ? 50 : i));
			expect(r?.top.tie).toBeNull();
			expect(r?.top.entries[0].value).toBe(50);
			expect(r?.top.entries.slice(0, 2).map((e) => e.name)).toEqual(['Kiez 0', 'Kiez 1']);
		});

		it('gibt null zurück, wenn alle Werte gleich sind', () => {
			expect(share('milieuschutz-staedtebau', 'coverage-share', () => 0)).toBeNull();
		});
	});

	it('bei weniger als 10 Werten steht kein Kiez in beiden Listen', () => {
		const r = buildLayerKiezRanking({
			layerSlug: 'gruenanlagen',
			aggregates: aggregatesFor(
				'gruenanlagen',
				'area-share',
				byIndex((i) => ({ type: 'area-share', share: i + 1 }), 7)
			),
			composites: NO_COMPOSITES,
			regions: regions(7)
		});
		const top = new Set(r?.top.entries.map((e) => e.slug));
		expect(r?.top.entries.map((e) => e.value)).toEqual([7, 6, 5, 4, 3]);
		expect(r?.bottom?.entries.map((e) => e.value)).toEqual([1, 2]);
		for (const e of r?.bottom?.entries ?? []) expect(top.has(e.slug)).toBe(false);
	});

	describe('Kiez-Score gesamt', () => {
		it('nur Top 5 aus den Composites, ohne Flop-Liste', () => {
			const composites = {
				kiez: Object.fromEntries(
					[...regions().keys()].map((slug, i) => [slug, i === 3 ? null : 30 + i + 0.4])
				)
			};
			const r = buildLayerKiezRanking({
				layerSlug: 'kiez-score-gesamt',
				aggregates: null,
				composites,
				regions: regions()
			});
			expect(r?.variant).toBe('score');
			expect(r?.unit).toBe('score');
			expect(r?.top.entries.map((e) => e.value)).toEqual([41, 40, 39, 38, 37]);
			expect(r?.bottom).toBeNull();
		});

		it('sortiert nach Rohwert, rundet nur für die Anzeige', () => {
			const raw = [57.7, 58.1, 57.6, 57.5, 57.4, 57.45, 40, 40, 40, 40, 40, 40];
			const composites = {
				kiez: Object.fromEntries([...regions().keys()].map((slug, i) => [slug, raw[i]]))
			};
			const r = buildLayerKiezRanking({
				layerSlug: 'kiez-score-gesamt',
				aggregates: null,
				composites,
				regions: regions()
			});
			expect(r?.top.entries.map((e) => e.slug)).toEqual([
				'kiez-01',
				'kiez-00',
				'kiez-02',
				'kiez-03',
				'kiez-05'
			]);
			expect(r?.top.entries.map((e) => e.value)).toEqual([58, 58, 58, 58, 57]);
		});

		it('gibt null ohne Composites zurück', () => {
			expect(
				buildLayerKiezRanking({
					layerSlug: 'kiez-score-gesamt',
					aggregates: null,
					composites: NO_COMPOSITES,
					regions: regions()
				})
			).toBeNull();
		});
	});

	it('gibt null für Dimensions-Score-Layer zurück (keine Kiez-Werte)', () => {
		expect(
			buildLayerKiezRanking({
				layerSlug: 'kiez-score-ruhe-luft',
				aggregates: null,
				composites: { kiez: { 'kiez-00': 50 } },
				regions: regions()
			})
		).toBeNull();
	});

	it('gibt null für Layer ohne Aggregat (Punkt-Layer) und ohne Aggregat-Datei zurück', () => {
		const aggregates = aggregatesFor(
			'gruenanlagen',
			'area-share',
			byIndex((i) => ({ type: 'area-share', share: i }))
		);
		const base = { composites: NO_COMPOSITES, regions: regions() };
		expect(buildLayerKiezRanking({ ...base, layerSlug: 'haltestellen', aggregates })).toBeNull();
		expect(
			buildLayerKiezRanking({ ...base, layerSlug: 'gruenanlagen', aggregates: null })
		).toBeNull();
	});

	it('gibt null für ordinale Layer ohne Rangliste zurück', () => {
		const aggregates = aggregatesFor('wohnlagen-2024', 'ordinal-distribution', {
			'kiez-00': {
				type: 'ordinal-distribution',
				classes: [{ label: 'mittel', share: 100 }],
				dominant: 'mittel',
				contributingMembers: 3,
				totalMembers: 3,
				coverage: '3/3'
			}
		});
		expect(
			buildLayerKiezRanking({
				layerSlug: 'wohnlagen-2024',
				aggregates,
				composites: NO_COMPOSITES,
				regions: regions()
			})
		).toBeNull();
	});
});

describe('buildRankingRegions', () => {
	const lor = {
		features: [
			{ properties: { BZR_NAME: 'Heerstraße', BEZ: '04' } },
			{ properties: { BZR_NAME: 'Heerstraße', BEZ: '05' } },
			{ properties: { BZR_NAME: 'Südliche  Friedrichstadt', BEZ: 2 } },
			{ properties: { BEZ: '01' } }
		]
	};
	const bezirke = new Map([
		['04', 'Charlottenburg-Wilmersdorf'],
		['05', 'Spandau'],
		['02', 'Friedrichshain-Kreuzberg']
	]);

	it('nutzt den Dubletten-Fallback und Anzeigenamen mit Bezirk', () => {
		const r = buildRankingRegions(lor, bezirke);
		expect(r.get('heerstrasse-spandau')).toEqual({
			slug: 'heerstrasse-spandau',
			name: 'Heerstraße',
			bezirkName: 'Spandau'
		});
		expect(r.has('heerstrasse-charlottenburg-wilmersdorf')).toBe(true);
		expect(r.has('heerstrasse')).toBe(false);
	});

	it('glättet Whitespace und überspringt Features ohne Namen', () => {
		const r = buildRankingRegions(lor, bezirke);
		expect(r.size).toBe(3);
		expect([...r.values()].map((x) => x.name)).toContain('Südliche Friedrichstadt');
	});
});
