/**
 * Story 2.5b T3.3: Sub-Slot-Helper für Lärm-Cluster.
 *
 * Mapped die ordinal-kategorialen Lärm-Werte (`hoch` / `mittel` / `niedrig`)
 * aus dem Berliner Lärmkartierungs-Datensatz (laerm-2023) auf
 * lesbare Substantive für FAQ-Antworten.
 *
 * Memory `project_compare_editorial_profiles`: laerm-2023 ist ordinal-kategorisch
 * (Pegel-Klassen pro Planungsraum), NICHT numerische Mittelwerte in dB.
 * Templates dürfen daher KEINE konkreten dB-Zahlen wie „58 dB L_DEN"
 * behaupten, sondern nur Kategorie-Begriffe.
 */

export type LaermCategoryDe = 'leise' | 'mittel' | 'laut' | 'sehr laut' | 'unbekannt';

const NORMALISATION: Record<string, LaermCategoryDe> = {
	niedrig: 'leise',
	gering: 'leise',
	mittel: 'mittel',
	hoch: 'laut',
	'sehr hoch': 'sehr laut'
};

export function describeLaermCategoryDe(raw: string | null | undefined): LaermCategoryDe {
	if (!raw) return 'unbekannt';
	const key = raw.trim().toLowerCase();
	return NORMALISATION[key] ?? 'unbekannt';
}

/**
 * Liefert eine Kurz-Erklärung passend zur Kategorie (1 Satz, ohne Live-Versprechen).
 * Wird in Templates als `{laermErklaerung}`-Slot verwendet.
 */
export function laermErklaerungDe(raw: string | null | undefined): string {
	const cat = describeLaermCategoryDe(raw);
	switch (cat) {
		case 'leise':
			return 'Das ist eine niedrige Pegel-Klasse, vergleichbar mit Wohnstraßen abseits von Hauptverkehrsachsen.';
		case 'mittel':
			return 'Das ist die mittlere Pegel-Klasse, typisch für innerstädtische Quartiere mit Sammelstraßen.';
		case 'laut':
			return 'Das ist eine hohe Pegel-Klasse, typisch entlang von Hauptverkehrsstraßen oder Bahnstrecken.';
		case 'sehr laut':
			return 'Das ist die höchste Pegel-Klasse, vorrangig direkt an stark belasteten Verkehrsachsen.';
		default:
			return 'Für diesen Bereich liegt keine Lärm-Kategorisierung im Datensatz vor.';
	}
}
