// Story 1.22: Skala-Harmonisierung Grünversorgung.
// Quelle: Umweltatlas 2023 c_gruen2023 nutzt wertende Kategorien (gut/mittel/schlecht).
// Display-Mapping auf objektive Skala (gering/mittel/hoch), Wert-Richtung erklärt
// `valueScaleExplain` ("niedrig = wenig Grün, sehr hoch = gut versorgt").
// Severity-Inversion läuft separat in `value-severity-mapping.ts`.

const RAW_TO_HARMONIZED: Record<string, string> = {
	'sehr schlecht': 'sehr gering',
	'sehr niedrig': 'sehr gering',
	schlecht: 'gering',
	niedrig: 'gering',
	mittel: 'mittel',
	gut: 'hoch',
	'sehr gut': 'sehr hoch',
	gering: 'gering',
	'sehr gering': 'sehr gering',
	hoch: 'hoch',
	'sehr hoch': 'sehr hoch'
};

export function mapGruenversorgungKategorie(raw: string): string {
	const key = raw.toLowerCase().trim();
	return RAW_TO_HARMONIZED[key] ?? raw;
}
