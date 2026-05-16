import type { WithContext } from 'schema-dts';

/**
 * WebSite + SearchAction-Leaf-Type fuer Builder-Output. schema-dts modelliert
 * SearchAction-`query-input` als Dash-Property; wir typen das hier explizit, damit
 * die Property-Initialisierung type-safe ist und Index-Access in Tests funktioniert.
 */
export interface WebSiteSearchActionJsonLd {
	'@type': 'SearchAction';
	target: {
		'@type': 'EntryPoint';
		urlTemplate: string;
	};
	'query-input': string;
}

export interface WebSiteLeafJsonLd {
	'@type': 'WebSite';
	name: string;
	url: string;
	description: string;
	inLanguage: string;
	potentialAction: WebSiteSearchActionJsonLd;
}

export type WebSiteJsonLd = WithContext<WebSiteLeafJsonLd>;

/**
 * Story 2.2 T3.1: WebSite-JSON-LD inkl. SearchAction.
 *
 * Konsumenten: Root-Layout (`src/routes/+layout.svelte`).
 * Story 2.11 Pivot: Atlas wandert von `/` auf `/explore`. Aktuell zeigt
 * `urlTemplate` auf `/` weil Phase 1 noch `/` = Atlas-Landing ist. Sobald 2.11
 * gemerged ist, kann ueber `searchPath: '/explore'` umgeschaltet werden.
 *
 * Phase 1 DE-only (Memory `project_i18n_phase_1_de_only`): `inLanguage: 'de-DE'`
 * Default; EN-Variante kommt mit Story 3.2.
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
	/** Optional. Pfad fuer SearchAction-Einstieg. Default `/`.
	 * Mit Story 2.11 Atlas-Pivot zu `/explore` wechseln. */
	readonly searchPath?: string;
}

export function buildWebSite(input: WebSiteInput): WebSiteJsonLd {
	const origin = input.origin.replace(/\/+$/, '');
	const path = input.searchPath ?? '/';
	const urlTemplate = `${origin}${path}?address={search_term_string}`;

	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: input.name,
		url: origin,
		description: input.description,
		inLanguage: input.locale,
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate
			},
			'query-input': 'required name=search_term_string'
		}
	};
}
