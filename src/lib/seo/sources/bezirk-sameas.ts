/**
 * Verifizierte Wikidata-/Wikipedia-Entitäten der 12 aktuellen Berliner Bezirke
 * (Story 11.1). Quelle: Wikidata SPARQL (P31 = Q821435 „borough of Berlin",
 * gefiltert auf die 12 aktuellen Bezirke seit Bezirksreform 2001), manuell
 * verifiziert 2026-06-06. Lizenz: Wikidata CC0, Wikipedia CC BY-SA 4.0.
 *
 * Bewusst nur Bezirks-Ebene: `sameAs` bedeutet „selbe Entität". Ein Kiez
 * (LOR-Bezirksregion) ist NICHT sein Bezirk, daher kein sameAs auf Kiez-Seiten
 * (kein erfundener Identitäts-Link, AC-3). Ortsteil-genaue Matches sind deferred.
 *
 * Slugs entsprechen `bezirk_stats.slug` (normalizeSlug der Gemeinde_name).
 */
export interface EntitySameAs {
	readonly wikidata: string;
	readonly wikipedia: string;
}

export const BEZIRK_SAMEAS: Readonly<Record<string, EntitySameAs>> = {
	'charlottenburg-wilmersdorf': {
		wikidata: 'https://www.wikidata.org/wiki/Q158095',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Charlottenburg-Wilmersdorf'
	},
	'friedrichshain-kreuzberg': {
		wikidata: 'https://www.wikidata.org/wiki/Q158893',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Friedrichshain-Kreuzberg'
	},
	lichtenberg: {
		wikidata: 'https://www.wikidata.org/wiki/Q329609',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Lichtenberg'
	},
	'marzahn-hellersdorf': {
		wikidata: 'https://www.wikidata.org/wiki/Q119284',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Marzahn-Hellersdorf'
	},
	mitte: {
		wikidata: 'https://www.wikidata.org/wiki/Q163966',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Mitte'
	},
	neukoelln: {
		wikidata: 'https://www.wikidata.org/wiki/Q4071168',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Neukölln'
	},
	pankow: {
		wikidata: 'https://www.wikidata.org/wiki/Q163012',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Pankow'
	},
	reinickendorf: {
		wikidata: 'https://www.wikidata.org/wiki/Q158876',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Reinickendorf'
	},
	spandau: {
		wikidata: 'https://www.wikidata.org/wiki/Q158083',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Spandau'
	},
	'steglitz-zehlendorf': {
		wikidata: 'https://www.wikidata.org/wiki/Q158064',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Steglitz-Zehlendorf'
	},
	'tempelhof-schoeneberg': {
		wikidata: 'https://www.wikidata.org/wiki/Q158106',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Tempelhof-Schöneberg'
	},
	'treptow-koepenick': {
		wikidata: 'https://www.wikidata.org/wiki/Q158089',
		wikipedia: 'https://de.wikipedia.org/wiki/Bezirk_Treptow-Köpenick'
	}
};

/** sameAs-Array (Wikidata + Wikipedia) für einen Bezirk-Slug; `[]` wenn unbekannt. */
export function bezirkSameAs(slug: string): string[] {
	const entry = BEZIRK_SAMEAS[slug];
	return entry ? [entry.wikidata, entry.wikipedia] : [];
}
