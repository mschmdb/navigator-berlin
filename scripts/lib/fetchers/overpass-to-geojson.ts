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
	tags?: Record<string, string>;
}

interface OverpassRelation {
	type: 'relation';
	id: number;
	members?: Array<{ type: string; ref: number; role: string; geometry?: Array<{ lat: number; lon: number }> }>;
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
	const properties = { osmId: way.id, osmType: 'way', ...(way.tags ?? {}) };
	if (closed) {
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
			const f = wayToFeature(el);
			if (f) features.push(f);
		}
		// Relations werden in Phase 1 ignoriert (Stolpersteine/Trinkbrunnen sind Nodes).
	}
	return { type: 'FeatureCollection', features };
}

export function isOverpassResponse(input: unknown): boolean {
	if (!input || typeof input !== 'object') return false;
	const d = input as Record<string, unknown>;
	return Array.isArray(d.elements) && (typeof d.generator === 'string' || 'osm3s' in d);
}
