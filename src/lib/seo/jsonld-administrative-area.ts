import type { GeoCoordinates, PropertyValue, WithContext } from 'schema-dts';
import { buildPlace, type PlaceInput, type PlaceLeafJsonLd } from './jsonld-place.js';

/**
 * Story 2.2 T3.3: AdministrativeArea-JSON-LD.
 *
 * Konsumenten: Bezirk-Pages (Story 2.3). AdministrativeArea ist ein Schema.org-
 * Subtyp von Place, semantisch korrekter fuer Verwaltungs-Einheiten (Bezirk,
 * Ortsteil) als generisches Place. Wiederverwendet `buildPlace`-Logik fuer
 * GeoCoordinates + additionalProperty + containedInPlace.
 */
export type AdministrativeAreaInput = PlaceInput;

export interface AdministrativeAreaLeafJsonLd extends Omit<PlaceLeafJsonLd, '@type'> {
	'@type': 'AdministrativeArea';
	geo: GeoCoordinates;
	additionalProperty?: PropertyValue[];
}

export type AdministrativeAreaJsonLd = WithContext<AdministrativeAreaLeafJsonLd>;

export function buildAdministrativeArea(input: AdministrativeAreaInput): AdministrativeAreaJsonLd {
	const base = buildPlace(input);
	return {
		...base,
		'@type': 'AdministrativeArea'
	};
}
