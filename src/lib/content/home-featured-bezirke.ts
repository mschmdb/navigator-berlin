/**
 * Story 2.12 T2: Featured-Bezirke-Auswahl für die Home-Landing.
 *
 * 4 Einstiegs-Bezirke editorial gewählt. Slug MUSS zu einer prerendered
 * `/bezirk/{slug}`-Route passen (Story 2.3). Rationale-Kommentar pro
 * Eintrag dokumentiert die Auswahl-Logik damit spätere Editorial-Pässe
 * nachvollziehbar bleiben.
 *
 * i18n Block B2: `displayName` bleibt der Bezirks-Eigenname (Glossar:
 * Bezirk-Namen bleiben in beiden Sprachen deutsch, keine Modul-Konstante
 * nötig). `teaser` ist echter UI-Text, aufgelöst über
 * `homeFeaturedBezirkTeaser()`.
 */
import { m } from '$lib/paraglide/messages.js';
import { toMessageOptions, assertUnreachable, type LocaleOptions } from '$lib/i18n/message-options.js';

export const HOME_FEATURED_BEZIRK_SLUGS = [
	'mitte',
	'friedrichshain-kreuzberg',
	'pankow',
	'neukoelln'
] as const;
export type HomeFeaturedBezirkSlug = (typeof HOME_FEATURED_BEZIRK_SLUGS)[number];

export interface HomeFeaturedBezirk {
	readonly slug: HomeFeaturedBezirkSlug;
	readonly displayName: string;
}

export const HOME_FEATURED_BEZIRKE: readonly HomeFeaturedBezirk[] = [
	// Rationale: Größte Bandbreite zwischen Regierungs-Repräsentativ und
	// Wedding-Mietshaus innerhalb eines Bezirks. Klassischer Einstieg für
	// Berlin-Neulinge.
	{ slug: 'mitte', displayName: 'Mitte' },
	// Rationale: Dichteste Bevölkerung der Stadt + jüngste Demographie.
	// Schaufenster für Lärm-/Klima-Themen in Innenstadt-Lagen.
	{ slug: 'friedrichshain-kreuzberg', displayName: 'Friedrichshain-Kreuzberg' },
	// Rationale: Maximaler interner Kontrast — Prenzlauer Berg vs Buch.
	// Zeigt, dass Bezirk-Aggregate nicht das ganze Bild liefern.
	{ slug: 'pankow', displayName: 'Pankow' },
	// Rationale: Schauplatz fast jeder Berliner Debatte zu Wohnen / Sozialer
	// Lage. Wichtig damit Soziale-Lage-Dimension nicht über Bezirke wegfällt.
	{ slug: 'neukoelln', displayName: 'Neukölln' }
];

export function homeFeaturedBezirkTeaser(slug: HomeFeaturedBezirkSlug, o?: LocaleOptions): string {
	const options = toMessageOptions(o);
	switch (slug) {
		case 'mitte':
			return m.home_featured_bezirk_mitte_teaser(undefined, options);
		case 'friedrichshain-kreuzberg':
			return m.home_featured_bezirk_friedrichshain_kreuzberg_teaser(undefined, options);
		case 'pankow':
			return m.home_featured_bezirk_pankow_teaser(undefined, options);
		case 'neukoelln':
			return m.home_featured_bezirk_neukoelln_teaser(undefined, options);
		default:
			return assertUnreachable(slug);
	}
}
