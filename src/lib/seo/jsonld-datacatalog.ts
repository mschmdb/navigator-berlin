import type { WithContext } from 'schema-dts';
import type { License } from '$lib/data/types.js';
import { licenseToSchemaOrgUrl } from './license-url.js';

/**
 * Story 5.9 AC-5: DataCatalog-JSON-LD fuer /lizenzen.
 *
 * Bindet die 44 (oder N) im Manifest gepflegten Layer als Dataset-Refs unter
 * einem Publisher zusammen. Liefert das Trust-Signal fuer data.gov-Aggregatoren,
 * AI-Crawler und Schema.org-konforme Suchmaschinen, dass navigator.berlin
 * Publisher eines kohaerenten Geo-Daten-Katalogs ist.
 *
 * Dataset-Refs hier minimal (name + url + license-URL), damit Page-Payload
 * unter 5 KB bleibt. Vollstaendige Dataset-Schemas liegen pro Layer-Detail-
 * Page als eigenes JSON-LD-Block (Story 2.5a).
 */
export interface DataCatalogDatasetRef {
	readonly name: string;
	/** Relativer Pfad auf der Site, z. B. `/layer/laerm-2023`. */
	readonly urlPath: string;
	readonly license: License;
}

export interface DataCatalogPublisherJsonLd {
	'@type': 'Person';
	name: string;
}

export interface DataCatalogDatasetJsonLd {
	'@type': 'Dataset';
	name: string;
	url: string;
	license: string;
}

export interface DataCatalogLeafJsonLd {
	'@type': 'DataCatalog';
	name: string;
	description: string;
	url: string;
	inLanguage: string;
	publisher: DataCatalogPublisherJsonLd;
	dataset: DataCatalogDatasetJsonLd[];
}

export type DataCatalogJsonLd = WithContext<DataCatalogLeafJsonLd>;

export interface DataCatalogInput {
	readonly origin: string;
	readonly name: string;
	readonly description: string;
	readonly urlPath: string;
	readonly publisherName: string;
	readonly datasets: readonly DataCatalogDatasetRef[];
	readonly inLanguage?: string;
}

function stripTrailingSlash(s: string): string {
	return s.replace(/\/+$/, '');
}

function ensureLeadingSlash(s: string): string {
	return s.startsWith('/') ? s : `/${s}`;
}

export function buildDataCatalog(input: DataCatalogInput): DataCatalogJsonLd {
	const origin = stripTrailingSlash(input.origin);
	const path = ensureLeadingSlash(input.urlPath);
	return {
		'@context': 'https://schema.org',
		'@type': 'DataCatalog',
		name: input.name,
		description: input.description,
		url: `${origin}${path}`,
		inLanguage: input.inLanguage ?? 'de-DE',
		publisher: {
			'@type': 'Person',
			name: input.publisherName
		},
		dataset: input.datasets.map((ds) => ({
			'@type': 'Dataset' as const,
			name: ds.name,
			url: `${origin}${ensureLeadingSlash(ds.urlPath)}`,
			license: licenseToSchemaOrgUrl(ds.license)
		}))
	};
}
