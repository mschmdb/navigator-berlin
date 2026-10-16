/**
 * Datentypen für die Wärme-Orte-Pipeline (#61). OSM-Anteil (ODbL) und redaktioneller
 * Anteil (enrichment.json) bleiben getrennte Typen, Join-Key ist `id`.
 */

export interface OsmPlace {
	/** `node/123`, `way/456` oder `relation/789` */
	id: string;
	name: string;
	lat: number;
	lon: number;
	addr: string;
	plz: string;
	/** OSM-Tag `opening_hours`, leer wenn nicht gesetzt */
	oh: string;
	wheelchair: string;
	website: string;
	/** Nur die für den Filter relevanten OSM-Tags */
	tags: Record<string, string>;
}

export interface SnapshotMeta {
	source: string;
	extract_url: string;
	osm_timestamp: string;
	osm_attribution: string;
	filter: string;
	stats: Record<string, number>;
}

export interface OsmSnapshot {
	meta: SnapshotMeta;
	places: OsmPlace[];
}

export type WinterOpen = 'yes' | 'limited' | 'no' | 'unknown';
export type StayWithoutPurchase = 'yes' | 'no' | 'unknown';
export type Admission = 'free' | 'ticket' | 'unknown';
export type StillExists = 'yes' | 'no' | 'unknown';

export interface WaermeEnrichment {
	id: string;
	name: string;
	cat: string;
	suitable: boolean;
	suitable_reason: string;
	winter_open: WinterOpen;
	opening_hours_note: string;
	stay_without_purchase: StayWithoutPurchase;
	is_free: Admission;
	website: string;
	source_url: string;
	/** ISO-Datum YYYY-MM-DD */
	checked_at: string;
	still_exists: StillExists;
	notes: string;
}
