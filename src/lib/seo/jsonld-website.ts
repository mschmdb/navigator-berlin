import type { WithContext } from 'schema-dts';
import { canonicalOrigin } from './canonical.js';
import { organizationRef, type OrganizationRefJsonLd } from './jsonld-organization.js';

export interface WebSiteLeafJsonLd {
	'@type': 'WebSite';
	'@id': string;
	name: string;
	url: string;
	description: string;
	inLanguage: string;
	publisher: OrganizationRefJsonLd;
}

export type WebSiteJsonLd = WithContext<WebSiteLeafJsonLd>;

/**
 * WebSite-JSON-LD. Konsument: nur die Startseite (`/`, `/en`).
 * Keine SearchAction: `address` erwartet Koordinaten, keine Textsuche, und
 * Google zeigt die Sitelinks-Searchbox nicht mehr an.
 */
export interface WebSiteInput {
	/** Absolute Origin ohne trailing-slash, z. B. `https://navigator.berlin`. */
	readonly origin: string;
	/** Site-Name, z. B. `navigator.berlin`. */
	readonly name: string;
	/** BCP-47-Locale-Tag, z. B. `de-DE`. */
	readonly locale: string;
	/** Kurzbeschreibung der Site. */
	readonly description: string;
}

export function buildWebSite(input: WebSiteInput): WebSiteJsonLd {
	const origin = canonicalOrigin(input.origin);

	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${origin}/#website`,
		name: input.name,
		url: origin,
		description: input.description,
		inLanguage: input.locale,
		publisher: organizationRef(origin)
	};
}
