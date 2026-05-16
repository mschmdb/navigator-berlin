/**
 * Story 2.12 T2: Featured-Bezirke-Auswahl für die Home-Landing.
 *
 * 4 Einstiegs-Bezirke editorial gewählt. Slug MUSS zu einer prerendered
 * `/bezirk/{slug}`-Route passen (Story 2.3). Rationale-Kommentar pro
 * Eintrag dokumentiert die Auswahl-Logik damit spätere Editorial-Pässe
 * nachvollziehbar bleiben.
 */
export interface HomeFeaturedBezirk {
	readonly slug: string;
	readonly displayName: string;
	readonly teaser: string;
}

export const HOME_FEATURED_BEZIRKE: readonly HomeFeaturedBezirk[] = [
	{
		// Rationale: Größte Bandbreite zwischen Regierungs-Repräsentativ und
		// Wedding-Mietshaus innerhalb eines Bezirks. Klassischer Einstieg für
		// Berlin-Neulinge.
		slug: 'mitte',
		displayName: 'Mitte',
		teaser:
			'Regierungsviertel, Alexanderplatz, Wedding. Größte Bandbreite zwischen Hochpolitik und Mietshaus.'
	},
	{
		// Rationale: Dichteste Bevölkerung der Stadt + jüngste Demographie.
		// Schaufenster für Lärm-/Klima-Themen in Innenstadt-Lagen.
		slug: 'friedrichshain-kreuzberg',
		displayName: 'Friedrichshain-Kreuzberg',
		teaser: 'Dichteste Bevölkerung der Stadt. Lärmig, jung, im Wandel.'
	},
	{
		// Rationale: Maximaler interner Kontrast — Prenzlauer Berg vs Buch.
		// Zeigt, dass Bezirk-Aggregate nicht das ganze Bild liefern.
		slug: 'pankow',
		displayName: 'Pankow',
		teaser:
			'Vom Prenzlauer Berg bis Buch und Französisch Buchholz. Stadtteile mit sehr unterschiedlicher Lage.'
	},
	{
		// Rationale: Schauplatz fast jeder Berliner Debatte zu Wohnen / Sozialer
		// Lage. Wichtig damit Soziale-Lage-Dimension nicht über Bezirke wegfällt.
		slug: 'neukoelln',
		displayName: 'Neukölln',
		teaser:
			'Vom Reuterkiez bis Rudow. Schauplatz fast jeder Berliner Debatte zu Wohnen und Stadtentwicklung.'
	}
];
