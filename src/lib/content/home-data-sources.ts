/**
 * Story 2.12 T2: Daten-Quellen-Block-Content für die Home-Landing.
 *
 * 6 zentrale offene Daten-Anbieter mit Lizenz-Marker. Liste ist editorial,
 * NICHT auto-generiert aus dem Manifest — sie soll die wichtigsten Anbieter
 * sichtbar machen, nicht alle 44 Layer einzeln. „Alle 44 Quellen"-Link
 * verweist auf `/lizenzen` (Story 4.5).
 */
export interface HomeDataSource {
	readonly name: string;
	readonly description: string;
	readonly license: string;
}

export const HOME_DATA_SOURCES: readonly HomeDataSource[] = [
	{
		name: 'ODIS Berlin',
		description: 'Open Data Informationsstelle · Bezirks- und LOR-Geometrien.',
		license: 'dl-de/zero-2-0'
	},
	{
		name: 'SenMVKU · Umweltatlas',
		description: 'Lärmkartierung, Klima-Atlas, Grünversorgung, Bioklima.',
		license: 'dl-de/zero-2-0'
	},
	{
		name: 'OpenStreetMap',
		description: 'Adress-Geocoding, POI-Daten, ÖPNV-Halte und -Netze.',
		license: 'ODbL 1.0'
	},
	{
		name: 'DWD · Climate Data Center',
		description: 'Historische Klima-Zeitreihen der Berliner Wetterstationen.',
		license: 'CC BY 4.0'
	},
	{
		name: 'SenStadt · Mietspiegel',
		description: 'Wohnlagen 2024 + Monitoring Soziale Stadtentwicklung 2025.',
		license: 'dl-de/zero-2-0'
	},
	{
		name: 'Geoportal Berlin · FIS-Broker',
		description: 'Denkmal-Datenbank, Bauleitplanung, Grundstückswerte.',
		license: 'dl-de/zero-2-0'
	}
];
