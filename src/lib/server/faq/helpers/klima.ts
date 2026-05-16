/**
 * Story 2.5b: Sub-Slot-Helper für Klima-Cluster.
 *
 * Quellen:
 * - Stadtklimaanalyse 2015 (PET = Physiologische Äquivalent-Temperatur),
 * - Daten aus der Klima-Normalperiode 1991-2020 (DWD).
 */

export type PetKategorie =
	| 'thermisch entspannt'
	| 'gemäßigt'
	| 'thermisch belastet'
	| 'stark belastet'
	| 'unbekannt';

/**
 * PET-Bereiche orientieren sich an der gängigen Klassifikation des Deutschen
 * Wetterdienstes (DWD) für PET-Indizes bei Mittagsspitze: <35°C wenig Stress,
 * 35-41°C moderater Hitzestress, 41-46°C starke Belastung, >46°C extreme.
 */
export function describePetKategorie(petCelsius: number | null | undefined): PetKategorie {
	if (petCelsius === null || petCelsius === undefined) return 'unbekannt';
	if (petCelsius < 35) return 'thermisch entspannt';
	if (petCelsius < 41) return 'gemäßigt';
	if (petCelsius < 46) return 'thermisch belastet';
	return 'stark belastet';
}

export function petErklaerungDe(petCelsius: number | null | undefined): string {
	const cat = describePetKategorie(petCelsius);
	switch (cat) {
		case 'thermisch entspannt':
			return 'An typischen Sommertagen bleibt die gefühlte Temperatur unter der Stress-Schwelle.';
		case 'gemäßigt':
			return 'Die gefühlte Mittagstemperatur an Hitzetagen liegt im moderaten Bereich.';
		case 'thermisch belastet':
			return 'Die gefühlte Mittagstemperatur erreicht an Hitzetagen einen Bereich, in dem Schatten und Trinkwasser-Versorgung wichtig werden.';
		case 'stark belastet':
			return 'Die gefühlte Mittagstemperatur kann an Hitzetagen Werte erreichen, die für vulnerable Gruppen kritisch sind.';
		default:
			return 'Für diesen Raum liegt keine PET-Kategorie im Aggregat vor.';
	}
}

export function formatPet(value: number): string {
	return value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Share-Wert „Anteil sehr-heisser Flächen" (0..1) als deutsches Prozent.
 */
export function formatShareProzent(value: number): string {
	return `${(value * 100).toLocaleString('de-DE', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	})} Prozent`;
}
