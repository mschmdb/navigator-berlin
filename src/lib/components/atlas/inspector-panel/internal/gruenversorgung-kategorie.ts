// Grünversorgung in der Skala des Senats (Umweltatlas 2023, c_gruen2023): gut/mittel/schlecht.
// NAV-108 (15.11.2026): Die neutrale Umbenennung aus Story 1.22 (gering/mittel/hoch) entfällt
// für diese Kennzahl. Ältere oder fremde Bezeichnungen werden auf die Senats-Wörter gemappt.
// Severity-Richtung läuft separat in `value-severity-mapping.ts`.

const TO_SENAT: Record<string, string> = {
	// Der Senat kennt nur drei Stufen; „sehr …“ fällt auf die nächste Stufe, damit jede
	// Ausgabe eine Übersetzung hat.
	'sehr gut': 'gut',
	'sehr hoch': 'gut',
	gut: 'gut',
	hoch: 'gut',
	mittel: 'mittel',
	schlecht: 'schlecht',
	gering: 'schlecht',
	niedrig: 'schlecht',
	'sehr schlecht': 'schlecht',
	'sehr gering': 'schlecht',
	'sehr niedrig': 'schlecht'
};

export function mapGruenversorgungKategorie(raw: string): string {
	const key = raw.toLowerCase().trim();
	return TO_SENAT[key] ?? raw;
}
