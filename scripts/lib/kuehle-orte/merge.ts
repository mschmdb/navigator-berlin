import type { Feature, FeatureCollection, Point } from 'geojson';
import { buildNaviLinks } from './navi-links.js';

/**
 * Story 15.1: Merge der redaktionellen Anreicherung (enrichment.json) mit der OSM-Geometrie
 * (places-osm.json) per `id` zu einem GeoJSON-FeatureCollection. Filtert ungeeignete
 * (suitable=false) und nicht mehr existierende (still_exists=no) Orte mit Zählung je Grund.
 * Reines Modul, kein I/O. Determinismus: Reihenfolge folgt dem Enrichment-Array.
 */

export interface EnrichmentItem {
	id: string;
	name: string;
	cat: string;
	suitable: boolean;
	suitable_reason: string;
	cool_score: number;
	ac_status: string;
	is_free: string;
	summer_available: string;
	opening_hours_note: string;
	address_verified: string;
	website: string;
	still_exists: string;
	notes: string;
}

export interface PlaceItem {
	id: string;
	lat: number;
	lon: number;
	addr: string;
	plz: string;
	oh: string;
	wheelchair: string;
}

export interface KuehleOrtProperties {
	id: string;
	name: string;
	cat: string;
	cool_score: number;
	ac_status: string;
	is_free: string;
	summer_available: string;
	opening_hours_note: string;
	address_verified: string;
	website: string;
	suitable_reason: string;
	notes: string;
	oh: string;
	wheelchair: string;
	plz: string;
	googleMapsUrl: string;
	appleMapsUrl: string;
}

export interface DroppedCounts {
	suitableFalse: number;
	stillExistsNo: number;
	missingGeometry: number;
}

export interface MergeResult {
	collection: FeatureCollection<Point, KuehleOrtProperties>;
	dropped: DroppedCounts;
}

function hasNumericCoords(place: PlaceItem | undefined): place is PlaceItem {
	return (
		place !== undefined && Number.isFinite(place.lat) && Number.isFinite(place.lon)
	);
}

export function mergeKuehleOrte(
	enrichment: EnrichmentItem[],
	places: PlaceItem[]
): MergeResult {
	const placeById = new Map(places.map((p) => [p.id, p]));
	const dropped: DroppedCounts = { suitableFalse: 0, stillExistsNo: 0, missingGeometry: 0 };
	const features: Feature<Point, KuehleOrtProperties>[] = [];

	for (const e of enrichment) {
		// Präzedenz: jeder Wegfall zählt genau einmal, kein Doppelabzug bei Überschneidung.
		if (e.suitable === false) {
			dropped.suitableFalse += 1;
			continue;
		}
		if (e.still_exists === 'no') {
			dropped.stillExistsNo += 1;
			continue;
		}
		const place = placeById.get(e.id);
		if (!hasNumericCoords(place)) {
			dropped.missingGeometry += 1;
			continue;
		}
		const navi = buildNaviLinks(place.lat, place.lon);
		features.push({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [place.lon, place.lat] },
			properties: {
				id: e.id,
				name: e.name,
				cat: e.cat,
				cool_score: e.cool_score,
				ac_status: e.ac_status,
				is_free: e.is_free,
				summer_available: e.summer_available,
				opening_hours_note: e.opening_hours_note,
				address_verified: e.address_verified,
				website: e.website,
				suitable_reason: e.suitable_reason,
				notes: e.notes,
				oh: place.oh,
				wheelchair: place.wheelchair,
				plz: place.plz,
				googleMapsUrl: navi.googleMapsUrl,
				appleMapsUrl: navi.appleMapsUrl
			}
		});
	}

	return {
		collection: { type: 'FeatureCollection', features },
		dropped
	};
}
