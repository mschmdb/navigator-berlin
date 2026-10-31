/**
 * Die 12 Berliner Bezirke für die Kieze-Kachel der Startseite (#171).
 * Slugs entsprechen `BEZIRK_SAMEAS` und `bezirk_stats.slug`. Der Server lädt
 * dafür keine Geodaten zur Laufzeit.
 */
export interface HomeBezirk {
	readonly slug: string;
	readonly name: string;
}

export const HOME_BEZIRKE: readonly HomeBezirk[] = [
	{ slug: 'charlottenburg-wilmersdorf', name: 'Charlottenburg-Wilmersdorf' },
	{ slug: 'friedrichshain-kreuzberg', name: 'Friedrichshain-Kreuzberg' },
	{ slug: 'lichtenberg', name: 'Lichtenberg' },
	{ slug: 'marzahn-hellersdorf', name: 'Marzahn-Hellersdorf' },
	{ slug: 'mitte', name: 'Mitte' },
	{ slug: 'neukoelln', name: 'Neukölln' },
	{ slug: 'pankow', name: 'Pankow' },
	{ slug: 'reinickendorf', name: 'Reinickendorf' },
	{ slug: 'spandau', name: 'Spandau' },
	{ slug: 'steglitz-zehlendorf', name: 'Steglitz-Zehlendorf' },
	{ slug: 'tempelhof-schoeneberg', name: 'Tempelhof-Schöneberg' },
	{ slug: 'treptow-koepenick', name: 'Treptow-Köpenick' }
];
