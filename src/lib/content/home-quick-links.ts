/**
 * Beispiel-Adressen unter dem Suchfeld der Startseite.
 *
 * Klick führt auf `/explore?address=lng,lat&q=…`, damit die Karte mit
 * gewählter Adresse und geöffnetem Inspector startet (`parseAddress` in
 * `$lib/utils/url-state.ts`). Koordinaten sind eingefroren. `label` ist ein
 * Eigenname und bleibt in allen Sprachen gleich. `query` ist der deutsche
 * Geocoding-Suchstring.
 */
export const HOME_QUICK_LINK_IDS = ['hermannplatz', 'kollwitzplatz', 'frohnau'] as const;
export type HomeQuickLinkId = (typeof HOME_QUICK_LINK_IDS)[number];

export interface HomeQuickLink {
	readonly id: HomeQuickLinkId;
	readonly label: string;
	readonly query: string;
	readonly lng: number;
	readonly lat: number;
}

export const HOME_SEARCH_EXAMPLES: readonly HomeQuickLink[] = [
	{
		id: 'hermannplatz',
		label: 'Hermannplatz',
		query: 'Hermannplatz, 10967 Berlin',
		lng: 13.4239,
		lat: 52.4861
	},
	{
		id: 'kollwitzplatz',
		label: 'Kollwitzplatz',
		query: 'Kollwitzplatz, 10435 Berlin',
		lng: 13.4167,
		lat: 52.5372
	},
	{
		id: 'frohnau',
		label: 'Frohnau',
		query: 'Bahnhof Frohnau, 13465 Berlin',
		lng: 13.2837,
		lat: 52.6311
	}
];

/** Baut den Deeplink-URL-Pfad analog `$lib/utils/url-state.ts`. */
export function buildQuickLinkHref(link: Pick<HomeQuickLink, 'query' | 'lng' | 'lat'>): string {
	const params = new URLSearchParams();
	params.set('address', `${link.lng},${link.lat}`);
	params.set('q', link.query);
	return `/explore?${params.toString()}`;
}

/** Ziel nach Auswahl eines Suchtreffers auf der Startseite: Karte an genau diesem Punkt. */
export function buildSearchTargetHref(s: {
	readonly displayName: string;
	readonly lng: number;
	readonly lat: number;
}): string {
	return buildQuickLinkHref({ query: s.displayName, lng: s.lng, lat: s.lat });
}
