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
	/** Pflicht fuer Schema.org-Dataset. Knappe Beschreibung (typisch `explain.short`). */
	readonly description: string;
	/** Relativer Pfad auf der Site, z. B. `/layer/laerm-2023`. */
	readonly urlPath: string;
	readonly license: License;
	/** Authority-Name aus Layer-Methodology. Fehlt → Fallback navigator.berlin. */
	readonly creatorName?: string;
}

export interface DataCatalogPublisherJsonLd {
	'@type': 'Person';
	name: string;
}

export interface DatasetCreatorJsonLd {
	'@type': 'Organization';
	name: string;
	url?: string;
}

/**
 * Vollstaendiges Dataset-Node im Katalog. Google inferiert `@type: Dataset` aus
 * der `dataset`-Property-Range, validiert also jeden Eintrag als Dataset und
 * verlangt `name` + `description` (kritisch). Eine reine `{ @id }`-Referenz
 * reicht NICHT (GSC 2026-05-29: 51 "Feld description fehlt"). `@id` = kanonische
 * Layer-Page-URL → Linked-Data-Merge mit dem dortigen Dataset-JSON-LD.
 */
export interface DataCatalogDatasetJsonLd {
	'@type': 'Dataset';
	'@id': string;
	name: string;
	description: string;
	url: string;
	license: string;
	creator: DatasetCreatorJsonLd;
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
		dataset: input.datasets.map((ds) => {
			const url = `${origin}${ensureLeadingSlash(ds.urlPath)}`;
			const creator: DatasetCreatorJsonLd = ds.creatorName
				? { '@type': 'Organization', name: ds.creatorName }
				: { '@type': 'Organization', name: 'navigator.berlin', url: origin };
			return {
				'@type': 'Dataset' as const,
				'@id': url,
				name: ds.name,
				description: ds.description,
				url,
				license: licenseToSchemaOrgUrl(ds.license),
				creator
			};
		})
	};
}
