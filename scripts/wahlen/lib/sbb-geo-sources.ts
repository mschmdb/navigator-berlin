/**
 * Wahlbezirks-Geometrie-Quellen vom Amt für Statistik Berlin-Brandenburg.
 *
 * Die `live`-URLs (/opendata/*.zip) sind JS-redirects via Scrivito-CMS und
 * liefern HTML statt ZIP bei direkten curl/fetch-Requests. Die `download`-URLs
 * sind die echten Hash-URLs auf dem Download-CDN.
 *
 * Recon-Pattern: page.goto(live) in Headless-Browser → ZIP-Response auf
 * download.statistik-berlin-brandenburg.de abfangen.
 */

export type GeoSource = {
	readonly slug: string;
	readonly download: string;
	readonly live: string;
	readonly license: string;
	readonly licenseShort: string;
	readonly attribution: string;
	/** Wahl-Slugs die diese Geometrie konsumieren (siehe scripts/wahlen/lib/sources.ts). */
	readonly consumesWahlen: readonly string[];
};

const SBB_LICENSE = 'Datenlizenz Deutschland Namensnennung 2.0 (Amt für Statistik Berlin-Brandenburg)';
const SBB_LICENSE_SHORT = 'dl-de/by-2.0';
const SBB_ATTRIBUTION = 'Amt für Statistik Berlin-Brandenburg';

export const GEO_BT25: GeoSource = {
	slug: 'bt25',
	download:
		'https://download.statistik-berlin-brandenburg.de/02b248184843fdea/8e31f1ff1cc9/RBS_OD_UWB_BT25.zip',
	live: 'https://www.statistik-berlin-brandenburg.de/opendata/RBS_OD_UWB_BT25.zip',
	license: SBB_LICENSE,
	licenseShort: SBB_LICENSE_SHORT,
	attribution: SBB_ATTRIBUTION,
	consumesWahlen: ['btw25']
};

/**
 * AGH 2023 / BVV 2023 = Wiederholungswahlen Sept 2023 auf den unveränderten
 * Wahlbezirken vom Sept 2021. Die separate ah23-Quelle enthält nur Wahllokal-
 * Punkte (RBS_OD_Wahllokale_AH23), die für Choropleth + Kiez-Mapping nicht
 * verwendbar sind. Konsum von 2023 läuft daher über die ah21-Polygone.
 */
export const GEO_AH21: GeoSource = {
	slug: 'ah21',
	download:
		'https://download.statistik-berlin-brandenburg.de/db8c83613aceb93e/14a42eb32a76/RBS_OD_UWB_AH21.zip',
	live: 'https://www.statistik-berlin-brandenburg.de/opendata/RBS_OD_UWB_AH21.zip',
	license: SBB_LICENSE,
	licenseShort: SBB_LICENSE_SHORT,
	attribution: SBB_ATTRIBUTION,
	consumesWahlen: ['btw21', 'agh21', 'bvv21', 'agh23', 'bvv23']
};

export const GEO_BTW17: GeoSource = {
	slug: 'btw17',
	download:
		'https://download.statistik-berlin-brandenburg.de/253a62a4ec4bd715/d2a5ad97d6f3/RBS_OD_Wahlgebiete_BTW17.zip',
	live: 'https://www.statistik-berlin-brandenburg.de/opendata/RBS_OD_Wahlgebiete_BTW17.zip',
	license: SBB_LICENSE,
	licenseShort: SBB_LICENSE_SHORT,
	attribution: SBB_ATTRIBUTION,
	consumesWahlen: ['btw17']
};

export const GEO_AH16: GeoSource = {
	slug: 'ah16',
	download:
		'https://download.statistik-berlin-brandenburg.de/151935287e405aaa/c7bcebf1a199/RBS_OD_UWB_AGH_09_2016.zip',
	live: 'https://www.statistik-berlin-brandenburg.de/opendata/RBS_OD_UWB_AGH_09_2016.zip',
	license: SBB_LICENSE,
	licenseShort: SBB_LICENSE_SHORT,
	attribution: SBB_ATTRIBUTION,
	consumesWahlen: ['agh16', 'bvv16']
};

export const GEO_SOURCES: readonly GeoSource[] = [
	GEO_BTW17,
	GEO_AH16,
	GEO_AH21,
	GEO_BT25
];

/**
 * Wahl-Slug → Geometry-Slug. Wahlen ohne Eintrag (z.B. btw13, agh11, bvv11)
 * haben keine verfügbare Geometrie und bleiben im Kiez-Aggregat leer.
 */
export const WAHL_TO_GEO: ReadonlyMap<string, string> = new Map(
	GEO_SOURCES.flatMap((g) => g.consumesWahlen.map((w) => [w, g.slug] as const))
);
