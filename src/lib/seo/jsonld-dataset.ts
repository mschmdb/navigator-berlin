import type { WithContext } from 'schema-dts';
import type { License } from '$lib/data/types.js';
import { licenseToSchemaOrgUrl } from './license-url.js';

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

export interface DatasetLeafJsonLd {
	'@type': 'Dataset';
	name: string;
	description: string;
	license: string;
	dateModified: string;
	creator: DatasetCreatorJsonLd;
	distribution: DatasetDistributionJsonLd;
	inLanguage: string;
	keywords?: string;
}

export type DatasetJsonLd = WithContext<DatasetLeafJsonLd>;

/**
 * Story 2.2 T3.4: Dataset-JSON-LD fuer Layer-Detail-Pages.
 *
 * Konsumenten: `routes/(with-header)/layer/[slug]/+page.svelte` (DE-Variante,
 * diese Story), Story 2.5a (EN-Variante, gleiches Builder, andere `inLanguage`).
 *
 * Phase 1 DE-only (Memory `project_i18n_phase_1_de_only`): `inLanguage` Default
 * `'de-DE'`; EN-Bundle kommt Story 3.2/2.5a.
 *
 * Open-Decision aus Story-Spec geklaert: falls `creatorName` fehlt → Fallback auf
 * `Organization { name: 'navigator.berlin', url: origin }`. Layer wird NICHT geskippt.
 */
export interface DatasetInput {
	readonly origin: string;
	readonly name: string;
	readonly description: string;
	readonly license: License;
	/** ISO-8601 oder `YYYY-MM-DD`. */
	readonly dateModified: string;
	/** Optional. Authority-Name aus Layer-Methodology. Wenn leer: Fallback navigator.berlin. */
	readonly creatorName?: string;
	/** Absolute URL zur Distribution (typisch hashed-filename in `/layers/`). */
	readonly contentUrl: string;
	/** MIME-Type fuer DataDownload, z. B. `application/geo+json`. */
	readonly encodingFormat?: string;
	readonly keywords?: readonly string[];
	/** BCP-47-Locale, Default `'de-DE'`. */
	readonly inLanguage?: string;
}

export function buildDataset(input: DatasetInput): DatasetJsonLd {
	const origin = input.origin.replace(/\/+$/, '');

	const creator: DatasetCreatorJsonLd = input.creatorName
		? { '@type': 'Organization', name: input.creatorName }
		: { '@type': 'Organization', name: 'navigator.berlin', url: origin };

	const out: DatasetJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: input.name,
		description: input.description,
		license: licenseToSchemaOrgUrl(input.license),
		dateModified: input.dateModified,
		creator,
		distribution: {
			'@type': 'DataDownload',
			contentUrl: input.contentUrl,
			...(input.encodingFormat ? { encodingFormat: input.encodingFormat } : {})
		},
		inLanguage: input.inLanguage ?? 'de-DE'
	};

	const kws = input.keywords?.filter((k) => k.length > 0) ?? [];
	if (kws.length > 0) {
		out.keywords = kws.join(', ');
	}
	return out;
}
