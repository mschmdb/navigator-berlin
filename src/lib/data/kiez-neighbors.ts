/**
 * L6: Nachbar- und ähnliche Kieze.
 *
 * Nachbarschaft entsteht aus den LOR-Polygonen: Zwei Kieze grenzen aneinander,
 * wenn ihre gemeinsame Grenze mindestens 1 m lang ist. Eine reine
 * Eckberührung zählt nicht.
 * Ähnlichkeit: euklidischer Abstand der fünf Score-Dimensionen.
 * Reine Funktionen, kein DB- oder Dateizugriff. Der Server-Load cacht das Ergebnis.
 */

import { buildKiezSlugs } from './internal/kiez-slug.js';

export const SIMILARITY_DIMENSIONS = [
	'ruheLuft',
	'gruenHitze',
	'mobilitaet',
	'versorgung',
	'wohnschutz'
] as const;

export type SimilarityDimension = (typeof SIMILARITY_DIMENSIONS)[number];

export const SIMILAR_KIEZE_COUNT = 3;
/** ~0,1 m in Grad. */
const TOLERANCE = 1e-6;
const CELL_SIZE = 0.002;
const METERS_PER_DEGREE = 111_320;
const MIN_SHARED_BORDER_M = 1;

export interface KiezScoreSnapshot {
	readonly composite: number;
	readonly dims: Readonly<Record<SimilarityDimension, number | null>>;
}

export interface NeighborEntry {
	readonly slug: string;
	readonly name: string;
	readonly bezirkName: string;
	/** Gerundeter Kiez-Score 0-100, `null` ohne Score-Daten. */
	readonly composite: number | null;
}

export interface KiezNeighborLists {
	readonly neighbors: readonly NeighborEntry[];
	readonly similar: readonly NeighborEntry[];
}

interface NeighborGeometry {
	readonly type: string;
	readonly coordinates?: unknown;
}

export interface NeighborLorCollection {
	readonly features: readonly {
		readonly properties?: Record<string, unknown> | null;
		readonly geometry?: NeighborGeometry | null;
	}[];
}

export interface BuildKiezNeighborInput {
	readonly lorFeatureCollection: NeighborLorCollection;
	/** LOR-`BEZ`-Code -> Bezirk-Name (Gemeinde_name). */
	readonly bezirkCodeToName: ReadonlyMap<string, string>;
	readonly scores: ReadonlyMap<string, KiezScoreSnapshot>;
}

type Point = readonly [number, number];
interface Segment {
	readonly owner: number;
	readonly a: Point;
	readonly b: Point;
}

function isPoint(node: unknown): node is Point {
	return Array.isArray(node) && typeof node[0] === 'number' && typeof node[1] === 'number';
}

function collectRings(node: unknown, rings: Point[][]): void {
	if (!Array.isArray(node)) return;
	if (node.length > 0 && isPoint(node[0])) {
		rings.push(node.filter(isPoint));
		return;
	}
	for (const child of node) collectRings(child, rings);
}

function ringsOf(geometry: NeighborGeometry | null | undefined): Point[][] {
	const rings: Point[][] = [];
	if (geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon') {
		collectRings(geometry.coordinates, rings);
	}
	return rings;
}

function cellKey(x: number, y: number): string {
	return `${Math.floor(x / CELL_SIZE)}:${Math.floor(y / CELL_SIZE)}`;
}

function distanceToSegment(p: Point, seg: Segment): number {
	const [px, py] = p;
	const [ax, ay] = seg.a;
	const [bx, by] = seg.b;
	const dx = bx - ax;
	const dy = by - ay;
	const lenSq = dx * dx + dy * dy;
	const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
	return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function lengthInMeters(a: Point, b: Point): number {
	const dx = (b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180) * METERS_PER_DEGREE;
	const dy = (b[1] - a[1]) * METERS_PER_DEGREE;
	return Math.hypot(dx, dy);
}

/**
 * Nachbarschaftsgraph: Slug -> Slugs der angrenzenden Kieze (symmetrisch).
 * Ein Kiez-Segment gilt als gemeinsame Grenze, wenn Anfang, Mitte und Ende auf
 * der Grenze eines anderen Kiezes liegen (Toleranz ~0,1 m). Das erfasst auch
 * Kanten mit versetzten Stützpunkten (T-Stoß). Ab 1 m gemeinsamer Grenze
 * gelten zwei Kieze als Nachbarn, reine Eckkontakte zählen nicht.
 */
export function findNeighborSlugs(
	regions: readonly { readonly slug: string; readonly geometry?: NeighborGeometry | null }[]
): Map<string, string[]> {
	const segments: Segment[] = [];
	regions.forEach((region, owner) => {
		for (const ring of ringsOf(region.geometry)) {
			for (let i = 0; i + 1 < ring.length; i++) {
				segments.push({ owner, a: ring[i], b: ring[i + 1] });
			}
		}
	});

	const grid = new Map<string, Segment[]>();
	for (const seg of segments) {
		const x0 = Math.floor((Math.min(seg.a[0], seg.b[0]) - TOLERANCE) / CELL_SIZE);
		const x1 = Math.floor((Math.max(seg.a[0], seg.b[0]) + TOLERANCE) / CELL_SIZE);
		const y0 = Math.floor((Math.min(seg.a[1], seg.b[1]) - TOLERANCE) / CELL_SIZE);
		const y1 = Math.floor((Math.max(seg.a[1], seg.b[1]) + TOLERANCE) / CELL_SIZE);
		for (let x = x0; x <= x1; x++) {
			for (let y = y0; y <= y1; y++) {
				const key = `${x}:${y}`;
				const list = grid.get(key);
				if (list) list.push(seg);
				else grid.set(key, [seg]);
			}
		}
	}

	/** Besitzer außer `self`, auf deren Grenze der Punkt liegt. */
	const ownersAt = (p: Point, self: number): Set<number> => {
		const found = new Set<number>();
		for (const seg of grid.get(cellKey(p[0], p[1])) ?? []) {
			if (seg.owner !== self && !found.has(seg.owner) && distanceToSegment(p, seg) <= TOLERANCE) {
				found.add(seg.owner);
			}
		}
		return found;
	};

	const shared = regions.map(() => new Map<number, number>());
	for (const seg of segments) {
		const onA = ownersAt(seg.a, seg.owner);
		if (onA.size === 0) continue;
		const onB = ownersAt(seg.b, seg.owner);
		if (onB.size === 0) continue;
		const mid: Point = [(seg.a[0] + seg.b[0]) / 2, (seg.a[1] + seg.b[1]) / 2];
		const onMid = ownersAt(mid, seg.owner);
		const length = lengthInMeters(seg.a, seg.b);
		for (const other of onA) {
			if (!onB.has(other) || !onMid.has(other)) continue;
			shared[seg.owner].set(other, (shared[seg.owner].get(other) ?? 0) + length);
		}
	}

	const result = new Map<string, string[]>();
	regions.forEach((region, i) => {
		const slugs: string[] = [];
		regions.forEach((other, j) => {
			if (i === j) return;
			const length = Math.max(shared[i].get(j) ?? 0, shared[j].get(i) ?? 0);
			if (length >= MIN_SHARED_BORDER_M) slugs.push(other.slug);
		});
		result.set(region.slug, slugs);
	});
	return result;
}

function similarityVector(snapshot: KiezScoreSnapshot | undefined): number[] | null {
	if (!snapshot) return null;
	const values: number[] = [];
	for (const key of SIMILARITY_DIMENSIONS) {
		const v = snapshot.dims[key];
		if (typeof v !== 'number' || !Number.isFinite(v)) return null;
		values.push(v);
	}
	return values;
}

function distance(a: readonly number[], b: readonly number[]): number {
	let sum = 0;
	for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
	return Math.sqrt(sum);
}

function byScoreThenName(a: NeighborEntry, b: NeighborEntry): number {
	if (a.composite !== null && b.composite !== null && a.composite !== b.composite) {
		return b.composite - a.composite;
	}
	if (a.composite !== null && b.composite === null) return -1;
	if (a.composite === null && b.composite !== null) return 1;
	return a.name.localeCompare(b.name, 'de');
}

function readBezirkCode(props: Record<string, unknown>): string | null {
	const bez = props.BEZ;
	if (typeof bez === 'string' && bez.length > 0) return bez;
	if (typeof bez === 'number') return String(bez).padStart(2, '0');
	return null;
}

export function buildKiezNeighborLists(
	input: BuildKiezNeighborInput
): Map<string, KiezNeighborLists> {
	const candidates = input.lorFeatureCollection.features.flatMap((feature) => {
		const props = feature.properties ?? {};
		const name = typeof props.BZR_NAME === 'string' ? props.BZR_NAME : null;
		const code = readBezirkCode(props);
		if (!name || !code) return [];
		return [{ name, bezirk: input.bezirkCodeToName.get(code) ?? '', geometry: feature.geometry }];
	});
	const slugs = buildKiezSlugs(candidates);
	const entries = new Map<string, NeighborEntry>();
	const regions = candidates.map((c, i) => {
		const composite = input.scores.get(slugs[i])?.composite;
		entries.set(slugs[i], {
			slug: slugs[i],
			name: c.name,
			bezirkName: c.bezirk,
			composite: typeof composite === 'number' ? Math.round(composite) : null
		});
		return { slug: slugs[i], geometry: c.geometry };
	});

	const graph = findNeighborSlugs(regions);
	const vectors = new Map<string, number[]>();
	for (const slug of entries.keys()) {
		const vector = similarityVector(input.scores.get(slug));
		if (vector) vectors.set(slug, vector);
	}

	const lists = new Map<string, KiezNeighborLists>();
	for (const [slug, neighborSlugs] of graph) {
		const neighbors = neighborSlugs
			.map((s) => entries.get(s))
			.filter((e): e is NeighborEntry => e !== undefined)
			.sort(byScoreThenName);
		const own = vectors.get(slug);
		const excluded = new Set([slug, ...neighborSlugs]);
		const similar = own
			? [...vectors]
					.filter(([other]) => !excluded.has(other))
					.map(([other, vector]) => ({ other, d: distance(own, vector) }))
					.sort((a, b) => a.d - b.d || a.other.localeCompare(b.other))
					.slice(0, SIMILAR_KIEZE_COUNT)
					.flatMap(({ other }) => {
						const entry = entries.get(other);
						return entry ? [entry] : [];
					})
			: [];
		lists.set(slug, { neighbors, similar });
	}
	return lists;
}
