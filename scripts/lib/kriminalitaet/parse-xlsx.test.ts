import { describe, expect, it } from 'vitest';
import {
	canonicalizeDelikt,
	DEFAULT_DELIKTE,
	isBezirksregionKey,
	latestThreeHzSheetNames,
	listHzSheetNames,
	parseHzSheet,
	type SheetRow
} from './parse-xlsx.js';

// Header mit echter Silbentrennung aus dem Kriminalitätsatlas (Fahrrad- diebstahl etc.).
const HEADER: SheetRow = [
	'LOR-Schlüssel (Bezirksregion)',
	'Bezeichnung (Bezirksregion)',
	'Straftaten \r\n-insgesamt-',
	'Straßenraub,\r\nHandtaschen-raub',
	'Fahrrad- diebstahl',
	'Wohnraum- einbruch',
	'Sach-beschädigung -insgesamt-',
	'Sach-beschädigung durch Graffiti',
	'Kieztaten'
];

// aoa: vier Vorspann-Zeilen, dann Header (idx 4), dann Daten.
function fixtureAoa(): SheetRow[] {
	return [
		['Gesamtübersicht', null, null, null, null, null, null, null, null],
		['Häufigkeitszahlen', null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null, null],
		HEADER,
		// Bezirk (XX0000) -> ausschließen
		['010000', 'Mitte', 19921, 129, 300, 100, 800, 200, 5000],
		// Bezirksregion -> behalten
		['011001', 'Tiergarten Süd', 31960, 399, 410, 120, 950, 210, 6000],
		// Bezirksregion mit unterdrückter Zelle ('-') -> null
		['011002', 'Regierungsviertel', 46178, '-', 380, '-', 700, 150, 5500],
		// Bezirk-nicht-zuzuordnen (XX9900) -> ausschließen
		['019900', 'Bezirk (Mi), nicht zuzuordnen', '-', '-', '-', '-', '-', '-', '-'],
		// Berlin-Aggregate -> ausschließen
		['999900', 'Stadtgebiet Berlin, nicht zuzuordnen', 1, 1, 1, 1, 1, 1, 1],
		['999999', 'Berlin (PKS gesamt)', 12882, 100, 200, 80, 600, 150, 4000]
	];
}

describe('canonicalizeDelikt', () => {
	it('entfernt Whitespace, Silbentrennung, Komma und Slash', () => {
		expect(canonicalizeDelikt('Fahrrad- diebstahl')).toBe('fahrraddiebstahl');
		expect(canonicalizeDelikt('Wohnraum- einbruch')).toBe('wohnraumeinbruch');
		expect(canonicalizeDelikt('Straßenraub,\r\nHandtaschen-raub')).toBe(
			'straßenraubhandtaschenraub'
		);
		expect(canonicalizeDelikt('Sach-beschädigung -insgesamt-')).toBe('sachbeschädigunginsgesamt');
	});

	it('trennt -insgesamt- von Graffiti-Variante', () => {
		expect(canonicalizeDelikt('Sach-beschädigung -insgesamt-')).not.toBe(
			canonicalizeDelikt('Sach-beschädigung durch Graffiti')
		);
	});
});

describe('DEFAULT_DELIKTE', () => {
	it('enthält die fünf wohn-relevanten Delikte', () => {
		expect(DEFAULT_DELIKTE.map((d) => d.key)).toEqual([
			'kieztaten',
			'wohnraumeinbruch',
			'sachbeschaedigung',
			'strassenraub',
			'fahrraddiebstahl'
		]);
	});
});

describe('isBezirksregionKey', () => {
	it('akzeptiert echte Bezirksregionen', () => {
		expect(isBezirksregionKey('011001')).toBe(true);
		expect(isBezirksregionKey('126012')).toBe(true);
	});

	it('lehnt Bezirks-, nicht-zuzuordnen- und Berlin-Zeilen ab', () => {
		expect(isBezirksregionKey('010000')).toBe(false); // Bezirk
		expect(isBezirksregionKey('019900')).toBe(false); // Bezirk nicht zuzuordnen
		expect(isBezirksregionKey('999900')).toBe(false); // Stadtgebiet
		expect(isBezirksregionKey('999999')).toBe(false); // Berlin gesamt
	});

	it('lehnt fehlerhafte Schlüssel ab', () => {
		expect(isBezirksregionKey('')).toBe(false);
		expect(isBezirksregionKey('11001')).toBe(false); // zu kurz
		expect(isBezirksregionKey('abc123')).toBe(false);
	});
});

describe('listHzSheetNames / latestThreeHzSheetNames', () => {
	const sheets = [
		'Titel',
		'Inhaltsverzeichnis',
		'Fallzahlen_2016',
		'Fallzahlen_2025',
		'HZ_2016',
		'HZ_2023',
		'HZ_2024',
		'HZ_2025'
	];

	it('listet nur HZ-Sheets mit Jahr, aufsteigend', () => {
		expect(listHzSheetNames(sheets)).toEqual([
			{ name: 'HZ_2016', year: 2016 },
			{ name: 'HZ_2023', year: 2023 },
			{ name: 'HZ_2024', year: 2024 },
			{ name: 'HZ_2025', year: 2025 }
		]);
	});

	it('liefert die drei jüngsten HZ-Sheets', () => {
		expect(latestThreeHzSheetNames(sheets)).toEqual(['HZ_2023', 'HZ_2024', 'HZ_2025']);
	});

	it('wirft bei weniger als drei HZ-Sheets', () => {
		expect(() => latestThreeHzSheetNames(['HZ_2024', 'HZ_2025'])).toThrow(/drei/i);
	});
});

describe('parseHzSheet', () => {
	it('findet den Header dynamisch und extrahiert nur Bezirksregionen', () => {
		const rows = parseHzSheet(fixtureAoa(), DEFAULT_DELIKTE);
		expect(rows.map((r) => r.bzrId)).toEqual(['011001', '011002']);
	});

	it('mappt die Delikt-Spalten trotz Silbentrennung', () => {
		const rows = parseHzSheet(fixtureAoa(), DEFAULT_DELIKTE);
		const tiergarten = rows.find((r) => r.bzrId === '011001');
		expect(tiergarten?.name).toBe('Tiergarten Süd');
		expect(tiergarten?.hz).toEqual({
			kieztaten: 6000,
			wohnraumeinbruch: 120,
			sachbeschaedigung: 950,
			strassenraub: 399,
			fahrraddiebstahl: 410
		});
	});

	it('parst unterdrückte Zellen ("-") als null', () => {
		const rows = parseHzSheet(fixtureAoa(), DEFAULT_DELIKTE);
		const regierung = rows.find((r) => r.bzrId === '011002');
		expect(regierung?.hz.strassenraub).toBeNull();
		expect(regierung?.hz.wohnraumeinbruch).toBeNull();
		expect(regierung?.hz.kieztaten).toBe(5500);
	});

	it('wirft, wenn eine Delikt-Spalte im Header fehlt', () => {
		const aoa = fixtureAoa();
		aoa[4] = [
			'LOR-Schlüssel (Bezirksregion)',
			'Bezeichnung (Bezirksregion)',
			'Straftaten -insgesamt-'
		];
		expect(() => parseHzSheet(aoa, DEFAULT_DELIKTE)).toThrow(/Spalte/i);
	});

	it('wirft, wenn keine Header-Zeile gefunden wird', () => {
		const aoa: SheetRow[] = [
			['irgendwas', null],
			['noch was', null]
		];
		expect(() => parseHzSheet(aoa, DEFAULT_DELIKTE)).toThrow(/Header/i);
	});

	it('verkraftet ein leeres Sheet ohne Crash', () => {
		expect(() => parseHzSheet([], DEFAULT_DELIKTE)).toThrow(/Header/i);
	});
});
