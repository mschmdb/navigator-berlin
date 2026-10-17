import distance from '@turf/distance';
import { point } from '@turf/helpers';
import type { WaermeOrt } from '$lib/data/get-waerme-orte-index.js';
import {
	getOpeningStatus,
	isOpenNow
} from '$lib/components/atlas/inspector-panel/internal/opening-status.js';

export type WaermeOrtStatus = 'open' | 'closing-soon' | 'closed';

export interface WaermeOrtMitDistanz extends WaermeOrt {
	distanceM: number;
	/** Aus Recherche-Zeiten, sonst OSM. `null` bei `unklar`, fehlenden oder nicht lesbaren Zeiten. */
	status: WaermeOrtStatus | null;
}

export interface NearestResult {
	items: WaermeOrtMitDistanz[];
	/** Anzahl aller Orte der Auswahl (vor dem Limit). */
	total: number;
}

const KATEGORIE_REIHENFOLGE = [
	'Bibliothek',
	'Museum',
	'Stadtteilzentrum',
	'Mall',
	'Kaufhaus',
	'Kirche',
	'Gotteshaus'
] as const;

export function openingStatusOf(oh: string, now: Date): WaermeOrtStatus | null {
	const status = getOpeningStatus(oh, now);
	return status === 'unknown' ? null : status;
}

export function nearestWaermeOrte(
	from: { lat: number; lng: number },
	places: readonly WaermeOrt[],
	options: { category?: string | null; limit: number; now: Date; onlyOpen?: boolean }
): NearestResult {
	const { category, limit, now, onlyOpen = false } = options;
	const inCategory = category ? places.filter((p) => p.cat === category) : places;
	const selection = onlyOpen
		? inCategory.filter((p) => isOpenNow(getOpeningStatus(p.openingHours, now)))
		: inCategory;
	const origin = point([from.lng, from.lat]);
	const items = selection
		.map((p) => ({
			...p,
			distanceM: Math.round(
				distance(origin, point([p.lng, p.lat]), { units: 'kilometers' }) * 1000
			),
			status: openingStatusOf(p.openingHours, now)
		}))
		.sort((a, b) => a.distanceM - b.distanceM)
		.slice(0, limit);
	return { items, total: selection.length };
}

/** Vorhandene Kategorien: bekannte in fester Reihenfolge, unbekannte alphabetisch dahinter. */
export function waermeKategorien(places: readonly WaermeOrt[]): string[] {
	const present = new Set(places.map((p) => p.cat));
	const known = KATEGORIE_REIHENFOLGE.filter((c) => present.has(c));
	const rest = [...present].filter(
		(c) => !(KATEGORIE_REIHENFOLGE as readonly string[]).includes(c)
	);
	return [...known, ...rest.sort()];
}
