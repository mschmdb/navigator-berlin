import RBush from 'rbush';
import area from '@turf/area';
import bbox from '@turf/bbox';
import center from '@turf/center';
import intersect from '@turf/intersect';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { featureCollection } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { normalizeSlug } from '../../../src/lib/data/internal/slug.js';
import type { LorHierarchy } from '../kiez-score/lor-hierarchy.js';

export type CellValue = string | number | null;

export interface LevelValues {
	readonly kiez: Map<string, CellValue[]>;
	readonly bezirk: Map<string, CellValue[]>;
	readonly berlin: CellValue[];
}

export interface TargetPolygon {
	readonly slug: string;
	readonly feature: Feature<Polygon | MultiPolygon>;
	readonly areaM2: number;
}

export interface SpatialTargets {
	readonly kiez: readonly TargetPolygon[];
	readonly bezirk: readonly TargetPolygon[];
	readonly berlinAreaM2: number;
}

function readProp(f: Feature, key: string): CellValue {
	const v = (f.properties ?? {})[key];
	if (typeof v === 'string') return v;
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	return null;
}

/**
 * PLR-keyed Layer (542 Features mit `plr_id`): Member-Werte je Ziel via LOR-Hierarchie
 * (Prefix-Mapping), KEIN Spatial-Containment nötig.
 */
export function collectPlrValues(
	features: readonly Feature[],
	valueKey: string,
	hierarchy: LorHierarchy
): LevelValues {
	const valueByPlr = new Map<string, CellValue>();
	for (const f of features) {
		const plrId = (f.properties ?? {})['plr_id'];
		if (typeof plrId === 'string') valueByPlr.set(plrId, readProp(f, valueKey));
	}

	const kiez = new Map<string, CellValue[]>();
	for (const br of hierarchy.bezirksregionen) {
		kiez.set(
			br.slug,
			br.planungsraeume.map((p) => valueByPlr.get(p.plrId) ?? null)
		);
	}
	const bezirk = new Map<string, CellValue[]>();
	for (const b of hierarchy.bezirke) {
		bezirk.set(
			b.slug,
			b.planungsraeume.map((p) => valueByPlr.get(p.plrId) ?? null)
		);
	}
	const berlin = [...valueByPlr.values()];
	return { kiez, bezirk, berlin };
}

/** Ziel-Polygone (Kiez/Bezirk) mit Slug + Fläche; Slugs konsistent zur Kiez-Score-Hierarchie. */
export function buildSpatialTargets(
	brFeatures: readonly Feature[],
	bezFeatures: readonly Feature[],
	hierarchy: LorHierarchy
): SpatialTargets {
	const slugByBzrId = new Map<string, string>();
	for (const br of hierarchy.bezirksregionen) slugByBzrId.set(br.bzrId, br.slug);

	const kiez: TargetPolygon[] = [];
	for (const f of brFeatures) {
		const bzrId = (f.properties ?? {})['BZR_ID'];
		if (typeof bzrId !== 'string') continue;
		const slug = slugByBzrId.get(bzrId);
		if (!slug) continue;
		kiez.push({
			slug,
			feature: f as Feature<Polygon | MultiPolygon>,
			areaM2: area(f)
		});
	}

	const bezirk: TargetPolygon[] = [];
	let berlinAreaM2 = 0;
	for (const f of bezFeatures) {
		const name = (f.properties ?? {})['Gemeinde_name'];
		if (typeof name !== 'string') continue;
		const a = area(f);
		berlinAreaM2 += a;
		bezirk.push({ slug: normalizeSlug(name), feature: f as Feature<Polygon | MultiPolygon>, areaM2: a });
	}

	return { kiez, bezirk, berlinAreaM2 };
}

interface IndexItem {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	idx: number;
}

function buildBboxIndex(features: readonly Feature[]): RBush<IndexItem> {
	const tree = new RBush<IndexItem>();
	const items: IndexItem[] = features.map((f, idx) => {
		const [minX, minY, maxX, maxY] = bbox(f);
		return { minX, minY, maxX, maxY, idx };
	});
	if (items.length > 0) tree.load(items);
	return tree;
}

/**
 * Numeric-/Ordinal-Layer mit freier Geometrie: Member = Source-Features deren
 * Repräsentativ-Punkt im Ziel-Polygon liegt. RBush-bbox-Prefilter über Ziele.
 */
export function collectSpatialPointValues(
	sourceFeatures: readonly Feature[],
	valueKey: string,
	targets: readonly TargetPolygon[]
): Map<string, CellValue[]> {
	const result = new Map<string, CellValue[]>();
	for (const t of targets) result.set(t.slug, []);

	const targetIndex = buildBboxIndex(targets.map((t) => t.feature));
	for (const sf of sourceFeatures) {
		const pt = center(sf);
		const [lng, lat] = pt.geometry.coordinates;
		const candidates = targetIndex.search({ minX: lng, minY: lat, maxX: lng, maxY: lat });
		for (const cand of candidates) {
			const t = targets[cand.idx];
			if (booleanPointInPolygon(pt, t.feature)) {
				result.get(t.slug)!.push(readProp(sf, valueKey));
				break;
			}
		}
	}
	return result;
}

/**
 * Coverage-/Area-Layer: Summe der Intersect-Flächen der Source-Features je Ziel-Polygon (m²).
 * RBush-bbox-Prefilter über Source-Features.
 */
export function collectIntersectArea(
	sourceFeatures: readonly Feature[],
	targets: readonly TargetPolygon[]
): Map<string, number> {
	const result = new Map<string, number>();
	for (const t of targets) result.set(t.slug, 0);

	const sourceIndex = buildBboxIndex(sourceFeatures);
	for (const t of targets) {
		const [minX, minY, maxX, maxY] = bbox(t.feature);
		const candidates = sourceIndex.search({ minX, minY, maxX, maxY });
		let hitArea = 0;
		for (const cand of candidates) {
			const sf = sourceFeatures[cand.idx];
			const geom = sf.geometry;
			if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') continue;
			const clip = intersect(
				featureCollection([t.feature, sf as Feature<Polygon | MultiPolygon>])
			);
			if (clip) hitArea += area(clip);
		}
		result.set(t.slug, hitArea);
	}
	return result;
}
