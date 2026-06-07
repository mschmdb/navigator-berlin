import type { Feature, FeatureCollection, Point, LineString, Polygon } from 'geojson';

interface OverpassNode {
	type: 'node';
	id: number;
	lat: number;
	lon: number;
	tags?: Record<string, string>;
}

interface OverpassWay {
	type: 'way';
	id: number;
	nodes?: number[];
	geometry?: Array<{ lat: number; lon: number }>;
	/** Von `out center;` geliefert: Schwerpunkt einer Flächen-Geometrie ohne volle Geometrie. */
	center?: { lat: number; lon: number };
	tags?: Record<string, string>;
}

interface OverpassRelation {
	type: 'relation';
	id: number;
	members?: Array<{ type: string; ref: number; role: string; geometry?: Array<{ lat: number; lon: number }> }>;
	center?: { lat: number; lon: number };
	tags?: Record<string, string>;
}

type OverpassElement = OverpassNode | OverpassWay | OverpassRelation;

interface OverpassResponse {
	version?: number;
	generator?: string;
	elements?: OverpassElement[];
}

function nodeToFeature(node: OverpassNode): Feature<Point> {
	return {
		type: 'Feature',
		id: node.id,
		properties: { osmId: node.id, osmType: 'node', ...(node.tags ?? {}) },
		geometry: { type: 'Point', coordinates: [node.lon, node.lat] }
	};
}

function wayToFeature(way: OverpassWay): Feature<LineString | Polygon> | null {
	if (!way.geometry || way.geometry.length < 2) return null;
	const coords = way.geometry.map((p) => [p.lon, p.lat] as [number, number]);
	const first = coords[0];
	const last = coords[coords.length - 1];
	const closed = coords.length >= 4 && first[0] === last[0] && first[1] === last[1];
	const tags = way.tags ?? {};
	const properties = { osmId: way.id, osmType: 'way', ...tags };
	// OSM-Spec: closed way ist Polygon nur bei explizitem area=yes oder Polygon-Tags
	// (building, landuse, leisure, natural=water etc.). Andernfalls LineString
	// (z.B. Ringbahn-Tracks haben geschlossene Geometrie, sind aber Linien).
	const isExplicitArea = tags.area === 'yes' || polygonImplyingTag(tags);
	if (closed && isExplicitArea) {
		return {
			type: 'Feature',
			id: way.id,
			properties,
			geometry: { type: 'Polygon', coordinates: [coords] }
		};
	}
	return {
		type: 'Feature',
		id: way.id,
		properties,
		geometry: { type: 'LineString', coordinates: coords }
	};
}

const POLYGON_TAGS: ReadonlySet<string> = new Set([
	'building',
	'landuse',
	'leisure',
	'amenity',
	'natural'
]);

function polygonImplyingTag(tags: Record<string, string>): boolean {
	for (const key of POLYGON_TAGS) {
		if (tags[key]) return true;
	}
	return false;
}

/**
 * `out center;` liefert für Ways/Relations einen Schwerpunkt statt voller Geometrie.
 * Für Dichte-/POI-Layer (z.B. Nahversorgung) sind die als Buildings gemappten Ways
 * sonst verloren. Wir geben sie als Point am Center aus.
 */
function centerToFeature(el: {
	id: number;
	type: 'way' | 'relation';
	center?: { lat: number; lon: number };
	tags?: Record<string, string>;
}): Feature<Point> | null {
	if (!el.center) return null;
	return {
		type: 'Feature',
		id: el.id,
		properties: { osmId: el.id, osmType: el.type, ...(el.tags ?? {}) },
		geometry: { type: 'Point', coordinates: [el.center.lon, el.center.lat] }
	};
}

export function overpassToGeoJSON(input: unknown): FeatureCollection {
	const data = input as OverpassResponse;
	if (!data || !Array.isArray(data.elements)) {
		return { type: 'FeatureCollection', features: [] };
	}
	const features: Feature[] = [];
	for (const el of data.elements) {
		if (el.type === 'node') {
			features.push(nodeToFeature(el));
		} else if (el.type === 'way') {
			const f = wayToFeature(el) ?? centerToFeature(el);
			if (f) features.push(f);
		} else if (el.type === 'relation') {
			// Relations nur mit `center` (out center) als Punkt; sonst ignoriert.
			const f = centerToFeature(el);
			if (f) features.push(f);
		}
	}
	return { type: 'FeatureCollection', features };
}

export function isOverpassResponse(input: unknown): boolean {
	if (!input || typeof input !== 'object') return false;
	const d = input as Record<string, unknown>;
	return Array.isArray(d.elements) && (typeof d.generator === 'string' || 'osm3s' in d);
}
