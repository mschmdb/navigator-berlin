export type WahlTyp = 'btw' | 'agh' | 'bvv';
export type WahlKind = 'bwl-csv' | 'sbb-xlsx' | 'wb-csv';

/** wb-csv: Datenexport-CSV + DSB-Legende (Datensatzbeschreibung) für einen Stimmtyp. */
export type WbCsvFiles = {
	readonly data: string;
	readonly legend: string;
};

export type WahlSource = {
	readonly slug: string;
	readonly wahl: WahlTyp;
	readonly jahr: number;
	readonly url: string;
	readonly license: string;
	readonly licenseShort: string;
	readonly kind: WahlKind;
	/** Für sbb-xlsx: Name der Erststimmen-/Stimme-Sheet im Workbook */
	readonly sheetErst?: string;
	/** Für sbb-xlsx: Name der Zweitstimmen-Sheet im Workbook (nicht bei BVV) */
	readonly sheetZweit?: string;
	/** Für sbb-xlsx (BVV nur): kombinierte Sheet ohne Erst/Zweit-Split */
	readonly sheetEin?: string;
	/** Für wb-csv: Erststimme-Datenexport + DSB-Legende */
	readonly wbCsvErst?: WbCsvFiles;
	/** Für wb-csv: Zweitstimme-Datenexport + DSB-Legende (nicht bei BVV) */
	readonly wbCsvZweit?: WbCsvFiles;
	/** Für wb-csv (BVV nur): kombinierter Datenexport + DSB-Legende ohne Erst/Zweit-Split */
	readonly wbCsvEin?: WbCsvFiles;
	/** Wiederholungswahl-Marker */
	readonly isRepeatElection?: boolean;
	/** Slug der Eltern-Wahl bei Wiederholung */
	readonly parentSlug?: string;
	/**
	 * Vorläufiges Ergebnis (Matze-Entscheidung 23.09., 1B): explizites
	 * Config-Flag statt Text-Heuristik. Re-Ingest mit `vorlaeufig: false`
	 * (oder Feld entfernen) ist beim Endergebnis Pflicht.
	 */
	readonly vorlaeufig?: boolean;
};

const BWL_LICENSE = 'Datenlizenz Deutschland Namensnennung 2.0 (Bundeswahlleiterin)';
const BWL_LICENSE_SHORT = 'dl-de/by-2.0';
const SBB_LICENSE =
	'Datenlizenz Deutschland Namensnennung 2.0 (Amt für Statistik Berlin-Brandenburg)';

export const BWL_BTW13_WBZ: WahlSource = {
	slug: 'btw13',
	wahl: 'btw',
	jahr: 2013,
	url: 'https://bundeswahlleiterin.de/dam/jcr/0ad35576-0c4b-4fa5-85f5-284618b8fa25/btw13_wbz.zip',
	license: BWL_LICENSE,
	licenseShort: BWL_LICENSE_SHORT,
	kind: 'bwl-csv'
};

export const BWL_BTW17_WBZ: WahlSource = {
	slug: 'btw17',
	wahl: 'btw',
	jahr: 2017,
	url: 'https://bundeswahlleiterin.de/dam/jcr/a2eef6bd-0225-447c-9943-7af0f46c94d1/btw17_wbz.zip',
	license: BWL_LICENSE,
	licenseShort: BWL_LICENSE_SHORT,
	kind: 'bwl-csv'
};

export const BWL_BTW21_WBZ: WahlSource = {
	slug: 'btw21',
	wahl: 'btw',
	jahr: 2021,
	url: 'https://bundeswahlleiterin.de/dam/jcr/c2cd99e6-064e-4ebc-b634-f86b5c0e14b3/btw21_wbz.zip',
	license: BWL_LICENSE,
	licenseShort: BWL_LICENSE_SHORT,
	kind: 'bwl-csv'
};

export const BWL_BTW25_WBZ: WahlSource = {
	slug: 'btw25',
	wahl: 'btw',
	jahr: 2025,
	url: 'https://bundeswahlleiterin.de/dam/jcr/e79a7bd3-0607-4e87-9752-8e601e299e00/btw25_wbz.zip',
	license: BWL_LICENSE,
	licenseShort: BWL_LICENSE_SHORT,
	kind: 'bwl-csv'
};

const SBB_AB2011_URL =
	'https://download.statistik-berlin-brandenburg.de/d9502c352fcd146a/fbe7434dddd2/DL_BE_AB2011.xlsx';
const SBB_AH2016_URL =
	'https://download.statistik-berlin-brandenburg.de/9a30c44fd09550bd/08c09bad46f6/DL_BE_EE_WB_AH2016.xlsx';
const SBB_AGHBVV2021_URL =
	'https://download.statistik-berlin-brandenburg.de/641b9780548f801f/c1f241717b0f/DL_BE_AGHBVV2021.xlsx';
const SBB_AGHBVV2023_URL =
	'https://download.statistik-berlin-brandenburg.de/c6fffa8361dd1404/a8cc1bc593d9/DL_BE_AGHBVV2023.xlsx';

export const SBB_AGH2011: WahlSource = {
	slug: 'agh11',
	wahl: 'agh',
	jahr: 2011,
	url: SBB_AB2011_URL,
	license: SBB_LICENSE,
	licenseShort: 'dl-de/by-2.0',
	kind: 'sbb-xlsx',
	sheetErst: 'Erststimme',
	sheetZweit: 'Zweitstimme'
};

export const SBB_BVV2011: WahlSource = {
	slug: 'bvv11',
	wahl: 'bvv',
	jahr: 2011,
	url: SBB_AB2011_URL,
	license: SBB_LICENSE,
	licenseShort: 'dl-de/by-2.0',
	kind: 'sbb-xlsx',
	sheetEin: 'BVV'
};

export const SBB_AGH2016: WahlSource = {
	slug: 'agh16',
	wahl: 'agh',
	jahr: 2016,
	url: SBB_AH2016_URL,
	license: SBB_LICENSE,
	licenseShort: 'dl-de/by-2.0',
	kind: 'sbb-xlsx',
	sheetErst: 'Erststimme',
	sheetZweit: 'Zweitstimme'
};

export const SBB_BVV2016: WahlSource = {
	slug: 'bvv16',
	wahl: 'bvv',
	jahr: 2016,
	url: SBB_AH2016_URL,
	license: SBB_LICENSE,
	licenseShort: 'dl-de/by-2.0',
	kind: 'sbb-xlsx',
	sheetEin: 'BVV'
};

export const SBB_AGH2021: WahlSource = {
	slug: 'agh21',
	wahl: 'agh',
	jahr: 2021,
	url: SBB_AGHBVV2021_URL,
	license: SBB_LICENSE,
	licenseShort: 'dl-de/by-2.0',
	kind: 'sbb-xlsx',
	sheetErst: 'AGH_W1',
	sheetZweit: 'AGH_W2'
};

export const SBB_BVV2021: WahlSource = {
	slug: 'bvv21',
	wahl: 'bvv',
	jahr: 2021,
	url: SBB_AGHBVV2021_URL,
	license: SBB_LICENSE,
	licenseShort: 'dl-de/by-2.0',
	kind: 'sbb-xlsx',
	sheetEin: 'BVV'
};

export const SBB_AGH2023: WahlSource = {
	slug: 'agh23',
	wahl: 'agh',
	jahr: 2023,
	url: SBB_AGHBVV2023_URL,
	license: SBB_LICENSE,
	licenseShort: 'dl-de/by-2.0',
	kind: 'sbb-xlsx',
	sheetErst: 'AGH_W1',
	sheetZweit: 'AGH_W2',
	isRepeatElection: true,
	parentSlug: 'agh21'
};

export const SBB_BVV2023: WahlSource = {
	slug: 'bvv23',
	wahl: 'bvv',
	jahr: 2023,
	url: SBB_AGHBVV2023_URL,
	license: SBB_LICENSE,
	licenseShort: 'dl-de/by-2.0',
	kind: 'sbb-xlsx',
	sheetEin: 'BVV',
	isRepeatElection: true,
	parentSlug: 'bvv21'
};

const WB_LICENSE = 'Datenlizenz Deutschland Namensnennung 2.0 (Landeswahlleiterin Berlin)';
const WB_LICENSE_SHORT = 'dl-de/by-2.0';
const WB_AGH26_BASE = 'https://www.wahlen-berlin.de/wahlen/BE2026/Afspraes/AGH';
const WB_BVV26_BASE = 'https://www.wahlen-berlin.de/wahlen/BE2026/Afspraes/bvv';

export const WB_AGH2026: WahlSource = {
	slug: 'agh26',
	wahl: 'agh',
	jahr: 2026,
	url: `${WB_AGH26_BASE}/ergebnisse_nach_wahlbezirk.html`,
	license: WB_LICENSE,
	licenseShort: WB_LICENSE_SHORT,
	kind: 'wb-csv',
	wbCsvErst: {
		data: `${WB_AGH26_BASE}/Datenexport_AGH2026_Erststimme_W_BE.csv`,
		legend: `${WB_AGH26_BASE}/DSB/DSB_Datenexport_AGH2026_Erststimme_W_BE.csv`
	},
	wbCsvZweit: {
		data: `${WB_AGH26_BASE}/Datenexport_AGH2026_Zweitstimme_W_BE.csv`,
		legend: `${WB_AGH26_BASE}/DSB/DSB_Datenexport_AGH2026_Zweitstimme_W_BE.csv`
	},
	vorlaeufig: true
};

export const WB_BVV2026: WahlSource = {
	slug: 'bvv26',
	wahl: 'bvv',
	jahr: 2026,
	url: `${WB_BVV26_BASE}/ergebnisse_nach_wahlbezirk.html`,
	license: WB_LICENSE,
	licenseShort: WB_LICENSE_SHORT,
	kind: 'wb-csv',
	wbCsvEin: {
		data: `${WB_BVV26_BASE}/Datenexport_BVV2026_Stimme_W_BE.csv`,
		legend: `${WB_BVV26_BASE}/DSB/DSB_Datenexport_BVV2026_Stimme_W_BE.csv`
	},
	vorlaeufig: true
};

export const WAHL_SOURCES: readonly WahlSource[] = [
	BWL_BTW13_WBZ,
	BWL_BTW17_WBZ,
	BWL_BTW21_WBZ,
	BWL_BTW25_WBZ,
	SBB_AGH2011,
	SBB_BVV2011,
	SBB_AGH2016,
	SBB_BVV2016,
	SBB_AGH2021,
	SBB_BVV2021,
	SBB_AGH2023,
	SBB_BVV2023,
	WB_AGH2026,
	WB_BVV2026
];
