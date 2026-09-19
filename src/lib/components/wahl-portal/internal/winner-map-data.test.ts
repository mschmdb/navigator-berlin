import { describe, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import {
	filterWinnersByJahr,
	isRepeatElectionYear,
	opacityForAnteil,
	buildKiezSlugsForFeatures,
	bezirkSlugsForFeatures,
	kiezNamesForFeatures,
	bezirkNamesForFeatures,
	joinWinnersToFeatures,
	joinStimmbezirkWinners,
	resolveAnzeigeEbene,
	buildTableRows,
	buildTakeawaySentence,
	aggregationHinweisText,
	ANTEIL_OPACITY_RAMP,
	NEUTRAL_OPACITY,
	NEUTRAL_FARBE,
	type WinnerApiRow
} from './winner-map-data.js';
import { parteiColor, parteiPattern } from '$lib/data/partei-farben.js';

function feature(properties: Record<string, unknown>): GeoJSON.Feature {
	return {
		type: 'Feature',
		properties,
		geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]] }
	};
}

const BEZIRKE_FC: FeatureCollection = {
	type: 'FeatureCollection',
	features: [
		feature({ Gemeinde_name: 'Spandau', Schluessel_gesamt: '11000005' }),
		feature({
			Gemeinde_name: 'Charlottenburg-Wilmersdorf',
			Schluessel_gesamt: '11000004'
		}),
		feature({ Gemeinde_name: 'Mitte', Schluessel_gesamt: '11000001' })
	]
};

// Zwei BZR mit Duplikat-Namen (Heerstraße in Spandau UND Charlottenburg-Wilmersdorf,
// analog zur echten LOR-Fixture) + ein eindeutiger Name.
const KIEZ_FC: FeatureCollection = {
	type: 'FeatureCollection',
	features: [
		feature({ BZR_ID: '050101', BZR_NAME: 'Heerstraße', BEZ: '05' }),
		feature({ BZR_ID: '040101', BZR_NAME: 'Heerstraße', BEZ: '04' }),
		feature({ BZR_ID: '010101', BZR_NAME: 'Hansaviertel', BEZ: '01' })
	]
};

const WINNERS_2023: WinnerApiRow[] = [
	{
		jahr: 2023,
		gebiet_slug: 'heerstrasse-spandau',
		partei: 'SPD',
		farbe_hex: '#ignored',
		anteil: 0.5,
		is_repeat_election: true,
		parent_slug: '2021-agh-zweitstimme'
	},
	{
		jahr: 2023,
		gebiet_slug: 'hansaviertel',
		partei: 'GRÜNE',
		farbe_hex: '#ignored',
		anteil: 0.2,
		is_repeat_election: true,
		parent_slug: '2021-agh-zweitstimme'
	}
	// heerstrasse-charlottenburg-wilmersdorf bleibt absichtlich unmatched.
];

const WINNERS_2021: WinnerApiRow[] = [
	{
		jahr: 2021,
		gebiet_slug: 'hansaviertel',
		partei: 'CDU',
		farbe_hex: '#ignored',
		anteil: 0.3,
		is_repeat_election: false,
		parent_slug: null
	}
];

describe('filterWinnersByJahr', () => {
	it('filtert die Bulk-Response auf ein Jahr', () => {
		const all = [...WINNERS_2023, ...WINNERS_2021];
		expect(filterWinnersByJahr(all, 2023)).toEqual(WINNERS_2023);
		expect(filterWinnersByJahr(all, 2021)).toEqual(WINNERS_2021);
	});

	it('liefert leere Liste für ein Jahr ohne Rows', () => {
		expect(filterWinnersByJahr(WINNERS_2023, 1999)).toEqual([]);
	});
});

describe('isRepeatElectionYear', () => {
	it('erkennt eine Wiederholungswahl', () => {
		expect(isRepeatElectionYear(WINNERS_2023)).toBe(true);
	});

	it('erkennt eine reguläre Wahl', () => {
		expect(isRepeatElectionYear(WINNERS_2021)).toBe(false);
	});

	it('liefert false für leere Rows', () => {
		expect(isRepeatElectionYear([])).toBe(false);
	});
});

describe('opacityForAnteil', () => {
	it('klemmt unterhalb der Rampe auf minOpacity', () => {
		expect(opacityForAnteil(0)).toBe(ANTEIL_OPACITY_RAMP.minOpacity);
		expect(opacityForAnteil(0.1)).toBe(ANTEIL_OPACITY_RAMP.minOpacity);
	});

	it('klemmt oberhalb der Rampe auf maxOpacity', () => {
		expect(opacityForAnteil(0.9)).toBe(ANTEIL_OPACITY_RAMP.maxOpacity);
	});

	it('interpoliert linear dazwischen', () => {
		const mid = (ANTEIL_OPACITY_RAMP.minAnteil + ANTEIL_OPACITY_RAMP.maxAnteil) / 2;
		const expected = (ANTEIL_OPACITY_RAMP.minOpacity + ANTEIL_OPACITY_RAMP.maxOpacity) / 2;
		expect(opacityForAnteil(mid)).toBeCloseTo(expected, 5);
	});
});

describe('buildKiezSlugsForFeatures', () => {
	it('disambiguiert Duplikat-Namen über den Bezirk-Namen aus bezirke.geojson', () => {
		const slugs = buildKiezSlugsForFeatures(KIEZ_FC, BEZIRKE_FC);
		expect(slugs).toEqual([
			'heerstrasse-spandau',
			'heerstrasse-charlottenburg-wilmersdorf',
			'hansaviertel'
		]);
	});
});

describe('bezirkSlugsForFeatures', () => {
	it('normalisiert Gemeinde_name bare (kein Suffix nötig)', () => {
		expect(bezirkSlugsForFeatures(BEZIRKE_FC)).toEqual([
			'spandau',
			'charlottenburg-wilmersdorf',
			'mitte'
		]);
	});
});

describe('kiezNamesForFeatures / bezirkNamesForFeatures', () => {
	it('liefert Anzeige-Namen index-aligned zu den Slugs, Duplikate mit Bezirk in Klammern', () => {
		expect(kiezNamesForFeatures(KIEZ_FC, BEZIRKE_FC)).toEqual([
			'Heerstraße (Spandau)',
			'Heerstraße (Charlottenburg-Wilmersdorf)',
			'Hansaviertel'
		]);
		expect(bezirkNamesForFeatures(BEZIRKE_FC)).toEqual([
			'Spandau',
			'Charlottenburg-Wilmersdorf',
			'Mitte'
		]);
	});
});

describe('joinWinnersToFeatures', () => {
	const slugs = buildKiezSlugsForFeatures(KIEZ_FC, BEZIRKE_FC);
	const names = kiezNamesForFeatures(KIEZ_FC, BEZIRKE_FC);

	it('färbt gematchte Gebiete über parteiColor/parteiPattern, ignoriert farbe_hex', () => {
		const joined = joinWinnersToFeatures(KIEZ_FC, slugs, names, WINNERS_2023);
		const heerstrasseSpandau = joined.features[0].properties;
		expect(heerstrasseSpandau.partei).toBe('SPD');
		expect(heerstrasseSpandau.farbe).toBe(parteiColor('SPD'));
		expect(heerstrasseSpandau.farbe).not.toBe('#ignored');
		expect(heerstrasseSpandau.pattern).toBe(parteiPattern('SPD'));
		expect(heerstrasseSpandau.has_winner).toBe(1);
	});

	it('lässt nicht-gematchte Gebiete neutral (Sonstige-frei)', () => {
		const joined = joinWinnersToFeatures(KIEZ_FC, slugs, names, WINNERS_2023);
		const unmatched = joined.features[1].properties;
		expect(unmatched.has_winner).toBe(0);
		expect(unmatched.partei).toBeNull();
		expect(unmatched.farbe).toBe(NEUTRAL_FARBE);
		expect(unmatched.farbe).not.toBe(parteiColor('Sonstige'));
	});

	it('fällt bei unbekannten Partei-Labels auf Sonstige-Farbe zurück, behält aber den echten Namen', () => {
		const winners: WinnerApiRow[] = [
			{
				jahr: 2023,
				gebiet_slug: 'hansaviertel',
				partei: 'Die PARTEI',
				farbe_hex: '#ignored',
				anteil: 0.1,
				is_repeat_election: false,
				parent_slug: null
			}
		];
		const joined = joinWinnersToFeatures(KIEZ_FC, slugs, names, winners);
		const hansaviertel = joined.features[2].properties;
		expect(hansaviertel.partei).toBe('Die PARTEI');
		expect(hansaviertel.farbe).toBe(parteiColor('Sonstige'));
	});

	it('setzt pattern_image_id nur für gematchte Gebiete', () => {
		const joined = joinWinnersToFeatures(KIEZ_FC, slugs, names, WINNERS_2023);
		expect(joined.features[0].properties.pattern_image_id).not.toBeNull();
		expect(joined.features[1].properties.pattern_image_id).toBeNull();
	});
});

// Fixture-Props identisch zu scripts/wahlen/lib/kiez-mapper.test.ts (Kontrakt:
// dieselben uwbIds wie die Kiez-Mapper-Fixtures für BTW- und AGH-Format).
const STIMMBEZIRK_FC_BTW: FeatureCollection = {
	type: 'FeatureCollection',
	features: [
		feature({ BWK: '75', BEZ: '01', UWB3: '100' }),
		feature({ BWK: '83', BEZ: '09', UWB3: '101', UWB: '09101' })
	]
};

const STIMMBEZIRK_FC_AGH: FeatureCollection = {
	type: 'FeatureCollection',
	features: [feature({ BEZ: '01', UWB3: '100' }), feature({ BEZ: '05', UWB3: '221' })]
};

describe('joinStimmbezirkWinners', () => {
	it('joint über dbUwbIdFromGeo im BTW-Format (BWK-BEZ-UWB3-0)', () => {
		const winners: WinnerApiRow[] = [
			{
				jahr: 2021,
				gebiet_slug: '075-01-100-0',
				partei: 'SPD',
				farbe_hex: '#ignored',
				anteil: 0.4,
				is_repeat_election: false,
				parent_slug: null
			}
		];
		const joined = joinStimmbezirkWinners(STIMMBEZIRK_FC_BTW, 'btw21', winners);
		expect(joined.features[0].properties.gebiet_slug).toBe('075-01-100-0');
		expect(joined.features[0].properties.gebiet_name).toBe('Stimmbezirk 075-01-100-0');
		expect(joined.features[0].properties.partei).toBe('SPD');
		expect(joined.features[0].properties.has_winner).toBe(1);
		// Zweites Feature (083-09-101-0) bleibt unmatched, neutral.
		expect(joined.features[1].properties.has_winner).toBe(0);
	});

	it('joint über dbUwbIdFromGeo im AGH-Format (BEZ-W-UWB3, ohne Suffix)', () => {
		const winners: WinnerApiRow[] = [
			{
				jahr: 2021,
				gebiet_slug: '01W100',
				partei: 'GRÜNE',
				farbe_hex: '#ignored',
				anteil: 0.3,
				is_repeat_election: false,
				parent_slug: null
			}
		];
		const joined = joinStimmbezirkWinners(STIMMBEZIRK_FC_AGH, 'agh21', winners);
		expect(joined.features[0].properties.gebiet_slug).toBe('01W100');
		expect(joined.features[0].properties.gebiet_name).toBe('Stimmbezirk 01W100');
		expect(joined.features[0].properties.partei).toBe('GRÜNE');
	});
});

describe('resolveAnzeigeEbene', () => {
	it('behält die gewünschte Ebene, wenn sie verfügbar ist', () => {
		expect(
			resolveAnzeigeEbene('stimmbezirk', { stimmbezirk: true, kiez: true, bezirk: true })
		).toBe('stimmbezirk');
	});

	it('fällt von stimmbezirk auf kiez, wenn stimmbezirk fehlt', () => {
		expect(
			resolveAnzeigeEbene('stimmbezirk', { stimmbezirk: false, kiez: true, bezirk: true })
		).toBe('kiez');
	});

	it('fällt von stimmbezirk auf bezirk, wenn weder stimmbezirk noch kiez verfügbar sind (BVV 2011)', () => {
		expect(
			resolveAnzeigeEbene('stimmbezirk', { stimmbezirk: false, kiez: false, bezirk: true })
		).toBe('bezirk');
	});

	it('fällt bei manuell gewähltem kiez ohne Daten auf bezirk, rutscht nicht zurück zu stimmbezirk', () => {
		expect(
			resolveAnzeigeEbene('kiez', { stimmbezirk: true, kiez: false, bezirk: true })
		).toBe('bezirk');
	});

	it('bleibt bei bezirk (immer verfügbar)', () => {
		expect(
			resolveAnzeigeEbene('bezirk', { stimmbezirk: false, kiez: false, bezirk: true })
		).toBe('bezirk');
	});
});

describe('buildTableRows', () => {
	it('enthält nur gematchte Gebiete', () => {
		const slugs = buildKiezSlugsForFeatures(KIEZ_FC, BEZIRKE_FC);
		const names = kiezNamesForFeatures(KIEZ_FC, BEZIRKE_FC);
		const joined = joinWinnersToFeatures(KIEZ_FC, slugs, names, WINNERS_2023);
		const rows = buildTableRows(joined);
		expect(rows).toHaveLength(2);
		expect(rows).toEqual(
			expect.arrayContaining([
				{ gebiet: 'Heerstraße (Spandau)', partei: 'SPD', anteil: 0.5 },
				{ gebiet: 'Hansaviertel', partei: 'GRÜNE', anteil: 0.2 }
			])
		);
	});
});

describe('buildTakeawaySentence', () => {
	it('nennt die häufigste Partei unter den gematchten Gebieten', () => {
		const rows = [
			{ gebiet: 'A', partei: 'SPD', anteil: 0.4 },
			{ gebiet: 'B', partei: 'SPD', anteil: 0.3 },
			{ gebiet: 'C', partei: 'CDU', anteil: 0.5 }
		];
		expect(buildTakeawaySentence(rows, 5)).toBe('Stärkste Kraft in 2 von 5 Gebieten: SPD');
	});

	it('löst Gleichstände der Gebiets-Zahl alphabetisch auf', () => {
		const rows = [
			{ gebiet: 'A', partei: 'SPD', anteil: 0.4 },
			{ gebiet: 'B', partei: 'CDU', anteil: 0.3 }
		];
		// 1:1-Gleichstand: alphabetisch gewinnt CDU, unabhängig von der Row-Reihenfolge.
		expect(buildTakeawaySentence(rows, 2)).toBe('Stärkste Kraft in 1 von 2 Gebieten: CDU');
	});

	it('liefert einen Leer-Hinweis ohne Rows', () => {
		expect(buildTakeawaySentence([], 143)).toMatch(/keine/i);
	});

	it('ist lint:wahl-konform (keine verbotenen Wertungs-Begriffe)', () => {
		const sentence = buildTakeawaySentence(
			[{ gebiet: 'A', partei: 'SPD', anteil: 0.4 }],
			1
		);
		expect(sentence).not.toMatch(/hochburg|wahlsieger|erdrutsch/i);
	});
});

describe('aggregationHinweisText', () => {
	it('nennt die Flächen-Zuordnung auf Kiez-Ebene', () => {
		expect(aggregationHinweisText('kiez')).toMatch(/143 Berliner Kieze aggregiert/);
	});

	it('nennt die amtlichen Bezirks-Summen auf Bezirk-Ebene', () => {
		expect(aggregationHinweisText('bezirk')).toMatch(/amtliche Bezirks-Summen/);
	});

	it('nennt amtliche Urnenwahl-Ergebnisse und die Briefwahl-Lücke auf Stimmbezirks-Ebene', () => {
		expect(aggregationHinweisText('stimmbezirk')).toMatch(/Urnenwahl/);
		expect(aggregationHinweisText('stimmbezirk')).toMatch(/Briefwahl/);
	});
});

// NEUTRAL_OPACITY wird von winner-map.svelte für die fill-opacity-Expression
// re-exportiert; Test hält den Wert nur gegen Regression fest.
describe('NEUTRAL_OPACITY', () => {
	it('ist 0.1 (Boundary-Vorgabe)', () => {
		expect(NEUTRAL_OPACITY).toBe(0.1);
	});
});
