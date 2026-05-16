import type { License } from '$lib/data/types.js';

/**
 * Story 2.2 T1.2: Mappt Manifest-License-Codes auf kanonische Schema.org-License-URLs.
 *
 * Source-of-Truth: `_bmad-output/implementation-artifacts/2-2-json-ld-generator-bibliothek.md`
 * License-Mapping-Tabelle. Wenn Manifest neue License-Typen einführt: hier ergänzen
 * (Helper wirft sonst), und `scripts/lib/types.ts::License`-Union ergänzen.
 */
const LICENSE_URL_MAP: Readonly<Record<License, string>> = {
	'dl-de/zero-2-0': 'https://www.govdata.de/dl-de/zero-2-0',
	'dl-de/by-2-0': 'https://www.govdata.de/dl-de/by-2-0',
	'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
	'ODbL 1.0': 'https://opendatacommons.org/licenses/odbl/1-0/',
	// Geodatenzugangsgesetz Berlin (GeoZG-Bln): kein offizieller Lizenz-URL-Endpoint,
	// wir verweisen auf das Gesetz als zitierbare Quelle.
	Geodatenzugangsgesetz:
		'https://gesetze.berlin.de/perma?j=GeoZG_BE'
};

export function licenseToSchemaOrgUrl(license: License): string {
	const url = LICENSE_URL_MAP[license];
	if (!url) {
		throw new Error(
			`Unmapped license: "${String(license)}". Bitte in src/lib/seo/license-url.ts ergaenzen.`
		);
	}
	return url;
}
