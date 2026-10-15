import RBush from 'rbush';
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { MieteCell } from './parse-miete-csv.js';
import { addCell, createAccumulator, type MieteAccumulator } from './weighted-mean.js';

interface IndexItem {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	idx: number;
}

export interface AccumulateResult {
	readonly byPlr: Map<string, MieteAccumulator>;
	/** Zellen, deren Mittelpunkt in keinem Planungsraum liegt. */
	readonly outside: number;
}

/**
 * Ordnet Gitterzellen per Mittelpunkt (Point-in-Polygon) den Planungsraeumen zu und
 * summiert Wohnungen und Miete x Wohnungen. `project` wandelt EPSG:3035 nach WGS84.
 */
export function accumulateByPlr<C extends { x: number; y: number } = MieteCell>(
	cells: readonly C[],
	plrFeatures: readonly Feature<Polygon | MultiPolygon>[],
	project: (x: number, y: number) => [number, number],
	add: (acc: MieteAccumulator, cell: C) => void = (acc, cell) => {
		const m = cell as unknown as MieteCell;
		addCell(acc, m.mieteQm, m.wohnungen, m.klammern);
	}
): AccumulateResult {
	const byPlr = new Map<string, MieteAccumulator>();
	const ids = plrFeatures.map((f) => {
		const id = (f.properties ?? {})['PLR_ID'];
		if (typeof id !== 'string') throw new Error('Planungsraum ohne PLR_ID');
		byPlr.set(id, createAccumulator());
		return id;
	});

	const tree = new RBush<IndexItem>();
	tree.load(
		plrFeatures.map((f, idx) => {
			const [minX, minY, maxX, maxY] = bbox(f);
			return { minX, minY, maxX, maxY, idx };
		})
	);

	let outside = 0;
	for (const cell of cells) {
		const [lon, lat] = project(cell.x, cell.y);
		const pt = point([lon, lat]);
		const hit = tree
			.search({ minX: lon, minY: lat, maxX: lon, maxY: lat })
			.find((c) => booleanPointInPolygon(pt, plrFeatures[c.idx]));
		if (!hit) {
			outside++;
			continue;
		}
		add(byPlr.get(ids[hit.idx])!, cell);
	}
	return { byPlr, outside };
}
