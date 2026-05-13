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

export function markersInRange(
	markers: readonly NarrativeMarker[],
	minYear: number,
	maxYear: number
): NarrativeMarker[] {
	return markers.filter((m) => m.year >= minYear && m.year <= maxYear);
}
