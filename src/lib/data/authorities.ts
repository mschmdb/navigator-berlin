/**
 * Authority-Mapping zentralisiert
 *
 * Phase 1 (Story 2.5a, DE-only): nur `de`-Strings gefüllt. EN-Bundles als
 * optionales Feld vorgesehen, Coverage aber explizit auf Phase 3 verschoben
 * (Memory `project_i18n_phase_1_de_only`).
 *
 * Phase 3 Workflow: EN-Werte hinzufügen, `resolveAuthority(key, 'en')` liefert
 * dann den EN-String statt DE-Fallback. Keine Signatur-Änderung nötig.
 *
 * Composites (z.B. "BVG · OpenStreetMap-Contributors (ODbL 1.0)") werden in
 * `layer-methodology.ts` per `authoritySuffix` zusammengesetzt, damit Suffixe
 * (OSM-Attribution, Lizenz-Marker) sprach-neutral bleiben können.
 */

export type Locale = 'de' | 'en';

export interface AuthorityMeta {
	readonly de: string;
	readonly en?: string;
}

export const AUTHORITIES = {
	odis: {
		de: 'ODIS Berlin · Open Data Informationsstelle'
	},
	osm: {
		de: 'OpenStreetMap-Contributors'
	},
	'senatsvw-umwelt': {
		de: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt · Umweltatlas Berlin'
	},
	'senatsvw-mvku': {
		de: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt (SenMVKU)'
	},
	'senatsvw-mvku-short': {
		de: 'SenMVKU'
	},
	'senatsvw-bildung': {
		de: 'Senatsverwaltung für Bildung, Jugend und Familie'
	},
	'senatsvw-gesundheit': {
		de: 'Senatsverwaltung für Wissenschaft, Gesundheit und Pflege'
	},
	'senatsvw-stadtentwicklung': {
		de: 'Senatsverwaltung für Stadtentwicklung Berlin'
	},
	'senatsvw-mietspiegel': {
		de: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen · Mietspiegel-Geschäftsstelle'
	},
	'senatsvw-stadtentwicklung-bezirke': {
		de: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen · Bezirksämter'
	},
	'senatsvw-inneres-sport': {
		de: 'Senatsverwaltung für Inneres und Sport · Bezirksämter'
	},
	'bezirksamt-bauamt': {
		de: 'Bezirksämter Berlin · Bauämter'
	},
	'bezirksamt-gruenflaeche': {
		de: 'Bezirksämter Berlin · Grünflächenämter'
	},
	'gutachterausschuss-grundstuecke': {
		de: 'Geschäftsstelle des Gutachterausschusses für Grundstückswerte in Berlin'
	},
	'baeder-betriebe': {
		de: 'Berliner Bäder-Betriebe (BBB) · Bezirksämter'
	},
	'wasser-betriebe': {
		de: 'Berliner Wasserbetriebe'
	},
	bvg: {
		de: 'BVG · Berliner Verkehrsbetriebe (GTFS-Export VBB)'
	},
	sbahn: {
		de: 'S-Bahn Berlin GmbH (DB-Konzern) · Routen aus OpenStreetMap-Relationen'
	},
	'stolpersteine-initiativen': {
		de: 'Stolpersteine-Initiativen Berlin'
	},
	'navigator-eigenberechnung-senats-daten': {
		de: 'navigator.berlin (Eigenberechnung aus Senats-Daten)'
	},
	'navigator-eigenberechnung-mss-2025': {
		de: 'navigator.berlin (Eigenberechnung aus SenStadt MSS 2025)'
	},
	'navigator-eigenberechnung-osm-radverkehr': {
		de: 'navigator.berlin (Eigenberechnung aus OSM-Stops + Berliner Radverkehrsnetz)'
	},
	'navigator-eigenberechnung-bezirke': {
		de: 'navigator.berlin (Eigenberechnung aus Senats-Daten und Bezirks-Registern)'
	}
} as const satisfies Record<string, AuthorityMeta>;

export type AuthorityKey = keyof typeof AUTHORITIES;

export const AUTHORITY_KEYS = Object.keys(AUTHORITIES) as AuthorityKey[];

/**
 * Liefert den Authority-Klartext-String in der gewünschten Locale.
 *
 * Fallback-Strategie: fehlt EN-Eintrag (Phase 1 DE-only), wird DE zurückgegeben.
 * Phase 3 (`project_i18n_phase_1_de_only`) füllt EN-Werte ohne Signatur-Bruch.
 */
export function resolveAuthority(key: AuthorityKey, locale: Locale = 'de'): string {
	const meta = AUTHORITIES[key];
	if (locale === 'en' && meta.en !== undefined) {
		return meta.en;
	}
	return meta.de;
}

/**
 * Sprach-neutrale Suffix-Konstanten für Composites (OSM-Attribution etc.).
 * Bewusst NICHT in AUTHORITIES: diese Suffixe sind technische Lizenz-Marker,
 * nicht übersetzbar.
 */
export const AUTHORITY_SUFFIX_OSM_ODBL = '· OpenStreetMap-Contributors (ODbL 1.0)';
