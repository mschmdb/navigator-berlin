import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FeatureCollection } from 'geojson';
import { describe, expect, it } from 'vitest';
import { rankBy } from '../../../../../scripts/lib/ranking/ranking.js';
import type { RegionComposites } from '$lib/data/get-region-composites.js';
import { compositeRank, resolveRegionFocus } from './region-focus.js';

function readLayer(slug: string): FeatureCollection {
	const dir = resolve(process.cwd(), 'static/layers');
	const manifest = JSON.parse(readFileSync(resolve(dir, 'MANIFEST.json'), 'utf-8')) as {
		layers: { slug: string; filename: string }[];
	};
	const entry = manifest.layers.find((l) => l.slug === slug);
	if (!entry) throw new Error(`${slug} fehlt im MANIFEST`);
	return JSON.parse(readFileSync(resolve(dir, entry.filename), 'utf-8')) as FeatureCollection;
}

const kiezFc = readLayer('lor-bezirksregion');
const bezirkeFc = readLayer('bezirke');
const composites = JSON.parse(
	readFileSync(resolve(process.cwd(), 'static/kiez-scores/region-composites.json'), 'utf-8')
) as RegionComposites;

describe('resolveRegionFocus', () => {
	it('löst einen Kiez-Slug auf Name, Bezirk und Bbox auf', () => {
		const t = resolveRegionFocus({ kind: 'kiez', slug: 'reuterstrasse' }, kiezFc, bezirkeFc);
		expect(t?.name).toBe('Reuterstraße');
		expect(t?.bezirkName).toBe('Neukölln');
		expect(t?.bezirkSlug).toBe('neukoelln');
		const [w, s, e, n] = t!.bbox;
		expect(w).toBeLessThan(e);
		expect(s).toBeLessThan(n);
		expect(w).toBeGreaterThan(13);
		expect(n).toBeLessThan(53);
	});

	it('trennt Dubletten-Slugs sauber', () => {
		const spandau = resolveRegionFocus(
			{ kind: 'kiez', slug: 'heerstrasse-spandau' },
			kiezFc,
			bezirkeFc
		);
		const cw = resolveRegionFocus(
			{ kind: 'kiez', slug: 'heerstrasse-charlottenburg-wilmersdorf' },
			kiezFc,
			bezirkeFc
		);
		expect(spandau?.bezirkName).toBe('Spandau');
		expect(cw?.bezirkName).toBe('Charlottenburg-Wilmersdorf');
		expect(spandau?.bbox).not.toEqual(cw?.bbox);
		expect(resolveRegionFocus({ kind: 'kiez', slug: 'heerstrasse' }, kiezFc, bezirkeFc)).toBeNull();
	});

	it('löst einen Bezirk-Slug auf, auch ohne Kiez-Daten', () => {
		const t = resolveRegionFocus({ kind: 'bezirk', slug: 'pankow' }, null, bezirkeFc);
		expect(t?.name).toBe('Pankow');
		expect(t?.bezirkSlug).toBe('pankow');
	});

	it('löst jeden der 143 Kieze und 12 Bezirke auf', () => {
		for (const slug of Object.keys(composites.kiez)) {
			expect(resolveRegionFocus({ kind: 'kiez', slug }, kiezFc, bezirkeFc), slug).not.toBeNull();
		}
		for (const slug of Object.keys(composites.bezirk)) {
			expect(resolveRegionFocus({ kind: 'bezirk', slug }, kiezFc, bezirkeFc), slug).not.toBeNull();
		}
	});

	it('liefert null für unbekannte Slugs und fehlende Kiez-Daten', () => {
		expect(resolveRegionFocus({ kind: 'kiez', slug: 'gibtsnicht' }, kiezFc, bezirkeFc)).toBeNull();
		expect(resolveRegionFocus({ kind: 'bezirk', slug: 'gibtsnicht' }, null, bezirkeFc)).toBeNull();
		expect(resolveRegionFocus({ kind: 'kiez', slug: 'reuterstrasse' }, null, bezirkeFc)).toBeNull();
	});
});

describe('compositeRank', () => {
	it('stimmt für alle Kieze und Bezirke mit rankBy (Quelle von kiez_rank) überein', () => {
		for (const kind of ['kiez', 'bezirk'] as const) {
			const ranked = rankBy(
				Object.entries(composites[kind]).map(([slug, value]) => ({ slug, value })),
				'higher-better'
			);
			for (const r of ranked) {
				const mine = compositeRank(composites, kind, r.slug);
				expect(mine?.rang, `${kind}:${r.slug}`).toBe(r.rang);
				expect(mine?.total).toBe(r.total);
			}
		}
	});

	it('zählt 143 Kieze und 12 Bezirke', () => {
		expect(compositeRank(composites, 'kiez', 'reuterstrasse')?.total).toBe(143);
		expect(compositeRank(composites, 'bezirk', 'pankow')?.total).toBe(12);
	});

	it('teilt den Rang bei Gleichstand', () => {
		const tie: RegionComposites = {
			schemaVersion: 1,
			generatedAt: '',
			kiez: { a: 50, b: 50, c: 40, d: null },
			bezirk: {}
		};
		expect(compositeRank(tie, 'kiez', 'a')?.rang).toBe(1);
		expect(compositeRank(tie, 'kiez', 'b')?.rang).toBe(1);
		expect(compositeRank(tie, 'kiez', 'c')?.rang).toBe(2);
		expect(compositeRank(tie, 'kiez', 'c')?.total).toBe(3);
	});

	it('liefert null ohne Daten, ohne Score oder bei unbekanntem Slug', () => {
		expect(compositeRank(null, 'kiez', 'a')).toBeNull();
		const sparse: RegionComposites = {
			schemaVersion: 1,
			generatedAt: '',
			kiez: { d: null },
			bezirk: {}
		};
		expect(compositeRank(sparse, 'kiez', 'd')).toBeNull();
		expect(compositeRank(sparse, 'kiez', 'zzz')).toBeNull();
	});
});
