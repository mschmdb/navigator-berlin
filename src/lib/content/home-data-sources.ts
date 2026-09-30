/**
 * Story 2.12 T2: Daten-Quellen-Block-Content für die Home-Landing.
 *
 * 6 zentrale offene Daten-Anbieter mit Lizenz-Marker. Liste ist editorial,
 * NICHT auto-generiert aus dem Manifest — sie soll die wichtigsten Anbieter
 * sichtbar machen, nicht alle 44 Layer einzeln. „Alle 44 Quellen"-Link
 * verweist auf `/lizenzen` (Story 4.5).
 *
 * i18n Block B2: `name` bleibt Institutions-Eigenname (unübersetzt),
 * `license` bleibt Datenschlüssel/Badge (unübersetzt). `description` ist
 * echter UI-Text, aufgelöst über `homeDataSourceDescription()`.
 */
import { m } from '$lib/paraglide/messages.js';
import {
	toMessageOptions,
	assertUnreachable,
	type LocaleOptions
} from '$lib/i18n/message-options.js';

export const HOME_DATA_SOURCE_IDS = [
	'odis-berlin',
	'senmvku-umweltatlas',
	'openstreetmap',
	'dwd-climate-data-center',
	'senstadt-mietspiegel',
	'geoportal-berlin-fis-broker'
] as const;
export type HomeDataSourceId = (typeof HOME_DATA_SOURCE_IDS)[number];

export interface HomeDataSource {
	readonly id: HomeDataSourceId;
	readonly name: string;
	readonly license: string;
}

export const HOME_DATA_SOURCES: readonly HomeDataSource[] = [
	{ id: 'odis-berlin', name: 'ODIS Berlin', license: 'dl-de/zero-2-0' },
	{ id: 'senmvku-umweltatlas', name: 'SenMVKU · Umweltatlas', license: 'dl-de/zero-2-0' },
	{ id: 'openstreetmap', name: 'OpenStreetMap', license: 'ODbL 1.0' },
	{ id: 'dwd-climate-data-center', name: 'DWD · Climate Data Center', license: 'CC BY 4.0' },
	{ id: 'senstadt-mietspiegel', name: 'SenStadt · Mietspiegel', license: 'dl-de/zero-2-0' },
	{
		id: 'geoportal-berlin-fis-broker',
		name: 'Geoportal Berlin · FIS-Broker',
		license: 'dl-de/zero-2-0'
	}
];

export function homeDataSourceDescription(id: HomeDataSourceId, o?: LocaleOptions): string {
	const options = toMessageOptions(o);
	switch (id) {
		case 'odis-berlin':
			return m.home_data_source_odis_berlin_description(undefined, options);
		case 'senmvku-umweltatlas':
			return m.home_data_source_senmvku_umweltatlas_description(undefined, options);
		case 'openstreetmap':
			return m.home_data_source_openstreetmap_description(undefined, options);
		case 'dwd-climate-data-center':
			return m.home_data_source_dwd_climate_data_center_description(undefined, options);
		case 'senstadt-mietspiegel':
			return m.home_data_source_senstadt_mietspiegel_description(undefined, options);
		case 'geoportal-berlin-fis-broker':
			return m.home_data_source_geoportal_berlin_fis_broker_description(undefined, options);
		default:
			return assertUnreachable(id);
	}
}
