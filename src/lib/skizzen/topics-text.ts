import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime';
import type { ChapterId, LabelId, MetricId } from './topics';

type TextFn = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;

export interface MetricTextFns {
	readonly label: TextFn;
	readonly unit: TextFn;
	readonly what: TextFn;
	readonly source: TextFn;
	readonly higher: TextFn;
	readonly lower: TextFn;
	readonly zeroName?: TextFn;
	readonly zeroMedianLabel?: TextFn;
}

export const METRIC_TEXT: Readonly<Record<MetricId, MetricTextFns>> = {
	laermDb: {
		label: m.skizze_m_laermdb_label,
		unit: m.skizze_m_laermdb_unit,
		what: m.skizze_m_laermdb_what,
		source: m.skizze_m_laermdb_source,
		higher: m.skizze_m_laermdb_higher,
		lower: m.skizze_m_laermdb_lower
	},
	luftHoch: {
		label: m.skizze_m_lufthoch_label,
		unit: m.skizze_m_lufthoch_unit,
		what: m.skizze_m_lufthoch_what,
		source: m.skizze_m_lufthoch_source,
		higher: m.skizze_m_lufthoch_higher,
		lower: m.skizze_m_lufthoch_lower,
		zeroName: m.skizze_m_lufthoch_zero_name,
		zeroMedianLabel: m.skizze_m_lufthoch_zero_median
	},
	gruenanlagen: {
		label: m.skizze_m_gruenanlagen_label,
		unit: m.skizze_m_gruenanlagen_unit,
		what: m.skizze_m_gruenanlagen_what,
		source: m.skizze_m_gruenanlagen_source,
		higher: m.skizze_m_gruenanlagen_higher,
		lower: m.skizze_m_gruenanlagen_lower
	},
	gruenSchlecht: {
		label: m.skizze_m_gruenschlecht_label,
		unit: m.skizze_m_gruenschlecht_unit,
		what: m.skizze_m_gruenschlecht_what,
		source: m.skizze_m_gruenschlecht_source,
		higher: m.skizze_m_gruenschlecht_higher,
		lower: m.skizze_m_gruenschlecht_lower,
		zeroName: m.skizze_m_gruenschlecht_zero_name,
		zeroMedianLabel: m.skizze_m_gruenschlecht_zero_median
	},
	pet: {
		label: m.skizze_m_pet_label,
		unit: m.skizze_m_pet_unit,
		what: m.skizze_m_pet_what,
		source: m.skizze_m_pet_source,
		higher: m.skizze_m_pet_higher,
		lower: m.skizze_m_pet_lower
	},
	bestandsmiete: {
		label: m.skizze_m_bestandsmiete_label,
		unit: m.skizze_m_bestandsmiete_unit,
		what: m.skizze_m_bestandsmiete_what,
		source: m.skizze_m_bestandsmiete_source,
		higher: m.skizze_m_bestandsmiete_higher,
		lower: m.skizze_m_bestandsmiete_lower
	},
	altbau: {
		label: m.skizze_m_altbau_label,
		unit: m.skizze_m_altbau_unit,
		what: m.skizze_m_altbau_what,
		source: m.skizze_m_altbau_source,
		higher: m.skizze_m_altbau_higher,
		lower: m.skizze_m_altbau_lower
	},
	milieuschutz: {
		label: m.skizze_m_milieuschutz_label,
		unit: m.skizze_m_milieuschutz_unit,
		what: m.skizze_m_milieuschutz_what,
		source: m.skizze_m_milieuschutz_source,
		higher: m.skizze_m_milieuschutz_higher,
		lower: m.skizze_m_milieuschutz_lower,
		zeroName: m.skizze_m_milieuschutz_zero_name,
		zeroMedianLabel: m.skizze_m_milieuschutz_zero_median
	},
	haltestellenKm2: {
		label: m.skizze_m_haltestellenkm2_label,
		unit: m.skizze_m_haltestellenkm2_unit,
		what: m.skizze_m_haltestellenkm2_what,
		source: m.skizze_m_haltestellenkm2_source,
		higher: m.skizze_m_haltestellenkm2_higher,
		lower: m.skizze_m_haltestellenkm2_lower
	},
	haltestelle400m: {
		label: m.skizze_m_haltestelle400m_label,
		unit: m.skizze_m_haltestelle400m_unit,
		what: m.skizze_m_haltestelle400m_what,
		source: m.skizze_m_haltestelle400m_source,
		higher: m.skizze_m_haltestelle400m_higher,
		lower: m.skizze_m_haltestelle400m_lower
	},
	bahnhoefe: {
		label: m.skizze_m_bahnhoefe_label,
		unit: m.skizze_m_bahnhoefe_unit,
		what: m.skizze_m_bahnhoefe_what,
		source: m.skizze_m_bahnhoefe_source,
		higher: m.skizze_m_bahnhoefe_higher,
		lower: m.skizze_m_bahnhoefe_lower
	},
	lebensmittel10k: {
		label: m.skizze_m_lebensmittel10k_label,
		unit: m.skizze_m_lebensmittel10k_unit,
		what: m.skizze_m_lebensmittel10k_what,
		source: m.skizze_m_lebensmittel10k_source,
		higher: m.skizze_m_lebensmittel10k_higher,
		lower: m.skizze_m_lebensmittel10k_lower
	},
	apotheken: {
		label: m.skizze_m_apotheken_label,
		unit: m.skizze_m_apotheken_unit,
		what: m.skizze_m_apotheken_what,
		source: m.skizze_m_apotheken_source,
		higher: m.skizze_m_apotheken_higher,
		lower: m.skizze_m_apotheken_lower
	},
	kitas: {
		label: m.skizze_m_kitas_label,
		unit: m.skizze_m_kitas_unit,
		what: m.skizze_m_kitas_what,
		source: m.skizze_m_kitas_source,
		higher: m.skizze_m_kitas_higher,
		lower: m.skizze_m_kitas_lower
	},
	schulen: {
		label: m.skizze_m_schulen_label,
		unit: m.skizze_m_schulen_unit,
		what: m.skizze_m_schulen_what,
		source: m.skizze_m_schulen_source,
		higher: m.skizze_m_schulen_higher,
		lower: m.skizze_m_schulen_lower
	},
	kulturorte: {
		label: m.skizze_m_kulturorte_label,
		unit: m.skizze_m_kulturorte_unit,
		what: m.skizze_m_kulturorte_what,
		source: m.skizze_m_kulturorte_source,
		higher: m.skizze_m_kulturorte_higher,
		lower: m.skizze_m_kulturorte_lower
	},
	dichte: {
		label: m.skizze_m_dichte_label,
		unit: m.skizze_m_dichte_unit,
		what: m.skizze_m_dichte_what,
		source: m.skizze_m_dichte_source,
		higher: m.skizze_m_dichte_higher,
		lower: m.skizze_m_dichte_lower
	},
	kriminalitaet: {
		label: m.skizze_m_kriminalitaet_label,
		unit: m.skizze_m_kriminalitaet_unit,
		what: m.skizze_m_kriminalitaet_what,
		source: m.skizze_m_kriminalitaet_source,
		higher: m.skizze_m_kriminalitaet_higher,
		lower: m.skizze_m_kriminalitaet_lower
	}
};

export const LABEL_TEXT: Readonly<Record<LabelId, { label: TextFn; what: TextFn }>> = {
	laermKlasse: { label: m.skizze_l_laermklasse_label, what: m.skizze_l_laermklasse_what },
	gruenversorgung: {
		label: m.skizze_l_gruenversorgung_label,
		what: m.skizze_l_gruenversorgung_what
	},
	mss: { label: m.skizze_l_mss_label, what: m.skizze_l_mss_what }
};

export const CHAPTER_TEXT: Readonly<Partial<Record<ChapterId, { short: TextFn; title: TextFn }>>> =
	{
		laerm: { short: m.skizze_ch_laerm_short, title: m.skizze_ch_laerm_title },
		gruen: { short: m.skizze_ch_gruen_short, title: m.skizze_ch_gruen_title },
		wohnen: { short: m.skizze_ch_wohnen_short, title: m.skizze_ch_wohnen_title },
		unterwegs: { short: m.skizze_ch_unterwegs_short, title: m.skizze_ch_unterwegs_title },
		versorgung: { short: m.skizze_ch_versorgung_short, title: m.skizze_ch_versorgung_title },
		menschen: { short: m.skizze_ch_menschen_short, title: m.skizze_ch_menschen_title }
	};

/** Kategorien aus den Layer-Daten (kleingeschrieben). Unbekannte Werte bleiben unverändert. */
export const VALUE_TEXT: Readonly<Record<string, TextFn>> = {
	gering: m.skizze_v_gering,
	mittel: m.skizze_v_mittel,
	hoch: m.skizze_v_hoch,
	'sehr hoch': m.skizze_v_sehr_hoch,
	niedrig: m.skizze_v_niedrig,
	'sehr niedrig': m.skizze_v_sehr_niedrig,
	gut: m.skizze_v_gut,
	schlecht: m.skizze_v_schlecht
};
