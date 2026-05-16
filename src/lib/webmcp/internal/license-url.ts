/**
 * Lokales License-zu-URL-Mapping für die Tool-Outputs.
 *
 * Bis Story 2.2 einen zentralen `licenseToSchemaOrgUrl`-Helper publiziert,
 * liefert dieser Helper kanonische Lizenz-URLs für die im Projekt verwendeten
 * License-Varianten (siehe `scripts/lib/types.ts`).
 *
 * Wenn 2.2 fertig ist, dieser Helper auf den zentralen umgestellt werden.
 */

import type { License } from '$lib/data';

const LICENSE_URLS: Record<License, string> = {
	'dl-de/zero-2-0': 'https://www.govdata.de/dl-de/zero-2-0',
	'dl-de/by-2-0': 'https://www.govdata.de/dl-de/by-2-0',
	'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
	'ODbL 1.0': 'https://opendatacommons.org/licenses/odbl/1-0/',
	Geodatenzugangsgesetz: 'https://www.gesetze-im-internet.de/geozg/'
};

export function licenseToUrl(license: License): string {
	return LICENSE_URLS[license];
}
