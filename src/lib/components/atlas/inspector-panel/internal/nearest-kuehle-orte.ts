import distance from '@turf/distance';
import { point } from '@turf/helpers';
import type { KuehleOrt } from '$lib/data/get-kuehle-orte-index.js';
import { getOpeningStatus, isOpenNow } from './opening-status.js';

/**
 * Story 15.3-15.5: Filter + Nächste-Orte-Berechnung für die Kühle-Orte-Inspector-Card.
 * Reine Funktionen, kein I/O. Filter sind multi-select und kombinierbar (UND-Verknüpfung).
 */
export interface KuehleOrteFilters {
	jetztOffen: boolean;
	mitKlimaanlage: boolean;
	kostenlos: boolean;
	imSommerNutzbar: boolean;
}

export const EMPTY_FILTERS: KuehleOrteFilters = {
	jetztOffen: false,
	mitKlimaanlage: false,
	kostenlos: false,
	imSommerNutzbar: false
};

export interface KuehleOrtMitDistanz extends KuehleOrt {
	distanceM: number;
}

export function filterKuehleOrte(
	places: readonly KuehleOrt[],
	filters: KuehleOrteFilters,
	now: Date = new Date()
): KuehleOrt[] {
	return places.filter((p) => {
		// "jetzt offen" schließt Orte mit unbekannten/nicht parsbaren Zeiten bewusst aus,
		// um kein falsches Offen zu suggerieren (nur belegt Offene bleiben sichtbar).
		if (filters.jetztOffen && !isOpenNow(getOpeningStatus(p.openingHours, now))) return false;
		// Klimaanlage: belegt (yes) oder wahrscheinlich (likely) zählen, unknown/no nicht.
		if (filters.mitKlimaanlage && p.acStatus !== 'yes' && p.acStatus !== 'likely') return false;
		if (filters.kostenlos && p.isFree !== 'free') return false;
		if (filters.imSommerNutzbar && p.summerAvailable !== 'yes') return false;
		return true;
	});
}

export function findNearestKuehleOrte(
	from: { lat: number; lng: number },
	places: readonly KuehleOrt[],
	limit: number
): KuehleOrtMitDistanz[] {
	const origin = point([from.lng, from.lat]);
	const withDistance = places.map((p) => ({
		...p,
		distanceM: Math.round(distance(origin, point([p.lng, p.lat]), { units: 'kilometers' }) * 1000)
	}));
	withDistance.sort((a, b) => a.distanceM - b.distanceM);
	return withDistance.slice(0, limit);
}

export function nearestFilteredKuehleOrte(
	from: { lat: number; lng: number },
	places: readonly KuehleOrt[],
	filters: KuehleOrteFilters,
	limit: number,
	now: Date = new Date()
): KuehleOrtMitDistanz[] {
	return findNearestKuehleOrte(from, filterKuehleOrte(places, filters, now), limit);
}
