/**
 * Story 2.12 T2: Quick-Links für die Home-Landing (5 Berliner Landmarks).
 *
 * Klick führt auf `/explore?address=lng,lat&q=…` damit der Atlas mit pre-
 * geladener Adresse + Inspector-Geöffnet rendert (Story 1.7-Pattern,
 * `parseAddress` in `$lib/utils/url-state.ts`).
 *
 * Koordinaten sind zur Build-Zeit eingefroren. Geocode-Round-Trip-Test in
 * `home-quick-links.test.ts` validiert dass die Werte stabil bleiben (kein
 * Auswurf ausserhalb Berlin-Bbox + WGS84-Plausibilität).
 *
 * Editorial-Auswahl per User-Copy-Revision 2026-05-17:
 * Pariser Platz / Görlitzer Park / Tempelhofer Feld / Hermannplatz / Frohnau.
 * Mix aus Touri-Anker, Park-mit-Debatte, Freifläche, Innenstadt-Knoten und
 * Nord-Stadtrand für Daten-Bandbreiten-Demo.
 */
export interface HomeQuickLink {
	readonly label: string;
	readonly description: string;
	readonly query: string;
	readonly lng: number;
	readonly lat: number;
}

export const HOME_QUICK_LINKS: readonly HomeQuickLink[] = [
	{
		label: 'Pariser Platz',
		description:
			'Touristenmagnet am Brandenburger Tor. Wie die Daten den Ort beschreiben, an dem jeder schon einmal stand.',
		query: 'Pariser Platz, 10117 Berlin',
		lng: 13.3777,
		lat: 52.5163
	},
	{
		label: 'Görlitzer Park',
		description:
			'Kreuzberger Park, Dauerthema in der Stadtdebatte. Lärm, Grün und soziale Lage an einem Punkt.',
		query: 'Görlitzer Park, 10997 Berlin',
		lng: 13.4395,
		lat: 52.4986
	},
	{
		label: 'Tempelhofer Feld',
		description:
			'Stillgelegter Flughafen, heute Berlins größte Freifläche. Kühler als die Umgebung, sichtbar im Klima-Atlas.',
		query: 'Tempelhofer Feld, 12101 Berlin',
		lng: 13.4019,
		lat: 52.4757
	},
	{
		label: 'Hermannplatz',
		description:
			'Knotenpunkt zwischen Kreuzberg und Neukölln, U7 kreuzt U8. Wie eine dichte Innenstadtkreuzung in den Daten aussieht.',
		query: 'Hermannplatz, 10967 Berlin',
		lng: 13.4239,
		lat: 52.4861
	},
	{
		label: 'Frohnau',
		description:
			'Villenort im Norden Reinickendorfs, hinter dem Bahnhof beginnt Brandenburg. Wie stark sich Berlin nach Norden verändert.',
		query: 'Bahnhof Frohnau, 13465 Berlin',
		lng: 13.2837,
		lat: 52.6311
	}
];

/** Baut den Deeplink-URL-Pfad analog `$lib/utils/url-state.ts`. */
export function buildQuickLinkHref(link: HomeQuickLink): string {
	const params = new URLSearchParams();
	params.set('address', `${link.lng},${link.lat}`);
	params.set('q', link.query);
	return `/explore?${params.toString()}`;
}
