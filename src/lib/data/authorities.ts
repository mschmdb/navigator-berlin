/**
 * Authority-Mapping zentralisiert
 *
 * i18n Block C2 (spec-i18n-c2-layer-methodik.md): `en`-Werte sind befüllt,
 * offizielle englische Namen laut berlin.de (Abnahme
 * `c2-uebersetzung-review.md`, Matze 27.09. 10:59). `resolveAuthority(key,
 * 'en')` liefert jetzt echtes EN statt DE-Fallback.
 *
 * Composites (z.B. "BVG · OpenStreetMap contributors (ODbL 1.0)") werden in
 * `layer-methodology.ts` per `authoritySuffix` zusammengesetzt.
 * `AUTHORITY_SUFFIX_OSM_ODBL` ist seit C2 selbst locale-fähig (vormals ein
 * fixer, als "sprachneutral" behandelter String -- der DE-Suffix schrieb
 * "OpenStreetMap-Contributors", was auf EN falsch ist).
 *
 * i18n Block A: `Locale` kommt aus `$lib/paraglide/runtime` statt einem
 * eigenen `'de' | 'en'`-Union-Type, damit weitere Locales (es/tr) nur an
 * einer Stelle ergänzt werden müssen (Entscheidung Matze 26.09.2026).
 */

import type { Locale } from '$lib/paraglide/runtime';

export type { Locale };

export interface AuthorityMeta {
	readonly de: string;
	/**
	 * Seit i18n Block C2 fuer alle 25 Eintraege befuellt (Pflichtfeld, nicht
	 * mehr optional) -- `resolveAuthority(key, 'en')` faellt trotzdem
	 * defensiv auf DE zurueck, falls eine kuenftige Locale ('es'/'tr') noch
	 * kein `en`-Aequivalent hat.
	 */
	readonly en: string;
}

export const AUTHORITIES = {
	odis: {
		de: 'ODIS Berlin · Open Data Informationsstelle',
		en: 'ODIS Berlin · Open Data Information Office'
	},
	osm: {
		de: 'OpenStreetMap-Contributors',
		en: 'OpenStreetMap contributors'
	},
	'senatsvw-umwelt': {
		de: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt · Umweltatlas Berlin',
		en: 'Senate Department for Urban Mobility, Transport, Climate Action and the Environment · Berlin Environmental Atlas (Umweltatlas)'
	},
	'senatsvw-mvku': {
		de: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt (SenMVKU)',
		en: 'Senate Department for Urban Mobility, Transport, Climate Action and the Environment (SenMVKU)'
	},
	'senatsvw-mvku-short': {
		de: 'SenMVKU',
		en: 'SenMVKU'
	},
	'senatsvw-bildung': {
		de: 'Senatsverwaltung für Bildung, Jugend und Familie',
		en: 'Senate Department for Education, Youth and Families'
	},
	'senatsvw-gesundheit': {
		de: 'Senatsverwaltung für Wissenschaft, Gesundheit und Pflege',
		en: 'Senate Department for Higher Education and Research, Health and Long-Term Care'
	},
	'senatsvw-stadtentwicklung': {
		de: 'Senatsverwaltung für Stadtentwicklung Berlin',
		en: 'Senate Department for Urban Development Berlin'
	},
	'senatsvw-mietspiegel': {
		de: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen · Mietspiegel-Geschäftsstelle',
		en: 'Senate Department for Urban Development, Building and Housing · Rent index office (Mietspiegel-Geschäftsstelle)'
	},
	'senatsvw-stadtentwicklung-bezirke': {
		de: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen · Bezirksämter',
		en: 'Senate Department for Urban Development, Building and Housing · Bezirk offices (Bezirksämter)'
	},
	'senatsvw-inneres-sport': {
		de: 'Senatsverwaltung für Inneres und Sport · Bezirksämter',
		en: 'Senate Department for the Interior and Sport · Bezirk offices (Bezirksämter)'
	},
	'bezirksamt-bauamt': {
		de: 'Bezirksämter Berlin · Bauämter',
		en: 'Berlin Bezirk offices (Bezirksämter) · Building authorities (Bauämter)'
	},
	'bezirksamt-gruenflaeche': {
		de: 'Bezirksämter Berlin · Grünflächenämter',
		en: 'Berlin Bezirk offices (Bezirksämter) · Parks departments (Grünflächenämter)'
	},
	'gutachterausschuss-grundstuecke': {
		de: 'Geschäftsstelle des Gutachterausschusses für Grundstückswerte in Berlin',
		en: 'Office of the Berlin Committee of Valuation Experts (Gutachterausschuss)'
	},
	'baeder-betriebe': {
		de: 'Berliner Bäder-Betriebe (BBB) · Bezirksämter',
		en: 'Berliner Bäder-Betriebe (BBB) · Bezirk offices (Bezirksämter)'
	},
	'wasser-betriebe': {
		de: 'Berliner Wasserbetriebe',
		en: 'Berliner Wasserbetriebe'
	},
	bvg: {
		de: 'BVG · Berliner Verkehrsbetriebe · Halte und Netze aus OpenStreetMap',
		en: 'BVG · Berliner Verkehrsbetriebe · Stops and networks from OpenStreetMap'
	},
	sbahn: {
		de: 'S-Bahn Berlin GmbH (DB-Konzern) · Routen aus OpenStreetMap-Relationen',
		en: 'S-Bahn Berlin GmbH (DB group) · Routes from OpenStreetMap relations'
	},
	'stolpersteine-initiativen': {
		de: 'Stolpersteine-Initiativen Berlin',
		en: 'Stolpersteine initiatives in Berlin'
	},
	'navigator-eigenberechnung-senats-daten': {
		de: 'navigator.berlin (Eigenberechnung aus Senats-Daten)',
		en: 'navigator.berlin (own calculation from Senate data)'
	},
	'navigator-eigenberechnung-mss-2025': {
		de: 'navigator.berlin (Eigenberechnung aus SenStadt MSS 2025)',
		en: 'navigator.berlin (own calculation from SenStadt MSS 2025)'
	},
	'navigator-eigenberechnung-osm-radverkehr': {
		de: 'navigator.berlin (Eigenberechnung aus OSM-Stops + Berliner Radverkehrsnetz)',
		en: 'navigator.berlin (own calculation from OSM stops + Berlin cycling network)'
	},
	'navigator-eigenberechnung-bezirke': {
		de: 'navigator.berlin (Eigenberechnung aus Senats-Daten und Bezirks-Registern)',
		en: 'navigator.berlin (own calculation from Senate data and Bezirk registers)'
	},
	'navigator-eigenberechnung-kriminalitaetsatlas': {
		de: 'navigator.berlin (Eigenberechnung aus dem Kriminalitätsatlas Berlin, Polizei Berlin)',
		en: 'navigator.berlin (own calculation from the Berlin crime atlas (Kriminalitätsatlas Berlin), Berlin Police)'
	},
	'navigator-redaktion-osm-kuehle-orte': {
		de: 'navigator.berlin (redaktionelle Anreicherung aus OpenStreetMap)',
		en: 'navigator.berlin (editorial enrichment from OpenStreetMap)'
	}
} as const satisfies Record<string, AuthorityMeta>;

export type AuthorityKey = keyof typeof AUTHORITIES;

export const AUTHORITY_KEYS = Object.keys(AUTHORITIES) as AuthorityKey[];

/**
 * Liefert den Authority-Klartext-String in der gewünschten Locale.
 *
 * `locale === 'en'` liefert `meta.en` (seit i18n Block C2 für alle 25
 * Einträge befüllt). Jede andere Locale (`'de'` und jede künftige, noch
 * nicht unterstützte Locale wie `es`/`tr`) liefert `meta.de` -- das ist
 * bewusst ein Locale-Whitelist, kein "fehlt EN"-Fallback: eine neue Locale
 * braucht hier einen eigenen `if`-Zweig, sonst bleibt sie deutsch.
 */
export function resolveAuthority(key: AuthorityKey, locale: Locale = 'de'): string {
	const meta: AuthorityMeta = AUTHORITIES[key];
	if (locale === 'en') {
		return meta.en;
	}
	return meta.de;
}

/**
 * Locale-fähige Suffix-Konstante für Composites (OSM-Attribution etc.).
 * Bewusst NICHT in AUTHORITIES: dieser Suffix ist ein technischer
 * Lizenz-Marker, keine Behörde. Bis i18n Block C2 ein fixer String, der auf
 * EN fälschlich "OpenStreetMap-Contributors" (DE-Bindestrich-Schreibweise)
 * zeigte -- EN korrekt ist "OpenStreetMap contributors" (Leerzeichen, laut
 * OSM-Attribution-Konvention).
 */
export const AUTHORITY_SUFFIX_OSM_ODBL: Readonly<Record<Locale, string>> = {
	de: '· OpenStreetMap-Contributors (ODbL 1.0)',
	en: '· OpenStreetMap contributors (ODbL 1.0)'
};
