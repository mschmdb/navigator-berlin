import type { ManualPlace, OsmPlace } from './types.js';

/**
 * Wärme-Orte: Validierung und Umwandlung der Orte ohne OSM-Eintrag (`places-manual.json`).
 * Reines Modul, kein I/O.
 */

export const MANUAL_ID_PATTERN = /^manual\/[a-z0-9]+(-[a-z0-9]+)*$/;

/** Grobe Box um Berlin, gleiche Werte wie die Prüfung in extract-waerme-orte.py. */
const BERLIN_BOX = { minLon: 13.08, maxLon: 13.77, minLat: 52.33, maxLat: 52.68 };

function isHttpUrl(value: string): boolean {
	try {
		const { protocol } = new URL(value);
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}

function placeErrors(place: ManualPlace): string[] {
	const errors: string[] = [];
	if (!MANUAL_ID_PATTERN.test(place.id)) errors.push(`id "${place.id}" ist keine manual/<slug>-id`);
	if (!place.name?.trim()) errors.push('name fehlt');
	if (!place.cat?.trim()) errors.push('cat fehlt');
	if (!place.addr?.trim()) errors.push('addr fehlt');
	if (!/^\d{5}$/.test(place.plz ?? '')) errors.push(`plz "${place.plz}" ist nicht fünfstellig`);
	if (!place.coord_source?.trim()) errors.push('coord_source fehlt');
	if (place.website && !isHttpUrl(place.website)) {
		errors.push(`website "${place.website}" ist keine http(s)-URL`);
	}
	const inBox =
		Number.isFinite(place.lat) &&
		Number.isFinite(place.lon) &&
		place.lon >= BERLIN_BOX.minLon &&
		place.lon <= BERLIN_BOX.maxLon &&
		place.lat >= BERLIN_BOX.minLat &&
		place.lat <= BERLIN_BOX.maxLat;
	if (!inBox) errors.push(`Koordinate ${place.lat}, ${place.lon} liegt nicht in Berlin`);
	return errors;
}

/** Liefert Fehlertexte, leer bei gültiger Liste. */
export function validateManualPlaces(places: ManualPlace[]): string[] {
	const errors: string[] = [];
	const seen = new Set<string>();
	for (const place of places) {
		if (seen.has(place.id)) errors.push(`${place.id}: id doppelt`);
		seen.add(place.id);
		errors.push(...placeErrors(place).map((message) => `${place.id}: ${message}`));
	}
	return errors;
}

export function manualCandidateIds(places: ManualPlace[]): string[] {
	return places.map((p) => p.id);
}

/** Form wie ein OSM-Ort, damit Merge und Navi-Links denselben Weg nehmen. */
export function manualToPlace(place: ManualPlace): OsmPlace {
	return {
		id: place.id,
		name: place.name,
		lat: place.lat,
		lon: place.lon,
		addr: place.addr,
		plz: place.plz,
		oh: '',
		wheelchair: '',
		website: place.website,
		tags: {}
	};
}
