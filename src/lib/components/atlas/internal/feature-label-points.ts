/**
 * Ein Label-Punkt pro Polygon-Feature, fürs Platzieren der Score-Punktsymbole.
 *
 * MapLibre kachelt GeoJSON intern; Symbol-Layer auf Polygon-Quellen setzen bei
 * hohem Zoom ein Symbol PRO TILE-FRAGMENT, also mehrere Punkte pro Fläche.
 * Eine echte Punkt-Quelle mit einem berechneten Punkt je Feature macht die
 * Platzierung zoom-unabhängig eindeutig.
 */

import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon, Position } from 'geojson';

/** Flächen-gewichteter Schwerpunkt eines Rings (Shoelace). */
function ringCentroid(ring: readonly Position[]): { x: number; y: number; area: number } {
	let doubleArea = 0;
	let cx = 0;
	let cy = 0;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
		doubleArea += cross;
		cx += (ring[j][0] + ring[i][0]) * cross;
		cy += (ring[j][1] + ring[i][1]) * cross;
	}
	if (doubleArea === 0) {
		return { x: ring[0][0], y: ring[0][1], area: 0 };
	}
	return {
		x: cx / (3 * doubleArea),
		y: cy / (3 * doubleArea),
		area: Math.abs(doubleArea / 2)
	};
}

function largestOuterRing(feature: Feature<Polygon | MultiPolygon>): readonly Position[] {
	const polygons =
		feature.geometry.type === 'Polygon'
			? [feature.geometry.coordinates]
			: feature.geometry.coordinates;
	let best: readonly Position[] = polygons[0][0];
	let bestArea = -1;
	for (const rings of polygons) {
		const { area } = ringCentroid(rings[0]);
		if (area > bestArea) {
			bestArea = area;
			best = rings[0];
		}
	}
	return best;
}

/**
 * Punkt im Inneren der Fläche: Schwerpunkt des größten Außenrings; liegt er
 * außerhalb (konkave Form), Mittelpunkte der Ring-Sehnen testen, zuletzt der
 * erste Ring-Punkt als garantierter Rückfall.
 */
function labelPoint(feature: Feature<Polygon | MultiPolygon>): Position {
	const ring = largestOuterRing(feature);
	const centroid = ringCentroid(ring);
	const candidate: Position = [centroid.x, centroid.y];
	if (booleanPointInPolygon(candidate, feature)) return candidate;
	for (let i = 0; i < ring.length - 1; i++) {
		const mid: Position = [(ring[i][0] + centroid.x) / 2, (ring[i][1] + centroid.y) / 2];
		if (booleanPointInPolygon(mid, feature)) return mid;
	}
	return [ring[0][0], ring[0][1]];
}

export function featureLabelPoints(fc: FeatureCollection): FeatureCollection<Point> {
	const features: Feature<Point>[] = [];
	for (const feature of fc.features) {
		if (feature.geometry?.type !== 'Polygon' && feature.geometry?.type !== 'MultiPolygon') {
			continue;
		}
		features.push({
			type: 'Feature',
			properties: feature.properties ?? {},
			geometry: {
				type: 'Point',
				coordinates: labelPoint(feature as Feature<Polygon | MultiPolygon>)
			}
		});
	}
	return { type: 'FeatureCollection', features };
}
