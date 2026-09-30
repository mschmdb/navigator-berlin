import { m } from '$lib/paraglide/messages.js';

export interface MethodikSection {
	readonly id: string;
	readonly label: string;
}

export interface AggregationLevel {
	readonly level: string;
	readonly detail: string;
}

export interface CoverageReason {
	/** Bezeichner der Coverage-Regel, bleibt in allen Sprachen unübersetzt. */
	readonly key: string;
	readonly text: string;
}

export interface Omission {
	readonly label: string;
	readonly reason: string;
}

/** Inhaltsverzeichnis und Section-Überschriften der Methodik-Seite. */
export function getMethodikSections(): MethodikSection[] {
	return [
		{ id: 'mission', label: m.methodik_section_mission_heading() },
		{ id: 'datenarchitektur', label: m.methodik_section_architecture_heading() },
		{ id: 'aggregations-ebenen', label: m.methodik_section_aggregation_heading() },
		{ id: 'karten-darstellung', label: m.methodik_section_map_heading() },
		{ id: 'was-ist-kiez', label: m.methodik_section_kiez_heading() },
		{ id: 'cross-layer', label: m.methodik_section_cross_layer_heading() },
		{ id: 'wahldaten-section', label: m.methodik_section_election_heading() },
		{ id: 'kuehle-orte', label: m.methodik_section_cool_places_heading() },
		{ id: 'coverage-strategie', label: m.methodik_section_coverage_heading() },
		{ id: 'omissions', label: m.methodik_section_omissions_heading() },
		{ id: 'editorial', label: m.methodik_section_editorial_heading() },
		{ id: 'daten-stand', label: m.methodik_section_data_status_heading() },
		{ id: 'lizenzen', label: m.methodik_section_licences_heading() },
		{ id: 'feedback', label: m.methodik_section_feedback_heading() }
	];
}

export function getAggregationLevels(): AggregationLevel[] {
	return [
		{
			level: m.methodik_aggregation_level_address(),
			detail: m.methodik_aggregation_level_address_detail()
		},
		{
			level: m.methodik_aggregation_level_lor(),
			detail: m.methodik_aggregation_level_lor_detail()
		},
		{
			level: m.methodik_aggregation_level_admin(),
			detail: m.methodik_aggregation_level_admin_detail()
		},
		{
			level: m.methodik_aggregation_level_block(),
			detail: m.methodik_aggregation_level_block_detail()
		},
		{ level: m.methodik_aggregation_level_osm(), detail: m.methodik_aggregation_level_osm_detail() }
	];
}

export function getCoverageReasons(): CoverageReason[] {
	return [
		{ key: 'no-coverage', text: m.methodik_coverage_reason_no_coverage() },
		{ key: 'outdated', text: m.methodik_coverage_reason_outdated() },
		{ key: 'seasonal', text: m.methodik_coverage_reason_seasonal() },
		{ key: 'coverage-out-of-scope', text: m.methodik_coverage_reason_out_of_scope() },
		{ key: 'out-of-concept', text: m.methodik_coverage_reason_out_of_concept() }
	];
}

export function getOmissions(): Omission[] {
	return [
		{ label: m.methodik_omission_cookies_label(), reason: m.methodik_omission_cookies_reason() },
		{ label: m.methodik_omission_rent_label(), reason: m.methodik_omission_rent_reason() },
		{
			label: m.methodik_omission_personal_data_label(),
			reason: m.methodik_omission_personal_data_reason()
		},
		{
			label: m.methodik_omission_generated_texts_label(),
			reason: m.methodik_omission_generated_texts_reason()
		},
		{
			label: m.methodik_omission_single_score_label(),
			reason: m.methodik_omission_single_score_reason()
		},
		{
			label: m.methodik_omission_advertising_label(),
			reason: m.methodik_omission_advertising_reason()
		}
	];
}
