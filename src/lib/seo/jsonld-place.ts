import type { GeoCoordinates, PropertyValue, WithContext } from 'schema-dts';

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
	containedInPlace?: PlaceLeafJsonLd | { '@type': 'Place'; name: string };
	additionalProperty?: PropertyValue[];
}

/**
 * Story 2.2 T3.2: Place-JSON-LD.
 *
 * Konsumenten: Kiez-Pages (Story 2.4), Bezirk-Pages (Story 2.3 via
 * `buildAdministrativeArea`). Generator hier ist die Basis fuer beides;
 * AdministrativeArea ergaenzt typ-spezifische Felder.
 */
export interface PlaceInput {
	/** Absolute Origin ohne trailing-slash. */
	readonly origin: string;
	readonly name: string;
	/** [lng, lat] in WGS84 (Turf-Konvention). */
	readonly centroid: readonly [number, number];
	/** Optional Parent-Place-Name (z. B. Bezirk fuer Kiez). */
	readonly containedInPlaceName?: string;
	/** Optional Slug + Pfad-Praefix fuer Place.url. */
	readonly slug?: string;
	readonly urlBasePath?: string;
	/** Optional Einwohnerzahl als PropertyValue. */
	readonly einwohner?: number;
	/** Optional Flaeche in Hektar als PropertyValue. */
	readonly flaecheHa?: number;
}

export type PlaceJsonLd = WithContext<PlaceLeafJsonLd>;

export function buildPlace(input: PlaceInput): PlaceJsonLd {
	const origin = input.origin.replace(/\/+$/, '');
	const geo: GeoCoordinates = {
		'@type': 'GeoCoordinates',
		latitude: input.centroid[1],
		longitude: input.centroid[0]
	};

	const props: PropertyValue[] = [];
	if (typeof input.einwohner === 'number') {
		props.push({ '@type': 'PropertyValue', name: 'einwohner', value: input.einwohner });
	}
	if (typeof input.flaecheHa === 'number') {
		props.push({ '@type': 'PropertyValue', name: 'flaecheHa', value: input.flaecheHa });
	}

	const out: PlaceJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Place',
		name: input.name,
		geo
	};

	if (input.containedInPlaceName) {
		out.containedInPlace = { '@type': 'Place', name: input.containedInPlaceName };
	}
	if (input.slug && input.urlBasePath) {
		const basePath = input.urlBasePath.startsWith('/')
			? input.urlBasePath
			: `/${input.urlBasePath}`;
		out.url = `${origin}${basePath}/${input.slug}`;
	}
	if (props.length > 0) {
		out.additionalProperty = props;
	}
	return out;
}
