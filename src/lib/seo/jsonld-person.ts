/**
 * Gründer-Person von navigator.berlin (Matze Schmidbauer).
 *
 * Die `@id` entspricht dem Knoten auf schmidbauer.dev, damit Suchmaschinen beide
 * Auftritte als dieselbe Person verbinden. Quelle der Fakten: öffentliche
 * Profile (schmidbauer.dev `src/lib/config/site.ts`).
 */
export const FOUNDER_NAME = 'Matze Schmidbauer';
export const FOUNDER_URL = 'https://schmidbauer.dev';
export const FOUNDER_ID = `${FOUNDER_URL}/#person`;
export const FOUNDER_JOB_TITLE = 'Head of Platform & AI';

export const FOUNDER_PROFILE_URLS = {
	bluesky: 'https://bsky.app/profile/schmidbauer.dev',
	linkedin: 'https://www.linkedin.com/in/matzeschmidbauer/'
} as const;

export interface PersonLeafJsonLd {
	'@type': 'Person';
	'@id': string;
	name: string;
	url: string;
	jobTitle: string;
	sameAs: string[];
}

/** Verweis auf die Person (Referenz ohne Profile), z. B. in Organization und DataCatalog. */
export interface PersonRefJsonLd {
	'@type': 'Person';
	'@id': string;
	name: string;
}

export function founderRef(): PersonRefJsonLd {
	return { '@type': 'Person', '@id': FOUNDER_ID, name: FOUNDER_NAME };
}

export function buildFounderPerson(): PersonLeafJsonLd {
	return {
		'@type': 'Person',
		'@id': FOUNDER_ID,
		name: FOUNDER_NAME,
		url: FOUNDER_URL,
		jobTitle: FOUNDER_JOB_TITLE,
		sameAs: [FOUNDER_PROFILE_URLS.bluesky, FOUNDER_PROFILE_URLS.linkedin]
	};
}
