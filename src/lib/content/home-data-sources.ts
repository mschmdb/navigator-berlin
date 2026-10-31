/**
 * Story 2.12 T2: Daten-Quellen-Block-Content für die Home-Landing.
 *
 * 6 zentrale offene Daten-Anbieter mit Lizenz-Marker. Liste ist editorial,
 * NICHT auto-generiert aus dem Manifest — sie soll die wichtigsten Anbieter
 * sichtbar machen, nicht alle 44 Layer einzeln.
 *
 * `name` bleibt Institutions-Eigenname (unübersetzt), `license` bleibt
 * Datenschlüssel/Badge (unübersetzt).
 */

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
	{ id: 'senmvku-umweltatlas', name: 'SenMVKU, Umweltatlas', license: 'dl-de/zero-2-0' },
	{ id: 'openstreetmap', name: 'OpenStreetMap', license: 'ODbL 1.0' },
	{ id: 'dwd-climate-data-center', name: 'DWD, Climate Data Center', license: 'CC BY 4.0' },
	{ id: 'senstadt-mietspiegel', name: 'SenStadt, Mietspiegel', license: 'dl-de/zero-2-0' },
	{
		id: 'geoportal-berlin-fis-broker',
		name: 'Geoportal Berlin, FIS-Broker',
		license: 'dl-de/zero-2-0'
	}
];
