import type { Feature, FeatureCollection, Point } from 'geojson';
import { buildNaviLinks } from '../kuehle-orte/navi-links.js';
import { compareIds } from './enrichment.js';
import { classifyPlace, type ExcludeReason } from './filter.js';
import type { OsmPlace, WaermeEnrichment } from './types.js';

/**
 * Wärme-Orte (#61): Merge von OSM-Snapshot und redaktioneller Winter-Anreicherung per `id`.
 * Reines Modul, kein I/O. Ausgabe nach id sortiert, damit der Build deterministisch bleibt.
 * Waisen (Enrichment ohne OSM-Kandidat) lassen den Merge abbrechen.
 */

const PH_RULE = /\bPH\b/;
const PH_OFF = /\bPH\s+off\b/;

/** Ergänzt `PH off` aus OSM, wenn die Recherche-Zeiten keine Feiertagsregel nennen. */
export function withOsmPublicHolidayOff(ohRecherche: string, osmOh: string): string {
	if (!ohRecherche || ohRecherche === 'unklar') return ohRecherche;
	if (PH_RULE.test(ohRecherche) || !PH_OFF.test(osmOh)) return ohRecherche;
	return `${ohRecherche}; PH off`;
}

export interface WaermeOrtProperties {
	id: string;
	name: string;
	cat: string;
	winter_open: string;
	opening_hours_note: string;
	oh_recherche: string;
	stay_without_purchase: string;
	is_free: string;
	website: string;
	source_url: string;
	checked_at: string;
	suitable_reason: string;
	addr: string;
	plz: string;
	oh: string;
	wheelchair: string;
	googleMapsUrl: string;
	appleMapsUrl: string;
}

export interface WaermeDroppedCounts {
	osmFiltered: Partial<Record<ExcludeReason, number>>;
	suitableFalse: number;
	stillExistsNo: number;
	missingGeometry: number;
	duplicates: number;
}

export interface WaermeMergeResult {
	collection: FeatureCollection<Point, WaermeOrtProperties>;
	dropped: WaermeDroppedCounts;
	/** OSM-Kandidaten ohne Enrichment-Eintrag */
	missingEnrichment: string[];
}

const DUPLICATE_RADIUS_METERS = 75;

function distanceMeters(a: [number, number], b: [number, number]): number {
	const rad = Math.PI / 180;
	const dLat = (b[1] - a[1]) * rad;
	const dLon = (b[0] - a[0]) * rad;
	const h =
		Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
	return 2 * 6371008.8 * Math.asin(Math.sqrt(h));
}

/**
 * Entfernt Dubletten (Node und Way desselben Ortes): gleicher normalisierter Name und
 * Abstand unter 75 m. Bevorzugt belegte `winter_open`, dann die kleinste id.
 */
function dedupe(features: Feature<Point, WaermeOrtProperties>[]): {
	kept: Feature<Point, WaermeOrtProperties>[];
	duplicates: number;
} {
	const ranked = [...features].sort((a, b) => {
		const aKnown = a.properties.winter_open !== 'unknown' ? 0 : 1;
		const bKnown = b.properties.winter_open !== 'unknown' ? 0 : 1;
		return aKnown - bKnown || compareIds(a.properties.id, b.properties.id);
	});
	const kept: Feature<Point, WaermeOrtProperties>[] = [];
	for (const feature of ranked) {
		const name = feature.properties.name.trim().toLowerCase();
		const isDuplicate =
			name !== '' &&
			kept.some(
				(other) =>
					other.properties.name.trim().toLowerCase() === name &&
					distanceMeters(
						other.geometry.coordinates as [number, number],
						feature.geometry.coordinates as [number, number]
					) < DUPLICATE_RADIUS_METERS
			);
		if (!isDuplicate) kept.push(feature);
	}
	kept.sort((a, b) => compareIds(a.properties.id, b.properties.id));
	return { kept, duplicates: features.length - kept.length };
}

function hasNumericCoords(place: OsmPlace): boolean {
	return Number.isFinite(place.lat) && Number.isFinite(place.lon);
}

export function mergeWaermeOrte(
	enrichment: WaermeEnrichment[],
	places: OsmPlace[]
): WaermeMergeResult {
	const dropped: WaermeDroppedCounts = {
		osmFiltered: {},
		suitableFalse: 0,
		stillExistsNo: 0,
		missingGeometry: 0,
		duplicates: 0
	};
	const candidates = new Map<string, OsmPlace>();
	for (const place of places) {
		const result = classifyPlace(place);
		if (result.candidate) {
			candidates.set(place.id, place);
		} else {
			dropped.osmFiltered[result.reason] = (dropped.osmFiltered[result.reason] ?? 0) + 1;
		}
	}

	const orphans = enrichment.filter((e) => !candidates.has(e.id)).map((e) => e.id);
	if (orphans.length > 0) {
		throw new Error(
			`${orphans.length} Waisen in enrichment.json ohne OSM-Kandidat: ${orphans.join(', ')}`
		);
	}

	const enrichedIds = new Set(enrichment.map((e) => e.id));
	const missingEnrichment = [...candidates.keys()].filter((id) => !enrichedIds.has(id)).sort();

	const features: Feature<Point, WaermeOrtProperties>[] = [];
	const sorted = [...enrichment].sort((a, b) => compareIds(a.id, b.id));
	for (const e of sorted) {
		// Präzedenz: jeder Wegfall zählt genau einmal.
		if (e.suitable === false) {
			dropped.suitableFalse += 1;
			continue;
		}
		if (e.still_exists === 'no') {
			dropped.stillExistsNo += 1;
			continue;
		}
		const place = candidates.get(e.id) as OsmPlace;
		if (!hasNumericCoords(place)) {
			dropped.missingGeometry += 1;
			continue;
		}
		const navi = buildNaviLinks(place.lat, place.lon, {
			name: e.name?.trim() || place.name,
			street: place.addr,
			plz: place.plz
		});
		features.push({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [place.lon, place.lat] },
			properties: {
				id: e.id,
				name: e.name || place.name,
				cat: e.cat,
				winter_open: e.winter_open,
				opening_hours_note: e.opening_hours_note,
				oh_recherche: withOsmPublicHolidayOff(e.oh_recherche ?? '', place.oh),
				stay_without_purchase: e.stay_without_purchase,
				is_free: e.is_free,
				website: e.website || place.website,
				source_url: e.source_url,
				checked_at: e.checked_at,
				suitable_reason: e.suitable_reason,
				addr: place.addr,
				plz: place.plz,
				oh: place.oh,
				wheelchair: place.wheelchair,
				googleMapsUrl: navi.googleMapsUrl,
				appleMapsUrl: navi.appleMapsUrl
			}
		});
	}

	const { kept, duplicates } = dedupe(features);
	dropped.duplicates = duplicates;
	return { collection: { type: 'FeatureCollection', features: kept }, dropped, missingEnrichment };
}
