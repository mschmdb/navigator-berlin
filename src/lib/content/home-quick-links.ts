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
 * Editorial-Auswahl per Memory `project_parallel_wave_plan` (2.12 spec):
 * Brandenburger Tor / Alexanderplatz / Görlitzer Park / Tempelhofer Feld /
 * Schloss Charlottenburg. Klassische Touri-/Civic-Anker quer durch die
 * Bezirke damit Demo-Klick immer was Bekanntes trifft.
 */
export interface HomeQuickLink {
	readonly label: string;
	readonly query: string;
	readonly lng: number;
	readonly lat: number;
}

export const HOME_QUICK_LINKS: readonly HomeQuickLink[] = [
	{
		label: 'Brandenburger Tor',
		query: 'Pariser Platz, 10117 Berlin',
		lng: 13.3777,
		lat: 52.5163
	},
	{
		label: 'Alexanderplatz',
		query: 'Alexanderplatz, 10178 Berlin',
		lng: 13.4127,
		lat: 52.5219
	},
	{
		label: 'Görlitzer Park',
		query: 'Görlitzer Park, 10997 Berlin',
		lng: 13.4395,
		lat: 52.4986
	},
	{
		label: 'Tempelhofer Feld',
		query: 'Tempelhofer Feld, 12101 Berlin',
		lng: 13.4019,
		lat: 52.4757
	},
	{
		label: 'Schloss Charlottenburg',
		query: 'Spandauer Damm 20-24, 14059 Berlin',
		lng: 13.2966,
		lat: 52.5208
	}
];

/** Baut den Deeplink-URL-Pfad analog `$lib/utils/url-state.ts`. */
export function buildQuickLinkHref(link: HomeQuickLink): string {
	const params = new URLSearchParams();
	params.set('address', `${link.lng},${link.lat}`);
	params.set('q', link.query);
	return `/explore?${params.toString()}`;
}
