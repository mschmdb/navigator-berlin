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
 *
 * i18n Block B2: `label` bleibt ein Eigenname (Ortsname), unübersetzt in
 * beiden Sprachen. `description` ist echter UI-Text und wird über
 * `homeQuickLinkDescription()` locale-abhängig aufgelöst (Auswertung beim
 * Aufruf, keine Modul-Konstante). `query` bleibt Datenschlüssel (deutscher
 * Geocoding-Suchstring), unverändert für beide Locales.
 */
import { m } from '$lib/paraglide/messages.js';
import { toMessageOptions, assertUnreachable, type LocaleOptions } from '$lib/i18n/message-options.js';

export const HOME_QUICK_LINK_IDS = [
	'pariser-platz',
	'goerlitzer-park',
	'tempelhofer-feld',
	'hermannplatz',
	'frohnau'
] as const;
export type HomeQuickLinkId = (typeof HOME_QUICK_LINK_IDS)[number];

export interface HomeQuickLink {
	readonly id: HomeQuickLinkId;
	readonly label: string;
	readonly query: string;
	readonly lng: number;
	readonly lat: number;
}

export const HOME_QUICK_LINKS: readonly HomeQuickLink[] = [
	{
		id: 'pariser-platz',
		label: 'Pariser Platz',
		query: 'Pariser Platz, 10117 Berlin',
		lng: 13.3777,
		lat: 52.5163
	},
	{
		id: 'goerlitzer-park',
		label: 'Görlitzer Park',
		query: 'Görlitzer Park, 10997 Berlin',
		lng: 13.4395,
		lat: 52.4986
	},
	{
		id: 'tempelhofer-feld',
		label: 'Tempelhofer Feld',
		query: 'Tempelhofer Feld, 12101 Berlin',
		lng: 13.4019,
		lat: 52.4757
	},
	{
		id: 'hermannplatz',
		label: 'Hermannplatz',
		query: 'Hermannplatz, 10967 Berlin',
		lng: 13.4239,
		lat: 52.4861
	},
	{
		id: 'frohnau',
		label: 'Frohnau',
		query: 'Bahnhof Frohnau, 13465 Berlin',
		lng: 13.2837,
		lat: 52.6311
	}
];

/** Locale-abhängige Kurzbeschreibung eines Quick-Links. */
export function homeQuickLinkDescription(id: HomeQuickLinkId, o?: LocaleOptions): string {
	const options = toMessageOptions(o);
	switch (id) {
		case 'pariser-platz':
			return m.home_quick_link_pariser_platz_description(undefined, options);
		case 'goerlitzer-park':
			return m.home_quick_link_goerlitzer_park_description(undefined, options);
		case 'tempelhofer-feld':
			return m.home_quick_link_tempelhofer_feld_description(undefined, options);
		case 'hermannplatz':
			return m.home_quick_link_hermannplatz_description(undefined, options);
		case 'frohnau':
			return m.home_quick_link_frohnau_description(undefined, options);
		default:
			return assertUnreachable(id);
	}
}

/** Baut den Deeplink-URL-Pfad analog `$lib/utils/url-state.ts`. */
export function buildQuickLinkHref(link: HomeQuickLink): string {
	const params = new URLSearchParams();
	params.set('address', `${link.lng},${link.lat}`);
	params.set('q', link.query);
	return `/explore?${params.toString()}`;
}
