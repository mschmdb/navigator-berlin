import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	buildKiezNeighborLists,
	findNeighborSlugs,
	type KiezScoreSnapshot,
	type NeighborLorCollection
} from './kiez-neighbors.js';
import { normalizeSlug } from './internal/slug.js';
import type { Manifest } from './types.js';

function square(x: number, y: number) {
	return {
		type: 'Polygon',
		coordinates: [
			[
				[x, y],
				[x + 1, y],
				[x + 1, y + 1],
				[x, y + 1],
				[x, y]
			]
		]
	};
}

// Raster:  C D      E liegt isoliert.
//          A B
const GRID: NeighborLorCollection = {
	features: [
		{ properties: { BZR_NAME: 'Alpha', BEZ: '01' }, geometry: square(0, 0) },
		{ properties: { BZR_NAME: 'Beta', BEZ: '01' }, geometry: square(1, 0) },
		{ properties: { BZR_NAME: 'Gamma', BEZ: '02' }, geometry: square(0, 1) },
		{ properties: { BZR_NAME: 'Delta', BEZ: '02' }, geometry: square(1, 1) },
		{ properties: { BZR_NAME: 'Epsilon', BEZ: '02' }, geometry: square(5, 5) }
	]
};
const BEZIRKE = new Map([
	['01', 'Mitte'],
	['02', 'Pankow']
]);

function snapshot(composite: number, dim: number): KiezScoreSnapshot {
	return {
		composite,
		dims: {
			ruheLuft: dim,
			gruenHitze: dim,
			mobilitaet: dim,
			versorgung: dim,
			wohnschutz: dim
		}
	};
}

describe('findNeighborSlugs', () => {
	const regions = GRID.features.map((f, i) => ({
		slug: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'][i],
		geometry: f.geometry
	}));
	const result = findNeighborSlugs(regions);

	it('verbindet Kieze mit gemeinsamer Kante, auch über Bezirksgrenzen', () => {
		expect([...(result.get('alpha') ?? [])].sort()).toEqual(['beta', 'gamma']);
	});

	it('zählt eine reine Eckberührung nicht als Nachbarschaft', () => {
		expect(result.get('alpha')).not.toContain('delta');
		expect(result.get('delta')).not.toContain('alpha');
	});

	it('liefert für einen isolierten Kiez eine leere Liste', () => {
		expect(result.get('epsilon')).toEqual([]);
	});

	it('ist symmetrisch', () => {
		for (const [slug, neighbors] of result) {
			for (const n of neighbors) expect(result.get(n)).toContain(slug);
		}
	});

	it('toleriert Rundungsrauschen jenseits der sechsten Nachkommastelle', () => {
		const noisy = [
			{ slug: 'a', geometry: square(0, 0) },
			{
				slug: 'b',
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[1.00000001, 0],
							[2, 0],
							[2, 1],
							[1.00000001, 1.0000000001],
							[1.00000001, 0]
						]
					]
				}
			}
		];
		expect(findNeighborSlugs(noisy).get('a')).toEqual(['b']);
	});

	it('erkennt Kanten mit versetzten Stützpunkten (T-Stoß)', () => {
		const out = findNeighborSlugs([
			{ slug: 'a', geometry: square(0, 0) },
			{
				slug: 'b',
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[1, 0],
							[2, 0],
							[2, 1],
							[1, 1],
							[1, 0.5],
							[1, 0]
						]
					]
				}
			}
		]);
		expect(out.get('a')).toEqual(['b']);
		expect(out.get('b')).toEqual(['a']);
	});

	it('zählt zwei getrennte Eckpunkte nicht als Nachbarschaft', () => {
		const out = findNeighborSlugs([
			{ slug: 'a', geometry: square(0, 0) },
			{ slug: 'c', geometry: square(1, 1) },
			{ slug: 'd', geometry: square(-1, 1) }
		]);
		expect(out.get('a')).toEqual([]);
		expect(out.get('c')).toEqual([]);
	});

	it('unterstützt MultiPolygon und ignoriert fehlende Geometrie', () => {
		const out = findNeighborSlugs([
			{ slug: 'a', geometry: { type: 'MultiPolygon', coordinates: [square(0, 0).coordinates] } },
			{ slug: 'b', geometry: square(1, 0) },
			{ slug: 'c', geometry: null }
		]);
		expect(out.get('a')).toEqual(['b']);
		expect(out.get('c')).toEqual([]);
	});
});

describe('buildKiezNeighborLists', () => {
	it('sortiert Nachbarn nach Score absteigend und nennt Bezirk und Score', () => {
		const lists = buildKiezNeighborLists({
			lorFeatureCollection: GRID,
			bezirkCodeToName: BEZIRKE,
			scores: new Map([
				['beta', snapshot(40.4, 10)],
				['gamma', snapshot(61.6, 20)]
			])
		});
		expect(lists.get('alpha')?.neighbors).toEqual([
			{ slug: 'gamma', name: 'Gamma', bezirkName: 'Pankow', composite: 62 },
			{ slug: 'beta', name: 'Beta', bezirkName: 'Mitte', composite: 40 }
		]);
	});

	it('sortiert ohne Score nach Name und lässt die Ähnlichkeitsliste leer', () => {
		const lists = buildKiezNeighborLists({
			lorFeatureCollection: GRID,
			bezirkCodeToName: BEZIRKE,
			scores: new Map()
		});
		const alpha = lists.get('alpha');
		expect(alpha?.neighbors.map((n) => n.slug)).toEqual(['beta', 'gamma']);
		expect(alpha?.neighbors.every((n) => n.composite === null)).toBe(true);
		expect(alpha?.similar).toEqual([]);
	});

	it('setzt Kieze ohne Score ans Ende der Nachbarliste', () => {
		const lists = buildKiezNeighborLists({
			lorFeatureCollection: GRID,
			bezirkCodeToName: BEZIRKE,
			scores: new Map([['gamma', snapshot(30, 10)]])
		});
		expect(lists.get('alpha')?.neighbors.map((n) => n.slug)).toEqual(['gamma', 'beta']);
	});

	it('wählt die ähnlichsten Kieze ohne den eigenen und ohne Nachbarn', () => {
		const lists = buildKiezNeighborLists({
			lorFeatureCollection: GRID,
			bezirkCodeToName: BEZIRKE,
			scores: new Map([
				['alpha', snapshot(50, 50)],
				['beta', snapshot(50, 50)], // Nachbar, wäre ähnlichster
				['gamma', snapshot(50, 51)], // Nachbar
				['delta', snapshot(50, 60)],
				['epsilon', snapshot(50, 20)]
			])
		});
		const alpha = lists.get('alpha');
		expect(alpha?.neighbors.map((n) => n.slug)).toEqual(['beta', 'gamma']);
		expect(alpha?.similar.map((n) => n.slug)).toEqual(['delta', 'epsilon']);
	});

	it('begrenzt die Ähnlichkeitsliste auf 3 Einträge, nächster Abstand zuerst', () => {
		const features = ['A', 'B', 'C', 'D', 'E', 'F'].map((name, i) => ({
			properties: { BZR_NAME: name, BEZ: '01' },
			geometry: square(i * 10, 0)
		}));
		const scores = new Map(
			['a', 'b', 'c', 'd', 'e', 'f'].map((slug, i) => [slug, snapshot(50, 10 * i)] as const)
		);
		const lists = buildKiezNeighborLists({
			lorFeatureCollection: { features },
			bezirkCodeToName: BEZIRKE,
			scores
		});
		expect(lists.get('a')?.similar.map((n) => n.slug)).toEqual(['b', 'c', 'd']);
		expect(lists.get('d')?.similar.map((n) => n.slug)).toEqual(['c', 'e', 'b']);
	});

	it('übergeht Kieze mit fehlender Dimension bei der Ähnlichkeit', () => {
		const incomplete: KiezScoreSnapshot = {
			composite: 50,
			dims: { ruheLuft: null, gruenHitze: 1, mobilitaet: 1, versorgung: 1, wohnschutz: 1 }
		};
		const lists = buildKiezNeighborLists({
			lorFeatureCollection: GRID,
			bezirkCodeToName: BEZIRKE,
			scores: new Map([
				['alpha', snapshot(50, 1)],
				['delta', incomplete],
				['epsilon', snapshot(50, 2)]
			])
		});
		expect(lists.get('alpha')?.similar.map((n) => n.slug)).toEqual(['epsilon']);
	});

	it('trennt Dubletten über Bezirk-Suffix', () => {
		const lists = buildKiezNeighborLists({
			lorFeatureCollection: {
				features: [
					{ properties: { BZR_NAME: 'Heerstraße', BEZ: '01' }, geometry: square(0, 0) },
					{ properties: { BZR_NAME: 'Nord', BEZ: '01' }, geometry: square(1, 0) },
					{ properties: { BZR_NAME: 'Heerstraße', BEZ: '02' }, geometry: square(5, 5) },
					{ properties: { BZR_NAME: 'Sued', BEZ: '02' }, geometry: square(6, 5) }
				]
			},
			bezirkCodeToName: BEZIRKE,
			scores: new Map()
		});
		expect(lists.get('heerstrasse-mitte')?.neighbors.map((n) => n.slug)).toEqual(['nord']);
		expect(lists.get('heerstrasse-pankow')?.neighbors.map((n) => n.slug)).toEqual(['sued']);
		expect(lists.get('nord')?.neighbors[0]).toMatchObject({
			slug: 'heerstrasse-mitte',
			name: 'Heerstraße',
			bezirkName: 'Mitte'
		});
	});
});

describe('echte LOR-Daten', () => {
	async function loadLists() {
		const manifest = JSON.parse(
			await readFile(resolve(process.cwd(), 'static/layers/MANIFEST.json'), 'utf-8')
		) as Manifest;
		const read = async (slug: string) => {
			const layer = manifest.layers.find((l) => l.slug === slug);
			if (!layer) throw new Error(`${slug} fehlt im MANIFEST.json`);
			return JSON.parse(
				await readFile(resolve(process.cwd(), 'static/layers', layer.filename), 'utf-8')
			) as NeighborLorCollection;
		};
		const [lor, bezirke] = await Promise.all([read('lor-bezirksregion'), read('bezirke')]);
		const codeToName = new Map<string, string>();
		for (const f of bezirke.features) {
			const key = f.properties?.Schluessel_gesamt;
			const name = f.properties?.Gemeinde_name;
			if (typeof key === 'string' && typeof name === 'string') codeToName.set(key.slice(-2), name);
		}
		return buildKiezNeighborLists({
			lorFeatureCollection: lor,
			bezirkCodeToName: codeToName,
			scores: new Map()
		});
	}

	it('liefert für alle 143 Kieze mindestens einen Nachbarn, symmetrisch', async () => {
		const lists = await loadLists();
		expect(lists.size).toBe(143);
		for (const [slug, { neighbors }] of lists) {
			expect(neighbors.length, slug).toBeGreaterThan(0);
			for (const n of neighbors) {
				expect(
					lists.get(n.slug)?.neighbors.map((x) => x.slug),
					`${slug}<->${n.slug}`
				).toContain(slug);
			}
		}
	});

	it('reuterstrasse: vollständige Nachbarliste, auch in Friedrichshain-Kreuzberg', async () => {
		// Gegen die Geometrie geprüft: jeder dieser 6 Kieze teilt mit der Reuterstraße eine Kante
		// (2 bis 8 gemeinsame Stützpunkte); weitere Kontakte gibt es nicht.
		const lists = await loadLists();
		const neighbors = lists.get('reuterstrasse')?.neighbors ?? [];
		expect(neighbors.map((n) => n.slug).sort()).toEqual([
			'alt-treptow',
			'neukoellner-mitte-zentrum',
			'rixdorf',
			'schillerpromenade',
			'suedliche-luisenstadt',
			'tempelhofer-vorstadt'
		]);
		expect(neighbors.some((n) => normalizeSlug(n.bezirkName) === 'friedrichshain-kreuzberg')).toBe(
			true
		);
	});

	it('heerstrasse-spandau hat eigene Nachbarn, nicht die von Heerstraße in Charlottenburg', async () => {
		const lists = await loadLists();
		const spandau = lists.get('heerstrasse-spandau')?.neighbors.map((n) => n.slug) ?? [];
		const charlottenburg =
			lists.get('heerstrasse-charlottenburg-wilmersdorf')?.neighbors.map((n) => n.slug) ?? [];
		expect(spandau.length).toBeGreaterThan(0);
		expect(charlottenburg.length).toBeGreaterThan(0);
		expect(spandau).not.toEqual(charlottenburg);
		expect(spandau).not.toContain('heerstrasse-charlottenburg-wilmersdorf');
	});
});
