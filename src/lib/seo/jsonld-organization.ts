import type { WithContext } from 'schema-dts';
import { canonicalOrigin } from './canonical.js';

import { founderRef, type PersonRefJsonLd } from './jsonld-person.js';
import { ORGANIZATION_LOGO_PATH, ORGANIZATION_LOGO_SIZE } from './organization-logo.js';

export const ORGANIZATION_NAME = 'navigator.berlin';

/**
 * Projekt-Repository (Footer-Link in `social-links.svelte`). Persönliche Profile
 * (Bluesky, LinkedIn) hängen an der Person (`founder`, `jsonld-person.ts`), nicht an der Organization.
 */
export const REPO_URL = 'https://github.com/mschmdb/navigator-berlin';

export const ORGANIZATION_SAME_AS: readonly string[] = [REPO_URL];

/**
 * Verweis auf die Organization. Die vollständige Entität steht nur auf der
 * Startseite, daher tragen Verweise `@type`, `name` und `url` mit (Google
 * verlangt den Namen für Article- und Dataset-Rich-Results).
 */
export interface OrganizationRefJsonLd {
	'@type': 'Organization';
	'@id': string;
	name: string;
	url: string;
}

export interface OrganizationLeafJsonLd {
	'@type': 'Organization';
	'@id': string;
	name: string;
	url: string;
	description?: string;
	sameAs?: string[];
	founder: PersonRefJsonLd;
	logo: {
		'@type': 'ImageObject';
		url: string;
		width: number;
		height: number;
	};
}

export type OrganizationJsonLd = WithContext<OrganizationLeafJsonLd>;

export interface OrganizationInput {
	/** Absolute Origin, z. B. `https://navigator.berlin`. */
	readonly origin: string;
	/** Kurzbeschreibung in der Seiten-Locale. */
	readonly description?: string;
}

/** Stabile `@id` der Organization. Andere Builder verweisen darauf. */
export function organizationId(origin: string): string {
	return `${canonicalOrigin(origin)}/#organization`;
}

export function organizationRef(origin: string): OrganizationRefJsonLd {
	return {
		'@type': 'Organization',
		'@id': organizationId(origin),
		name: ORGANIZATION_NAME,
		url: canonicalOrigin(origin)
	};
}

export function buildOrganization(input: OrganizationInput): OrganizationJsonLd {
	const origin = canonicalOrigin(input.origin);
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': organizationId(origin),
		name: ORGANIZATION_NAME,
		url: origin,
		...(input.description ? { description: input.description } : {}),
		...(ORGANIZATION_SAME_AS.length > 0 ? { sameAs: [...ORGANIZATION_SAME_AS] } : {}),
		founder: founderRef(),
		logo: {
			'@type': 'ImageObject',
			url: `${origin}${ORGANIZATION_LOGO_PATH}`,
			width: ORGANIZATION_LOGO_SIZE,
			height: ORGANIZATION_LOGO_SIZE
		}
	};
}
