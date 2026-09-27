import { m } from '$lib/paraglide/messages.js';
import { toAtlasMessageOptions, type LocaleOptions } from './atlas-label-options.js';

export interface NarrativeMarker {
	year: number;
	label: string;
}

export const BERLIN_NARRATIVE_MARKERS: readonly NarrativeMarker[] = [
	{ year: 1763, label: 'Beginn Industrialisierung' },
	{ year: 1871, label: 'Reichsgründung' },
	{ year: 1945, label: 'Kriegsende' },
	{ year: 1961, label: 'Mauerbau' },
	{ year: 1989, label: 'Mauerfall' },
	{ year: 2018, label: 'Rekordsommer' }
];

/**
 * Locale-fähige Fassung von `BERLIN_NARRATIVE_MARKERS` (i18n Block B3b).
 * `BERLIN_NARRATIVE_MARKERS` bleibt als DE-Konstante bestehen (bestehende
 * Importer/Tests); `climate-long-view.svelte`s Default-Prop nutzt diese
 * Funktion, ein per Prop übergebenes eigenes `narrativeMarkers`-Array bleibt
 * unverändert (Caller-Text, nicht Teil dieses Fundaments).
 */
export function getNarrativeMarkers(opts?: LocaleOptions): readonly NarrativeMarker[] {
	const options = toAtlasMessageOptions(opts);
	return [
		{ year: 1763, label: m.inspector_narrative_marker_industrialisierung(undefined, options) },
		{ year: 1871, label: m.inspector_narrative_marker_reichsgruendung(undefined, options) },
		{ year: 1945, label: m.inspector_narrative_marker_kriegsende(undefined, options) },
		{ year: 1961, label: m.inspector_narrative_marker_mauerbau(undefined, options) },
		{ year: 1989, label: m.inspector_narrative_marker_mauerfall(undefined, options) },
		{ year: 2018, label: m.inspector_narrative_marker_rekordsommer(undefined, options) }
	];
}

export function markersInRange(
	markers: readonly NarrativeMarker[],
	minYear: number,
	maxYear: number
): NarrativeMarker[] {
	return markers.filter((m) => m.year >= minYear && m.year <= maxYear);
}
