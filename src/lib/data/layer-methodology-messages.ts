// i18n Block C2 (spec-i18n-c2-layer-methodik.md): Message-Mapping fuer die
// Methodik-Felder (`calculation`, `updateFrequency`, `coverageGaps`,
// `omissions`), analog zu `LAYER_EXPLAIN_MESSAGE`
// (`inspector-panel/internal/layer-explain.ts`). In einer eigenen Datei,
// damit `layer-methodology.ts` nicht durch die 155 Message-Referenzen
// aufgeblaeht wird (Review-Fund: vorher > 1000 Zeilen).
//
// `LAYER_METHODOLOGY_MESSAGE` ist ueber `Record<LayerMethodologySlug, ...>`
// (nicht `Partial`) getypt: fehlt fuer einen echten Spec-Slug ein Eintrag,
// schlaegt `pnpm check` fehl -- kein Risiko mehr, dass ein neuer Slug in
// `LAYER_METHODOLOGY_SPECS` ohne Message-Mapping still auf `/en/layer/...`
// landet. Einzelne FELDER (z.B. ein `coverageGaps`-Array-Index) bleiben
// optional, weil ihre Laenge pro Slug variiert -- eine fehlende Feld-
// Zuordnung faellt zur Laufzeit auf DE zurueck (siehe
// `layer-methodology.ts#resolveMethodologyForLocale`), kein Compile-Fehler.
import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime';
import type { LayerMethodologySlug } from './layer-methodology.js';

type MessageFn = (params?: undefined, options?: { locale: Locale }) => string;

export interface LayerMethodologyMessages {
	readonly calculation?: MessageFn;
	readonly updateFrequency?: MessageFn;
	readonly coverageGaps?: readonly MessageFn[];
	readonly omissions?: readonly MessageFn[];
}

/**
 * Slug -> Message-Mapping fuer die Methodik-Felder. `coverageGaps`/
 * `omissions` sind Array-Felder mit variabler Laenge pro Slug -- jedes
 * Array-Element bekommt einen eigenen Message-Key (`_coverage_gap_{n}` /
 * `_omission_{n}`), Reihenfolge entspricht `LAYER_METHODOLOGY_SPECS`.
 */
export const LAYER_METHODOLOGY_MESSAGE: Record<LayerMethodologySlug, LayerMethodologyMessages> = {
	bezirke: {
		calculation: m.layer_methodology_bezirke_calculation,
		updateFrequency: m.layer_methodology_bezirke_update_frequency
	},
	ortsteile: {
		calculation: m.layer_methodology_ortsteile_calculation,
		updateFrequency: m.layer_methodology_ortsteile_update_frequency
	},
	plz: {
		calculation: m.layer_methodology_plz_calculation,
		updateFrequency: m.layer_methodology_plz_update_frequency
	},
	bodenrichtwerte: {
		calculation: m.layer_methodology_bodenrichtwerte_calculation,
		updateFrequency: m.layer_methodology_bodenrichtwerte_update_frequency,
		coverageGaps: [
			m.layer_methodology_bodenrichtwerte_coverage_gap_0,
			m.layer_methodology_bodenrichtwerte_coverage_gap_1
		],
		omissions: [
			m.layer_methodology_bodenrichtwerte_omission_0,
			m.layer_methodology_bodenrichtwerte_omission_1
		]
	},
	'wohnlagen-2024': {
		calculation: m.layer_methodology_wohnlagen_2024_calculation,
		updateFrequency: m.layer_methodology_wohnlagen_2024_update_frequency,
		coverageGaps: [
			m.layer_methodology_wohnlagen_2024_coverage_gap_0,
			m.layer_methodology_wohnlagen_2024_coverage_gap_1
		],
		omissions: [
			m.layer_methodology_wohnlagen_2024_omission_0,
			m.layer_methodology_wohnlagen_2024_omission_1
		]
	},
	'milieuschutz-erhaltungsmiete': {
		calculation: m.layer_methodology_milieuschutz_erhaltungsmiete_calculation,
		updateFrequency: m.layer_methodology_milieuschutz_erhaltungsmiete_update_frequency,
		omissions: [m.layer_methodology_milieuschutz_erhaltungsmiete_omission_0]
	},
	'milieuschutz-staedtebau': {
		calculation: m.layer_methodology_milieuschutz_staedtebau_calculation,
		updateFrequency: m.layer_methodology_milieuschutz_staedtebau_update_frequency
	},
	'mss-gesamtindex-2025': {
		calculation: m.layer_methodology_mss_gesamtindex_2025_calculation,
		updateFrequency: m.layer_methodology_mss_gesamtindex_2025_update_frequency,
		coverageGaps: [
			m.layer_methodology_mss_gesamtindex_2025_coverage_gap_0,
			m.layer_methodology_mss_gesamtindex_2025_coverage_gap_1
		],
		omissions: [
			m.layer_methodology_mss_gesamtindex_2025_omission_0,
			m.layer_methodology_mss_gesamtindex_2025_omission_1
		]
	},
	'laerm-2023': {
		calculation: m.layer_methodology_laerm_2023_calculation,
		updateFrequency: m.layer_methodology_laerm_2023_update_frequency,
		coverageGaps: [
			m.layer_methodology_laerm_2023_coverage_gap_0,
			m.layer_methodology_laerm_2023_coverage_gap_1
		],
		omissions: [
			m.layer_methodology_laerm_2023_omission_0,
			m.layer_methodology_laerm_2023_omission_1
		]
	},
	'luft-2023': {
		calculation: m.layer_methodology_luft_2023_calculation,
		updateFrequency: m.layer_methodology_luft_2023_update_frequency,
		coverageGaps: [m.layer_methodology_luft_2023_coverage_gap_0],
		omissions: [m.layer_methodology_luft_2023_omission_0]
	},
	'bioklima-2023': {
		calculation: m.layer_methodology_bioklima_2023_calculation,
		updateFrequency: m.layer_methodology_bioklima_2023_update_frequency,
		coverageGaps: [m.layer_methodology_bioklima_2023_coverage_gap_0]
	},
	'gruenversorgung-2023': {
		calculation: m.layer_methodology_gruenversorgung_2023_calculation,
		updateFrequency: m.layer_methodology_gruenversorgung_2023_update_frequency,
		omissions: [m.layer_methodology_gruenversorgung_2023_omission_0]
	},
	'umweltgerechtigkeit-2023': {
		calculation: m.layer_methodology_umweltgerechtigkeit_2023_calculation,
		updateFrequency: m.layer_methodology_umweltgerechtigkeit_2023_update_frequency,
		coverageGaps: [m.layer_methodology_umweltgerechtigkeit_2023_coverage_gap_0],
		omissions: [m.layer_methodology_umweltgerechtigkeit_2023_omission_0]
	},
	'klima-pet-2022': {
		calculation: m.layer_methodology_klima_pet_2022_calculation,
		updateFrequency: m.layer_methodology_klima_pet_2022_update_frequency,
		coverageGaps: [m.layer_methodology_klima_pet_2022_coverage_gap_0],
		omissions: [m.layer_methodology_klima_pet_2022_omission_0]
	},
	'klima-kaltlufteinwirkbereich-2022': {
		calculation: m.layer_methodology_klima_kaltlufteinwirkbereich_2022_calculation,
		updateFrequency: m.layer_methodology_klima_kaltlufteinwirkbereich_2022_update_frequency
	},
	'klima-leitbahnkorridor-2022': {
		calculation: m.layer_methodology_klima_leitbahnkorridor_2022_calculation,
		updateFrequency: m.layer_methodology_klima_leitbahnkorridor_2022_update_frequency,
		omissions: [m.layer_methodology_klima_leitbahnkorridor_2022_omission_0]
	},
	stolpersteine: {
		calculation: m.layer_methodology_stolpersteine_calculation,
		updateFrequency: m.layer_methodology_stolpersteine_update_frequency,
		coverageGaps: [m.layer_methodology_stolpersteine_coverage_gap_0],
		omissions: [
			m.layer_methodology_stolpersteine_omission_0,
			m.layer_methodology_stolpersteine_omission_1
		]
	},
	'kitas-2024': {
		calculation: m.layer_methodology_kitas_2024_calculation,
		updateFrequency: m.layer_methodology_kitas_2024_update_frequency,
		omissions: [m.layer_methodology_kitas_2024_omission_0]
	},
	'schulen-2024': {
		calculation: m.layer_methodology_schulen_2024_calculation,
		updateFrequency: m.layer_methodology_schulen_2024_update_frequency,
		omissions: [m.layer_methodology_schulen_2024_omission_0]
	},
	'einschulbereiche-2024': {
		calculation: m.layer_methodology_einschulbereiche_2024_calculation,
		updateFrequency: m.layer_methodology_einschulbereiche_2024_update_frequency,
		omissions: [m.layer_methodology_einschulbereiche_2024_omission_0]
	},
	'krankenhaeuser-plan': {
		calculation: m.layer_methodology_krankenhaeuser_plan_calculation,
		updateFrequency: m.layer_methodology_krankenhaeuser_plan_update_frequency
	},
	'krankenhaeuser-weitere': {
		calculation: m.layer_methodology_krankenhaeuser_weitere_calculation,
		updateFrequency: m.layer_methodology_krankenhaeuser_weitere_update_frequency
	},
	'sportanlagen-2024': {
		calculation: m.layer_methodology_sportanlagen_2024_calculation,
		updateFrequency: m.layer_methodology_sportanlagen_2024_update_frequency
	},
	gruenanlagen: {
		calculation: m.layer_methodology_gruenanlagen_calculation,
		updateFrequency: m.layer_methodology_gruenanlagen_update_frequency
	},
	spielplaetze: {
		calculation: m.layer_methodology_spielplaetze_calculation,
		updateFrequency: m.layer_methodology_spielplaetze_update_frequency,
		omissions: [m.layer_methodology_spielplaetze_omission_0]
	},
	schwimmbaeder: {
		calculation: m.layer_methodology_schwimmbaeder_calculation,
		updateFrequency: m.layer_methodology_schwimmbaeder_update_frequency,
		omissions: [m.layer_methodology_schwimmbaeder_omission_0]
	},
	trinkbrunnen: {
		calculation: m.layer_methodology_trinkbrunnen_calculation,
		updateFrequency: m.layer_methodology_trinkbrunnen_update_frequency,
		coverageGaps: [m.layer_methodology_trinkbrunnen_coverage_gap_0]
	},
	'kuehle-orte': {
		calculation: m.layer_methodology_kuehle_orte_calculation,
		updateFrequency: m.layer_methodology_kuehle_orte_update_frequency,
		coverageGaps: [m.layer_methodology_kuehle_orte_coverage_gap_0],
		omissions: [m.layer_methodology_kuehle_orte_omission_0]
	},
	'radverkehrsnetz-2025': {
		calculation: m.layer_methodology_radverkehrsnetz_2025_calculation,
		updateFrequency: m.layer_methodology_radverkehrsnetz_2025_update_frequency
	},
	'fahrradstrassen-2024': {
		calculation: m.layer_methodology_fahrradstrassen_2024_calculation,
		updateFrequency: m.layer_methodology_fahrradstrassen_2024_update_frequency
	},
	'ubahn-stationen': {
		calculation: m.layer_methodology_ubahn_stationen_calculation,
		updateFrequency: m.layer_methodology_ubahn_stationen_update_frequency
	},
	'sbahn-stationen': {
		calculation: m.layer_methodology_sbahn_stationen_calculation,
		updateFrequency: m.layer_methodology_sbahn_stationen_update_frequency
	},
	'tram-haltestellen': {
		calculation: m.layer_methodology_tram_haltestellen_calculation,
		updateFrequency: m.layer_methodology_tram_haltestellen_update_frequency
	},
	'bus-haltestellen': {
		calculation: m.layer_methodology_bus_haltestellen_calculation,
		updateFrequency: m.layer_methodology_bus_haltestellen_update_frequency
	},
	'ubahn-netz': {
		calculation: m.layer_methodology_ubahn_netz_calculation,
		updateFrequency: m.layer_methodology_ubahn_netz_update_frequency
	},
	'tram-netz': {
		calculation: m.layer_methodology_tram_netz_calculation,
		updateFrequency: m.layer_methodology_tram_netz_update_frequency
	},
	'sbahn-netz': {
		calculation: m.layer_methodology_sbahn_netz_calculation,
		updateFrequency: m.layer_methodology_sbahn_netz_update_frequency
	},
	'kiez-score-ruhe-luft': {
		calculation: m.layer_methodology_kiez_score_ruhe_luft_calculation,
		updateFrequency: m.layer_methodology_kiez_score_ruhe_luft_update_frequency,
		coverageGaps: [
			m.layer_methodology_kiez_score_ruhe_luft_coverage_gap_0,
			m.layer_methodology_kiez_score_ruhe_luft_coverage_gap_1
		],
		omissions: [
			m.layer_methodology_kiez_score_ruhe_luft_omission_0,
			m.layer_methodology_kiez_score_ruhe_luft_omission_1
		]
	},
	'kiez-score-gruen-hitze': {
		calculation: m.layer_methodology_kiez_score_gruen_hitze_calculation,
		updateFrequency: m.layer_methodology_kiez_score_gruen_hitze_update_frequency,
		coverageGaps: [
			m.layer_methodology_kiez_score_gruen_hitze_coverage_gap_0,
			m.layer_methodology_kiez_score_gruen_hitze_coverage_gap_1
		],
		omissions: [m.layer_methodology_kiez_score_gruen_hitze_omission_0]
	},
	'kiez-score-mobilitaet': {
		calculation: m.layer_methodology_kiez_score_mobilitaet_calculation,
		updateFrequency: m.layer_methodology_kiez_score_mobilitaet_update_frequency,
		coverageGaps: [
			m.layer_methodology_kiez_score_mobilitaet_coverage_gap_0,
			m.layer_methodology_kiez_score_mobilitaet_coverage_gap_1
		],
		omissions: [
			m.layer_methodology_kiez_score_mobilitaet_omission_0,
			m.layer_methodology_kiez_score_mobilitaet_omission_1
		]
	},
	'kiez-score-versorgung': {
		calculation: m.layer_methodology_kiez_score_versorgung_calculation,
		updateFrequency: m.layer_methodology_kiez_score_versorgung_update_frequency,
		coverageGaps: [
			m.layer_methodology_kiez_score_versorgung_coverage_gap_0,
			m.layer_methodology_kiez_score_versorgung_coverage_gap_1,
			m.layer_methodology_kiez_score_versorgung_coverage_gap_2,
			m.layer_methodology_kiez_score_versorgung_coverage_gap_3
		],
		omissions: [
			m.layer_methodology_kiez_score_versorgung_omission_0,
			m.layer_methodology_kiez_score_versorgung_omission_1
		]
	},
	'kiez-score-wohnschutz': {
		calculation: m.layer_methodology_kiez_score_wohnschutz_calculation,
		updateFrequency: m.layer_methodology_kiez_score_wohnschutz_update_frequency,
		coverageGaps: [
			m.layer_methodology_kiez_score_wohnschutz_coverage_gap_0,
			m.layer_methodology_kiez_score_wohnschutz_coverage_gap_1
		],
		omissions: [
			m.layer_methodology_kiez_score_wohnschutz_omission_0,
			m.layer_methodology_kiez_score_wohnschutz_omission_1
		]
	},
	'kiez-score-kultur': {
		calculation: m.layer_methodology_kiez_score_kultur_calculation,
		updateFrequency: m.layer_methodology_kiez_score_kultur_update_frequency,
		coverageGaps: [
			m.layer_methodology_kiez_score_kultur_coverage_gap_0,
			m.layer_methodology_kiez_score_kultur_coverage_gap_1
		],
		omissions: [
			m.layer_methodology_kiez_score_kultur_omission_0,
			m.layer_methodology_kiez_score_kultur_omission_1
		]
	},
	'kiez-score-kriminalitaet': {
		calculation: m.layer_methodology_kiez_score_kriminalitaet_calculation,
		updateFrequency: m.layer_methodology_kiez_score_kriminalitaet_update_frequency,
		coverageGaps: [
			m.layer_methodology_kiez_score_kriminalitaet_coverage_gap_0,
			m.layer_methodology_kiez_score_kriminalitaet_coverage_gap_1,
			m.layer_methodology_kiez_score_kriminalitaet_coverage_gap_2
		],
		omissions: [
			m.layer_methodology_kiez_score_kriminalitaet_omission_0,
			m.layer_methodology_kiez_score_kriminalitaet_omission_1
		]
	}
};
