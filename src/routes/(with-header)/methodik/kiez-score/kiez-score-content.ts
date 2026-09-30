import { m } from '$lib/paraglide/messages.js';

export interface KiezScoreSection {
	readonly id: string;
	readonly label: string;
}

export interface KiezScoreDimension {
	readonly id: string;
	readonly label: string;
	readonly layers: string;
	readonly detail: string;
}

export interface KiezScoreOmission {
	readonly label: string;
	readonly reason: string;
}

export interface WeightRow {
	readonly id: string;
	readonly label: string;
	readonly weight: string;
	/** Nur Kontext-Dimensionen: Hinweis hinter dem Label. */
	readonly note?: string;
}

export function getKiezScoreSections(): KiezScoreSection[] {
	return [
		{ id: 'worum', label: m.methodik_kiez_score_section_worum_heading() },
		{ id: 'dimensionen', label: m.methodik_kiez_score_section_dimensions_heading() },
		{ id: 'gewichte', label: m.methodik_kiez_score_section_weights_heading() },
		{ id: 'normalisierung', label: m.methodik_kiez_score_section_normalisation_heading() },
		{ id: 'kiez-score', label: m.methodik_kiez_score_section_kiez_score_heading() },
		{ id: 'bezirks-score', label: m.methodik_kiez_score_section_bezirk_score_heading() },
		{ id: 'fehlt', label: m.methodik_kiez_score_section_missing_heading() },
		{ id: 'quellen', label: m.methodik_kiez_score_section_sources_heading() },
		{ id: 'editorial', label: m.methodik_kiez_score_section_editorial_heading() },
		{ id: 'feedback', label: m.methodik_kiez_score_section_feedback_heading() }
	];
}

/**
 * Die fünf Composite-Dimensionen übernehmen ihren Namen aus den bestehenden
 * `atlas_dimension_label_*`-Messages (eine Quelle, keine Duplikate).
 */
export function getKiezScoreDimensions(): KiezScoreDimension[] {
	return [
		{
			id: 'ruhe-luft',
			label: m.atlas_dimension_label_ruhe_luft(),
			layers: m.methodik_kiez_score_dim_ruhe_luft_layers(),
			detail: m.methodik_kiez_score_dim_ruhe_luft_detail()
		},
		{
			id: 'gruen-hitze',
			label: m.atlas_dimension_label_gruen_hitze(),
			layers: m.methodik_kiez_score_dim_gruen_hitze_layers(),
			detail: m.methodik_kiez_score_dim_gruen_hitze_detail()
		},
		{
			id: 'mobilitaet',
			label: m.atlas_dimension_label_mobilitaet(),
			layers: m.methodik_kiez_score_dim_mobilitaet_layers(),
			detail: m.methodik_kiez_score_dim_mobilitaet_detail()
		},
		{
			id: 'versorgung',
			label: m.atlas_dimension_label_versorgung(),
			layers: m.methodik_kiez_score_dim_versorgung_layers(),
			detail: m.methodik_kiez_score_dim_versorgung_detail()
		},
		{
			id: 'wohnschutz',
			label: m.atlas_dimension_label_wohnschutz(),
			layers: m.methodik_kiez_score_dim_wohnschutz_layers(),
			detail: m.methodik_kiez_score_dim_wohnschutz_detail()
		},
		{
			id: 'kultur',
			label: m.methodik_kiez_score_dim_kultur_label(),
			layers: m.methodik_kiez_score_dim_kultur_layers(),
			detail: m.methodik_kiez_score_dim_kultur_detail()
		},
		{
			id: 'kriminalitaet',
			label: m.methodik_kiez_score_dim_kriminalitaet_label(),
			layers: m.methodik_kiez_score_dim_kriminalitaet_layers(),
			detail: m.methodik_kiez_score_dim_kriminalitaet_detail()
		}
	];
}

export function getKiezScoreWeightRows(): WeightRow[] {
	const notInOverall = m.methodik_kiez_score_weights_row_not_in_overall();
	return [
		{ id: 'ruhe-luft', label: m.atlas_dimension_label_ruhe_luft(), weight: '0.20' },
		{ id: 'gruen-hitze', label: m.atlas_dimension_label_gruen_hitze(), weight: '0.20' },
		{ id: 'mobilitaet', label: m.atlas_dimension_label_mobilitaet(), weight: '0.20' },
		{ id: 'wohnschutz', label: m.atlas_dimension_label_wohnschutz(), weight: '0.20' },
		{ id: 'versorgung', label: m.atlas_dimension_label_versorgung(), weight: '0.20' },
		{ id: 'kultur', label: m.atlas_dimension_label_kultur(), weight: '0', note: notInOverall },
		{
			id: 'kriminalitaet',
			label: m.atlas_dimension_label_kriminalitaet(),
			weight: '0',
			note: notInOverall
		}
	];
}

export function getKiezScoreOmissions(): KiezScoreOmission[] {
	return [
		{
			label: m.methodik_kiez_score_missing_social_label(),
			reason: m.methodik_kiez_score_missing_social_reason()
		},
		{
			label: m.methodik_kiez_score_missing_affordability_label(),
			reason: m.methodik_kiez_score_missing_affordability_reason()
		},
		{
			label: m.methodik_kiez_score_missing_family_label(),
			reason: m.methodik_kiez_score_missing_family_reason()
		}
	];
}
