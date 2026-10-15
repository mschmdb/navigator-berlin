import type { GeoCoordinates, PropertyValue, WithContext } from 'schema-dts';
import type { Locale } from '$lib/paraglide/runtime';
import { canonicalOrigin, localizedPathname } from './canonical.js';

/**
 * Place-Leaf-Type fuer mutable Builder-Output. Wir nutzen das Leaf-Interface direkt
 * (statt der schema-dts Place-Union mit `string`-Mitglied), damit Property-Access
 * im Test ohne Type-Narrowing funktioniert.
 */
export interface PlaceLeafJsonLd {
	'@type': 'Place';
	name: string;
	geo: GeoCoordinates;
	url?: string;
	'@id'?: string;
	containedInPlace?:
		| PlaceLeafJsonLd
		| { '@type': 'Place'; name: string }
		| { '@type': 'AdministrativeArea'; '@id': string; name?: string; url: string }
		| { '@type': 'City'; name: string; sameAs: string };
	additionalProperty?: PropertyValue[];
	sameAs?: string[];
}

/**
 * Story 2.2 T3.2: Place-JSON-LD.
 *
 * Konsumenten: Kiez-Pages (Story 2.4), Bezirk-Pages (Story 2.3 via
 * `buildAdministrativeArea`). Generator hier ist die Basis fuer beides;
 * AdministrativeArea ergaenzt typ-spezifische Felder.
 */
/** Berlin als Stadt-Entität (Wikidata Q64), Elternknoten der Bezirke. */
export const BERLIN_CITY = {
	'@type': 'City',
	name: 'Berlin',
	sameAs: 'https://www.wikidata.org/wiki/Q64'
} as const;

export interface PlaceInput {
	/** Absolute Origin ohne trailing-slash. */
	readonly origin: string;
	readonly name: string;
	/** [lng, lat] in WGS84 (Turf-Konvention). */
	readonly centroid: readonly [number, number];
	/** Optional Parent-Place-Name (z. B. Bezirk fuer Kiez). */
	readonly containedInPlaceName?: string;
	/** Optional. Mit Slug + Pfad der Elternseite verweist `containedInPlace` per `@id` und `url` darauf. */
	readonly containedInPlaceRef?: { readonly slug: string; readonly urlBasePath: string };
	/** Optional. Setzt Berlin als `City` mit Wikidata-`sameAs` als Elternknoten. */
	readonly containedInCity?: boolean;
	/** Optional Slug + Pfad-Praefix fuer Place.url. */
	readonly slug?: string;
	readonly urlBasePath?: string;
	/** Optional Einwohnerzahl als PropertyValue. */
	readonly einwohner?: number;
	/** Optional Flaeche in Hektar als PropertyValue. */
	readonly flaecheHa?: number;
	/** Optional sameAs-Entitäts-Links (Wikidata/Wikipedia). Story 11.1. Nur
	 * gesetzt wenn die Entität verifiziert dieselbe ist (z. B. Bezirk → Wikidata-
	 * Bezirk). Leeres/fehlendes Array → kein sameAs (kein erfundener Link). */
	readonly sameAs?: readonly string[];
	/**
	 * i18n Block D1: Seiten-Locale. Sie präfigiert `Place.url` (`/en/kiez/...`).
	 * Ohne Angabe bleibt die URL unpräfigiert (DE).
	 */
	readonly locale?: Locale;
	/**
	 * i18n Block D1: lokalisierte `additionalProperty`-Namen. Ohne Angabe
	 * bleiben die bisherigen Schlüssel `einwohner` und `flaecheHa`.
	 */
	readonly propertyNames?: { readonly einwohner: string; readonly flaecheHa: string };
}

export type PlaceJsonLd = WithContext<PlaceLeafJsonLd>;

export function buildPlace(input: PlaceInput): PlaceJsonLd {
	const origin = canonicalOrigin(input.origin);
	const geo: GeoCoordinates = {
		'@type': 'GeoCoordinates',
		latitude: input.centroid[1],
		longitude: input.centroid[0]
	};

	const props: PropertyValue[] = [];
	if (typeof input.einwohner === 'number') {
		props.push({
			'@type': 'PropertyValue',
			name: input.propertyNames?.einwohner ?? 'einwohner',
			value: input.einwohner
		});
	}
	if (typeof input.flaecheHa === 'number') {
		props.push({
			'@type': 'PropertyValue',
			name: input.propertyNames?.flaecheHa ?? 'flaecheHa',
			value: input.flaecheHa
		});
	}

	const out: PlaceJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Place',
		name: input.name,
		geo
	};

	const toPath = (base: string, slug: string): string => {
		const basePath = base.startsWith('/') ? base : `/${base}`;
		return `${basePath}/${slug}`;
	};
	const toUrl = (path: string): string =>
		`${origin}${input.locale ? localizedPathname(path, input.locale) : path}`;
	// `@id` bleibt je Sprache gleich (unlokalisierter Pfad), nur `url` folgt der Locale.
	const toId = (path: string): string => `${origin}${path}#place`;

	const ref = input.containedInPlaceRef;
	if (ref) {
		const parentPath = toPath(ref.urlBasePath, ref.slug);
		out.containedInPlace = {
			'@type': 'AdministrativeArea',
			'@id': toId(parentPath),
			...(input.containedInPlaceName ? { name: input.containedInPlaceName } : {}),
			url: toUrl(parentPath)
		};
	} else if (input.containedInCity) {
		out.containedInPlace = { ...BERLIN_CITY };
	} else if (input.containedInPlaceName) {
		out.containedInPlace = { '@type': 'Place', name: input.containedInPlaceName };
	}
	if (input.slug && input.urlBasePath) {
		const path = toPath(input.urlBasePath, input.slug);
		out.url = toUrl(path);
		out['@id'] = toId(path);
	}
	if (props.length > 0) {
		out.additionalProperty = props;
	}
	if (input.sameAs && input.sameAs.length > 0) {
		out.sameAs = [...input.sameAs];
	}
	return out;
}
