import { canonicalOrigin } from './canonical.js';
import {
	organizationId,
	organizationRef,
	type OrganizationRefJsonLd
} from './jsonld-organization.js';
import { buildFounderPerson, type PersonLeafJsonLd } from './jsonld-person.js';

export interface AboutPageInput {
	/** Absolute Origin, z. B. `https://navigator.berlin`. */
	readonly origin: string;
	readonly name: string;
	readonly description: string;
	/** Lokalisierter Pfad der Seite, z. B. `/en/ueber`. */
	readonly urlPath: string;
	/** BCP-47-Tag der Seiten-Locale. */
	readonly inLanguage: string;
}

/** Organization-Verweis mit der vollen Person als `founder` (einzige volle Person im Graph). */
export interface AboutPageMainEntityJsonLd extends OrganizationRefJsonLd {
	founder: PersonLeafJsonLd;
}

export interface AboutPageLeafJsonLd {
	'@type': 'AboutPage';
	'@id': string;
	name: string;
	description: string;
	url: string;
	inLanguage: string;
	about: { '@id': string };
	mainEntity: AboutPageMainEntityJsonLd;
}

export interface AboutPageJsonLd extends AboutPageLeafJsonLd {
	'@context': 'https://schema.org';
}

function localizedUrl(origin: string, urlPath: string): string {
	const path = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
	return `${canonicalOrigin(origin)}${path}`;
}

/** Stabile `@id` je Sprachfassung: die kanonische, lokalisierte URL plus `#about`. */
export function aboutPageId(origin: string, urlPath: string): string {
	return `${localizedUrl(origin, urlPath)}#about`;
}

export function buildAboutPage(input: AboutPageInput): AboutPageJsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		'@id': aboutPageId(input.origin, input.urlPath),
		name: input.name,
		description: input.description,
		url: localizedUrl(input.origin, input.urlPath),
		inLanguage: input.inLanguage,
		about: { '@id': organizationId(input.origin) },
		mainEntity: { ...organizationRef(input.origin), founder: buildFounderPerson() }
	};
}
