import type { WithContext } from 'schema-dts';
import type { License } from '$lib/data/types.js';
import { licenseToSchemaOrgUrl } from './license-url.js';
import { DATA_CATALOG_NAME, dataCatalogId } from './jsonld-datacatalog.js';
import { bboxToGeoShapeBox, type BboxTuple } from './dataset-helpers.js';
import { organizationRef, type OrganizationRefJsonLd } from './jsonld-organization.js';

/**
 * Dataset-Leaf-Type fuer Builder-Output. schema-dts modelliert Dataset als
 * Union mit `string`; wir typen den Leaf hier direkt fuer einfache Property-
 * Initialisierung + Index-Access in Tests.
 */
export interface DatasetCreatorJsonLd {
	'@type': 'Organization';
	name: string;
	url?: string;
}

export interface DatasetDistributionJsonLd {
	'@type': 'DataDownload';
	contentUrl: string;
	encodingFormat?: string;
}

export interface DatasetSpatialCoverageJsonLd {
	'@type': 'Place';
	name: string;
	geo: { '@type': 'GeoShape'; box: string };
}

export interface DatasetLeafJsonLd {
	'@type': 'Dataset';
	'@id': string;
	name: string;
	url: string;
	isAccessibleForFree: true;
	includedInDataCatalog: { '@type': 'DataCatalog'; '@id': string; name: string; url: string };
	spatialCoverage?: DatasetSpatialCoverageJsonLd;
	temporalCoverage?: string;
	description: string;
	license: string;
	dateModified: string;
	creator: DatasetCreatorJsonLd | OrganizationRefJsonLd;
	distribution: DatasetDistributionJsonLd;
	inLanguage: string;
	keywords?: string;
}

export type DatasetJsonLd = WithContext<DatasetLeafJsonLd>;

/**
 * Story 2.2 T3.4: Dataset-JSON-LD fuer Layer-Detail-Pages.
 *
 * Konsumenten: `routes/(with-header)/layer/[slug]/+page.svelte`. Seit i18n
 * Block D1 übergibt die Seite `inLanguage` per `localeToBcp47` (`de-DE`,
 * `en-US`). Ohne Angabe gilt der Default `'de-DE'`.
 *
 * Open-Decision aus Story-Spec geklaert: falls `creatorName` fehlt → Fallback auf
 * `Organization { name: 'navigator.berlin', url: origin }`. Layer wird NICHT geskippt.
 */
export interface DatasetInput {
	readonly origin: string;
	readonly name: string;
	/** Absolute Canonical-URL der Seite, Basis der Dataset-`@id` (`<url>#dataset`). */
	readonly url: string;
	readonly description: string;
	readonly license: License;
	/** ISO-8601 oder `YYYY-MM-DD`. */
	readonly dateModified: string;
	/** Optional. Authority-Name aus Layer-Methodology. Wenn leer: Fallback navigator.berlin. */
	readonly creatorName?: string;
	/** Origin der Datenquelle, wird `creator.url`. Nur mit `creatorName` wirksam. */
	readonly creatorUrl?: string;
	/** Berlin-Bounding-Box [minLng, minLat, maxLng, maxLat]. Fehlt sie: kein `spatialCoverage`. */
	readonly bbox?: BboxTuple;
	/** Jahr oder ISO-Intervall. Nur setzen, wenn belegt. */
	readonly temporalCoverage?: string;
	/** Absolute URL zur Distribution (stabil, z. B. `/daten/<slug>.geojson`). */
	readonly contentUrl: string;
	/** MIME-Type fuer DataDownload, z. B. `application/geo+json`. */
	readonly encodingFormat?: string;
	readonly keywords?: readonly string[];
	/** BCP-47-Locale, Default `'de-DE'`. */
	readonly inLanguage?: string;
}

/** Knoten-`@id` eines Datasets: Seiten-URL plus Fragment. Der Katalog verweist auf dieselbe `@id`. */
export function datasetId(url: string): string {
	return `${url}#dataset`;
}

export function buildDataset(input: DatasetInput): DatasetJsonLd {
	const origin = input.origin.replace(/\/+$/, '');

	const creator: DatasetCreatorJsonLd | OrganizationRefJsonLd = input.creatorName
		? {
				'@type': 'Organization',
				name: input.creatorName,
				...(input.creatorUrl ? { url: input.creatorUrl } : {})
			}
		: organizationRef(origin);

	const out: DatasetJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		'@id': datasetId(input.url),
		name: input.name,
		url: input.url,
		description: input.description,
		license: licenseToSchemaOrgUrl(input.license),
		dateModified: input.dateModified,
		creator,
		distribution: {
			'@type': 'DataDownload',
			contentUrl: input.contentUrl,
			...(input.encodingFormat ? { encodingFormat: input.encodingFormat } : {})
		},
		inLanguage: input.inLanguage ?? 'de-DE',
		isAccessibleForFree: true,
		includedInDataCatalog: {
			'@type': 'DataCatalog',
			'@id': dataCatalogId(origin),
			name: DATA_CATALOG_NAME,
			url: dataCatalogId(origin).replace(/#catalog$/, '')
		}
	};

	if (input.bbox) {
		out.spatialCoverage = {
			'@type': 'Place',
			name: 'Berlin',
			geo: { '@type': 'GeoShape', box: bboxToGeoShapeBox(input.bbox) }
		};
	}
	if (input.temporalCoverage) out.temporalCoverage = input.temporalCoverage;

	const kws = input.keywords?.filter((k) => k.length > 0) ?? [];
	if (kws.length > 0) {
		out.keywords = kws.join(', ');
	}
	return out;
}
