import type { Bundle, LayerMetadata } from '$lib/data';
import { matchSynonyms, normalizeQueryNfd } from './layer-synonyms.js';
import { m } from '$lib/paraglide/messages.js';
import { toAtlasMessageOptions, type LocaleOptions } from './atlas-label-options.js';

/**
 * DE-Referenz für Layer-Namen. Bleibt für Direkt-Importer, die bewusst
 * DE-only sind (Boundary Spec i18n B3a: `server/og/og-pipeline.ts`,
 * `data/source-label.ts`), unverändert exportiert. `getLayerDisplayName()`
 * ist der locale-fähige Resolver für alle anderen Aufrufer -- ein
 * Paritätstest (`layer-palette-filter.test.ts`) hält beide Quellen
 * synchron, falls hier ein Layer-Name geändert wird ohne den Message-Key
 * nachzuziehen.
 */
export const LAYER_EXPLAIN_DE: Record<string, string> = {
	// A: Boundaries
	bezirke: 'Bezirke',
	ortsteile: 'Ortsteile',
	plz: 'Postleitzahlen',
	// B: Wohn-Daten
	bodenrichtwerte: 'Bodenrichtwerte (EUR/m²)',
	'wohnlagen-2024': 'Mietspiegel-Wohnlage 2024',
	'milieuschutz-erhaltungsmiete': 'Milieuschutz: Erhaltungsmiete',
	'milieuschutz-staedtebau': 'Milieuschutz: Städtebau',
	'mss-gesamtindex-2025': 'Soziale Lage (MSS 2025)',
	// C: Umwelt — Umweltatlas
	'laerm-2023': 'Lärmbelastung 2023',
	'luft-2023': 'Luftbelastung 2023',
	'bioklima-2023': 'Thermische Belastung 2023',
	'gruenversorgung-2023': 'Grünversorgung 2023',
	'umweltgerechtigkeit-2023': 'Umweltgerechtigkeit 2023',
	// C: Umwelt — Klimaanalyse 2022
	'klima-pet-2022': 'Gefühlte Temperatur 2022',
	'klima-kaltlufteinwirkbereich-2022': 'Kaltluft-Einwirkbereich (2022)',
	'klima-leitbahnkorridor-2022': 'Kaltluft-Leitbahn-Korridor (2022)',
	gruenanlagen: 'Grünanlagen',
	// D: Memorial
	stolpersteine: 'Stolpersteine',
	trinkbrunnen: 'Trinkbrunnen',
	'kuehle-orte': 'Kühle Orte',
	// E: Soziale Infrastruktur
	'kitas-2024': 'Kindertagesstätten',
	'schulen-2024': 'Schulen',
	'einschulbereiche-2024': 'Einschulbereiche',
	'krankenhaeuser-plan': 'Plan-Krankenhäuser',
	'krankenhaeuser-weitere': 'Weitere Krankenhäuser',
	'sportanlagen-2024': 'Sportanlagen',
	spielplaetze: 'Spielplätze',
	schwimmbaeder: 'Schwimmbäder',
	// F: Mobilität
	'radverkehrsnetz-2025': 'Radverkehrsnetz',
	'fahrradstrassen-2024': 'Fahrradstraßen',
	'ubahn-stationen': 'U-Bahn-Stationen',
	'sbahn-stationen': 'S-Bahn-Stationen',
	'tram-haltestellen': 'Tram-Haltestellen',
	'bus-haltestellen': 'Bus-Haltestellen',
	'ubahn-netz': 'U-Bahn-Netz',
	'tram-netz': 'Tram-Netz',
	'sbahn-netz': 'S-Bahn-Netz',
	// G: Kiez-Score (virtuelle Aggregat-Layer, Story 1.28)
	'kiez-score-gesamt': 'Kiez-Score · Gesamt',
	'kiez-score-ruhe-luft': 'Kiez-Score · Ruhe & Luft',
	'kiez-score-gruen-hitze': 'Kiez-Score · Grün & Hitze',
	'kiez-score-mobilitaet': 'Kiez-Score · Mobilität',
	'kiez-score-wohnschutz': 'Kiez-Score · Wohnschutz',
	'kiez-score-versorgung': 'Kiez-Score · Versorgung',
	'kiez-score-kultur': 'Kiez-Score · Kultur',
	'kiez-score-kriminalitaet': 'Kiez-Score · Erfasste Kriminalität',
	// I: Demografie (Story 10.0)
	'einwohner-dichte-2024': 'Einwohnerdichte 2024',
	// J: Kultur (Epic 13)
	'kultur-museum': 'Museen',
	'kultur-galerie': 'Galerien',
	'kultur-kunst-im-raum': 'Kunst im Stadtraum',
	'kultur-theater': 'Theater & Bühnen',
	'kultur-bibliothek': 'Bibliotheken',
	'kultur-kino': 'Kinos',
	'kultur-soziokultur': 'Soziokultur',
	'kultur-club': 'Clubs',
	// Synthetische Score-Sub-Terme (Kiez-Score-Detailzeilen, Stories 10.1-10.6b + Mobilität/Wohnschutz)
	'laerm-db': 'Lärm (dB-Mittel)',
	'kitas-pro-kind': 'Kita-Plätze pro Kind',
	kriminalitaet: 'Kriminalitäts-Index (HZ-Mittel)',
	'schulen-grundschule': 'Grundschulen',
	'schulen-weiterfuehrend': 'Weiterführende Schulen',
	'nahversorgung-lebensmittel': 'Lebensmittel',
	'nahversorgung-apotheke': 'Apotheke',
	'nahversorgung-post': 'Post',
	'oepnv-ubahn': 'U-Bahn-Nähe',
	'oepnv-sbahn': 'S-Bahn-Nähe',
	'oepnv-tram': 'Tram-Nähe',
	'oepnv-bus': 'Bus-Nähe',
	'radverkehr-presence': 'Radverkehrsnetz',
	'wohnschutz-presence': 'Milieuschutz-Gebiet',
	// i18n Block B4a: vormals eine separate `EXTRA_SOURCE_LABELS`-Ausnahme in
	// `data/source-label.ts` (kein Kiez-/Bezirk-Layer, sondern eine
	// synthetische Quelle für den Steckbrief-ÖPNV-Cluster).
	'oepnv-composite': 'ÖPNV-Haltestellen (BVG + S-Bahn)'
};

export const BUNDLE_ORDER: readonly Bundle[] = [
	'A: Boundaries',
	'B: Wohn-Daten',
	'C: Umwelt',
	'D: Memorial',
	'E: Soziale Infrastruktur',
	'F: Mobilität',
	'G: Kiez-Score',
	'H: Wahldaten',
	'I: Demografie',
	'J: Kultur'
];

/**
 * DE-Referenz für Bundle-Labels, analog zu `LAYER_EXPLAIN_DE`. Bleibt für
 * DE-only-Direktimporter unverändert exportiert; `bundleLabel()` ist der
 * locale-fähige Resolver, ein Paritätstest (`layer-palette-filter.test.ts`)
 * hält beide Quellen synchron.
 */
export const BUNDLE_LABEL_DE: Record<Bundle, string> = {
	'A: Boundaries': 'A · Boundaries',
	'B: Wohn-Daten': 'B · Wohn-Daten',
	'C: Umwelt': 'C · Umwelt',
	'D: Memorial': 'D · Memorial',
	'E: Soziale Infrastruktur': 'E · Soziale Infrastruktur',
	'F: Mobilität': 'F · Mobilität',
	'G: Kiez-Score': 'G · Kiez-Score',
	'H: Wahldaten': 'H · Wahldaten',
	'I: Demografie': 'I · Demografie',
	'J: Kultur': 'J · Kultur'
};

export interface LayerGroup {
	readonly bundle: Bundle;
	readonly label: string;
	readonly layers: readonly LayerMetadata[];
}

type MessageFn = (
	params?: undefined,
	options?: { locale: import('$lib/paraglide/runtime').Locale }
) => string;

// Story i18n B3a: Layer-Namen sind Code-Labels (Boundary: "sind Code-Labels
// und werden in B3a übersetzt"). Ein Eintrag je Slug aus `LAYER_EXPLAIN_DE`;
// fehlt ein Slug hier (z.B. neu angelegter Layer vor dem nächsten i18n-Pass),
// fällt `getLayerDisplayName` auf `LAYER_EXPLAIN_DE`/den rohen Slug zurück.
const LAYER_NAME_MESSAGE: Partial<Record<string, MessageFn>> = {
	bezirke: m.atlas_layer_name_bezirke,
	ortsteile: m.atlas_layer_name_ortsteile,
	plz: m.atlas_layer_name_plz,
	bodenrichtwerte: m.atlas_layer_name_bodenrichtwerte,
	'wohnlagen-2024': m.atlas_layer_name_wohnlagen_2024,
	'milieuschutz-erhaltungsmiete': m.atlas_layer_name_milieuschutz_erhaltungsmiete,
	'milieuschutz-staedtebau': m.atlas_layer_name_milieuschutz_staedtebau,
	'mss-gesamtindex-2025': m.atlas_layer_name_mss_gesamtindex_2025,
	'laerm-2023': m.atlas_layer_name_laerm_2023,
	'luft-2023': m.atlas_layer_name_luft_2023,
	'bioklima-2023': m.atlas_layer_name_bioklima_2023,
	'gruenversorgung-2023': m.atlas_layer_name_gruenversorgung_2023,
	'umweltgerechtigkeit-2023': m.atlas_layer_name_umweltgerechtigkeit_2023,
	'klima-pet-2022': m.atlas_layer_name_klima_pet_2022,
	'klima-kaltlufteinwirkbereich-2022': m.atlas_layer_name_klima_kaltlufteinwirkbereich_2022,
	'klima-leitbahnkorridor-2022': m.atlas_layer_name_klima_leitbahnkorridor_2022,
	gruenanlagen: m.atlas_layer_name_gruenanlagen,
	stolpersteine: m.atlas_layer_name_stolpersteine,
	trinkbrunnen: m.atlas_layer_name_trinkbrunnen,
	'kuehle-orte': m.atlas_layer_name_kuehle_orte,
	'kitas-2024': m.atlas_layer_name_kitas_2024,
	'schulen-2024': m.atlas_layer_name_schulen_2024,
	'einschulbereiche-2024': m.atlas_layer_name_einschulbereiche_2024,
	'krankenhaeuser-plan': m.atlas_layer_name_krankenhaeuser_plan,
	'krankenhaeuser-weitere': m.atlas_layer_name_krankenhaeuser_weitere,
	'sportanlagen-2024': m.atlas_layer_name_sportanlagen_2024,
	spielplaetze: m.atlas_layer_name_spielplaetze,
	schwimmbaeder: m.atlas_layer_name_schwimmbaeder,
	'radverkehrsnetz-2025': m.atlas_layer_name_radverkehrsnetz_2025,
	'fahrradstrassen-2024': m.atlas_layer_name_fahrradstrassen_2024,
	'ubahn-stationen': m.atlas_layer_name_ubahn_stationen,
	'sbahn-stationen': m.atlas_layer_name_sbahn_stationen,
	'tram-haltestellen': m.atlas_layer_name_tram_haltestellen,
	'bus-haltestellen': m.atlas_layer_name_bus_haltestellen,
	'ubahn-netz': m.atlas_layer_name_ubahn_netz,
	'tram-netz': m.atlas_layer_name_tram_netz,
	'sbahn-netz': m.atlas_layer_name_sbahn_netz,
	'kiez-score-gesamt': m.atlas_layer_name_kiez_score_gesamt,
	'kiez-score-ruhe-luft': m.atlas_layer_name_kiez_score_ruhe_luft,
	'kiez-score-gruen-hitze': m.atlas_layer_name_kiez_score_gruen_hitze,
	'kiez-score-mobilitaet': m.atlas_layer_name_kiez_score_mobilitaet,
	'kiez-score-wohnschutz': m.atlas_layer_name_kiez_score_wohnschutz,
	'kiez-score-versorgung': m.atlas_layer_name_kiez_score_versorgung,
	'kiez-score-kultur': m.atlas_layer_name_kiez_score_kultur,
	'kiez-score-kriminalitaet': m.atlas_layer_name_kiez_score_kriminalitaet,
	'einwohner-dichte-2024': m.atlas_layer_name_einwohner_dichte_2024,
	'kultur-museum': m.atlas_layer_name_kultur_museum,
	'kultur-galerie': m.atlas_layer_name_kultur_galerie,
	'kultur-kunst-im-raum': m.atlas_layer_name_kultur_kunst_im_raum,
	'kultur-theater': m.atlas_layer_name_kultur_theater,
	'kultur-bibliothek': m.atlas_layer_name_kultur_bibliothek,
	'kultur-kino': m.atlas_layer_name_kultur_kino,
	'kultur-soziokultur': m.atlas_layer_name_kultur_soziokultur,
	'kultur-club': m.atlas_layer_name_kultur_club,
	'laerm-db': m.atlas_layer_name_laerm_db,
	'kitas-pro-kind': m.atlas_layer_name_kitas_pro_kind,
	kriminalitaet: m.atlas_layer_name_kriminalitaet,
	'schulen-grundschule': m.atlas_layer_name_schulen_grundschule,
	'schulen-weiterfuehrend': m.atlas_layer_name_schulen_weiterfuehrend,
	'nahversorgung-lebensmittel': m.atlas_layer_name_nahversorgung_lebensmittel,
	'nahversorgung-apotheke': m.atlas_layer_name_nahversorgung_apotheke,
	'nahversorgung-post': m.atlas_layer_name_nahversorgung_post,
	'oepnv-ubahn': m.atlas_layer_name_oepnv_ubahn,
	'oepnv-sbahn': m.atlas_layer_name_oepnv_sbahn,
	'oepnv-tram': m.atlas_layer_name_oepnv_tram,
	'oepnv-bus': m.atlas_layer_name_oepnv_bus,
	'radverkehr-presence': m.atlas_layer_name_radverkehr_presence,
	'wohnschutz-presence': m.atlas_layer_name_wohnschutz_presence,
	'oepnv-composite': m.atlas_layer_name_oepnv_composite
};

const BUNDLE_LABEL_MESSAGE: Record<Bundle, MessageFn> = {
	'A: Boundaries': m.atlas_bundle_label_a,
	'B: Wohn-Daten': m.atlas_bundle_label_b,
	'C: Umwelt': m.atlas_bundle_label_c,
	'D: Memorial': m.atlas_bundle_label_d,
	'E: Soziale Infrastruktur': m.atlas_bundle_label_e,
	'F: Mobilität': m.atlas_bundle_label_f,
	'G: Kiez-Score': m.atlas_bundle_label_g,
	'H: Wahldaten': m.atlas_bundle_label_h,
	'I: Demografie': m.atlas_bundle_label_i,
	'J: Kultur': m.atlas_bundle_label_j
};

/**
 * Locale-fähiger Layer-Name-Resolver. Ohne `opts.locale`: DE (Boundary).
 *
 * `slug` kommt bei manchen Aufrufern letztlich aus einem Query-Parameter
 * (`?layers=`) -- ein Wert wie `constructor`/`toString`/`hasOwnProperty`
 * träfe ohne Guard `Object.prototype` statt "kein Eintrag" und lieferte
 * eine Funktion bzw. den falschen Wert zurück (Review-Fund). `Object.hasOwn`
 * prüft explizit EIGENE Properties, bevor überhaupt indiziert wird.
 */
export function getLayerDisplayName(slug: string, opts?: LocaleOptions): string {
	const fn = Object.hasOwn(LAYER_NAME_MESSAGE, slug) ? LAYER_NAME_MESSAGE[slug] : undefined;
	if (!fn) {
		return Object.hasOwn(LAYER_EXPLAIN_DE, slug) ? LAYER_EXPLAIN_DE[slug]! : slug;
	}
	return fn(undefined, toAtlasMessageOptions(opts));
}

/** Locale-fähiges Bundle-Label. Ohne `opts.locale`: DE (Boundary). */
export function bundleLabel(bundle: Bundle, opts?: LocaleOptions): string {
	return BUNDLE_LABEL_MESSAGE[bundle](undefined, toAtlasMessageOptions(opts));
}

export function filterLayers(
	layers: readonly LayerMetadata[],
	query: string,
	opts?: LocaleOptions
): readonly LayerMetadata[] {
	const q = query.trim().toLowerCase();
	if (!q) return layers;
	const qNfd = normalizeQueryNfd(query);
	const synonymHits = new Set(matchSynonyms(query));
	return layers.filter((l) => {
		const slugMatch = l.slug.toLowerCase().includes(q);
		const labelMatch = getLayerDisplayName(l.slug, opts).toLowerCase().includes(q);
		const labelNfdMatch = normalizeQueryNfd(getLayerDisplayName(l.slug, opts)).includes(qNfd);
		const synonymMatch = synonymHits.has(l.slug);
		return slugMatch || labelMatch || labelNfdMatch || synonymMatch;
	});
}

export function groupLayersByBundle(
	layers: readonly LayerMetadata[],
	opts?: LocaleOptions
): readonly LayerGroup[] {
	const visible = layers.filter((l) => l.mapRelevant !== false);
	const compareLocale = opts?.locale ?? 'de';
	return BUNDLE_ORDER.map((bundle) => {
		const inBundle = visible
			.filter((l) => l.bundleGroup === bundle)
			.slice()
			.sort((a, b) =>
				getLayerDisplayName(a.slug, opts).localeCompare(
					getLayerDisplayName(b.slug, opts),
					compareLocale
				)
			);
		return {
			bundle,
			label: bundleLabel(bundle, opts),
			layers: inBundle
		};
	}).filter((g) => g.layers.length > 0);
}
