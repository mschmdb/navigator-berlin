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
	gruppenAnzeigeName,
	resolveAnzeigeEbene,
	buildTableRows,
	buildTakeawaySentence,
	aggregationHinweisText,
	deriveActiveWinnersState,
	deriveKarteVisibility,
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
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[0, 0],
					[0, 1],
					[1, 1],
					[0, 0]
				]
			]
		}
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

// Story 17: joinStimmbezirkWinners läuft auf der DISSOLVIERTEN Gruppen-
// Geometrie (`wahlgruppen-<geoSlug>`), nicht mehr auf Urnen-Flächen -- Fixture-
// Props tragen deshalb BWB*-Felder + MEMBERS (Kontrakt `dissolveGruppen`,
// sbb-geo-pipeline.ts).
const GRUPPEN_FC_BTW: FeatureCollection = {
	type: 'FeatureCollection',
	features: [
		feature({ BWK: '75', BEZ: '01', BWB3: '1A', MEMBERS: '100,101' }),
		feature({ BWK: '83', BEZ: '09', BWB3: '9Z', MEMBERS: '900' })
	]
};

const GRUPPEN_FC_AGH: FeatureCollection = {
	type: 'FeatureCollection',
	features: [
		feature({ BEZ: '09', BWB3: '7P', MEMBERS: '726,727' }),
		feature({ BEZ: '05', BWB3: '3C', MEMBERS: '221' })
	]
};

describe('joinStimmbezirkWinners', () => {
	it('joint über gruppeIdFromGeo im BTW-Format (BWK-BEZ-BWB3-5)', () => {
		const winners: WinnerApiRow[] = [
			{
				jahr: 2021,
				gebiet_slug: '075-01-1A-5',
				partei: 'SPD',
				farbe_hex: '#ignored',
				anteil: 0.4,
				is_repeat_election: false,
				parent_slug: null
			}
		];
		const joined = joinStimmbezirkWinners(GRUPPEN_FC_BTW, 'btw21', winners);
		expect(joined.features[0].properties.gebiet_slug).toBe('075-01-1A-5');
		expect(joined.features[0].properties.gebiet_name).toBe(
			'Stimmbezirke 100, 101 und Briefwahl 1A'
		);
		expect(joined.features[0].properties.partei).toBe('SPD');
		expect(joined.features[0].properties.has_winner).toBe(1);
		// Zweite Gruppe (083-09-9Z-5) bleibt unmatched, neutral.
		expect(joined.features[1].properties.has_winner).toBe(0);
	});

	it('joint über gruppeIdFromGeo im AGH-Format (BEZ+B+BWB3, Spec-Beispiel Gruppe 7P)', () => {
		const winners: WinnerApiRow[] = [
			{
				jahr: 2026,
				gebiet_slug: '09B7P',
				partei: 'CDU',
				farbe_hex: '#ignored',
				anteil: 0.265,
				is_repeat_election: false,
				parent_slug: null
			}
		];
		const joined = joinStimmbezirkWinners(GRUPPEN_FC_AGH, 'agh26', winners);
		expect(joined.features[0].properties.gebiet_slug).toBe('09B7P');
		expect(joined.features[0].properties.gebiet_name).toBe(
			'Stimmbezirke 726, 727 und Briefwahl 7P'
		);
		expect(joined.features[0].properties.partei).toBe('CDU');
	});
});

// Volle Coverage (AGH/BVV + alle BTW-Formate, Edge-Cases) lebt jetzt bei
// `$lib/data/wahl-gruppe-label.test.ts` (geteiltes Modul, Review-Fund). Hier
// nur ein Re-Export-Smoke-Test, damit `winner-map-data.js` als Import-Pfad
// weiter funktioniert.
describe('gruppenAnzeigeName (Re-Export)', () => {
	it('re-exportiert dieselbe Funktion wie $lib/data/wahl-gruppe-label.js', () => {
		expect(gruppenAnzeigeName('09B7P', '726,727')).toBe('Stimmbezirke 726, 727 und Briefwahl 7P');
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
		expect(resolveAnzeigeEbene('kiez', { stimmbezirk: true, kiez: false, bezirk: true })).toBe(
			'bezirk'
		);
	});

	it('bleibt bei bezirk (immer verfügbar)', () => {
		expect(resolveAnzeigeEbene('bezirk', { stimmbezirk: false, kiez: false, bezirk: true })).toBe(
			'bezirk'
		);
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
		const sentence = buildTakeawaySentence([{ gebiet: 'A', partei: 'SPD', anteil: 0.4 }], 1);
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

	it('nennt Briefwahl-Gruppen (Urne + Briefwahlbezirk zusammen) auf Stimmbezirks-Ebene (Story 17)', () => {
		expect(aggregationHinweisText('stimmbezirk')).toMatch(/Briefwahl-Gruppen/);
		expect(aggregationHinweisText('stimmbezirk')).toMatch(/Briefwahlbezirk/);
	});

	it('nennt die anteilige Briefwahl-Schätzung auf Kiez-Ebene (Story 17)', () => {
		expect(aggregationHinweisText('kiez')).toMatch(/Briefwahl anteilig/);
	});
});

// NEUTRAL_OPACITY wird von winner-map.svelte für die fill-opacity-Expression
// re-exportiert; Test hält den Wert nur gegen Regression fest.
describe('NEUTRAL_OPACITY', () => {
	it('ist 0.1 (Boundary-Vorgabe)', () => {
		expect(NEUTRAL_OPACITY).toBe(0.1);
	});
});

function row(overrides: Partial<WinnerApiRow>): WinnerApiRow {
	return {
		jahr: 2023,
		gebiet_slug: 'a',
		partei: 'SPD',
		farbe_hex: '#ignored',
		anteil: 0.4,
		is_repeat_election: false,
		parent_slug: null,
		...overrides
	};
}

describe('deriveActiveWinnersState', () => {
	it('liest im Stimmbezirks-Modus aus den sb-Feldern, sonst aus den kb-Feldern', () => {
		const sbRows = [row({ is_repeat_election: true })];
		const kbRows = [row({})];
		const sb = deriveActiveWinnersState({
			isStimmbezirk: true,
			sbStatus: 'loaded',
			sbWinners: sbRows,
			kbStatus: 'error',
			kbWinnersAll: [],
			kbWinnersForJahr: kbRows
		});
		expect(sb).toEqual({
			status: 'loaded',
			hasAnyWinners: true,
			winnersForJahr: sbRows,
			repeatElection: true
		});

		const kb = deriveActiveWinnersState({
			isStimmbezirk: false,
			sbStatus: 'error',
			sbWinners: [],
			kbStatus: 'loaded',
			kbWinnersAll: kbRows,
			kbWinnersForJahr: kbRows
		});
		expect(kb).toEqual({
			status: 'loaded',
			hasAnyWinners: true,
			winnersForJahr: kbRows,
			repeatElection: false
		});
	});

	it('hasAnyWinners bleibt false ohne Rows, kein Crash', () => {
		const state = deriveActiveWinnersState({
			isStimmbezirk: false,
			sbStatus: 'idle',
			sbWinners: [],
			kbStatus: 'loaded',
			kbWinnersAll: [],
			kbWinnersForJahr: []
		});
		expect(state.hasAnyWinners).toBe(false);
		expect(state.repeatElection).toBe(false);
	});
});

describe('deriveKarteVisibility', () => {
	it('zeigt Error nur vor dem Erst-Zeigen der Karte', () => {
		const visible = deriveKarteVisibility({
			mapShown: false,
			winnersStatus: 'error',
			geometryStatus: 'loaded',
			hasAnyWinners: false,
			jahrIsNull: false
		});
		expect(visible.isErrorState).toBe(true);
		expect(visible.showKarteInhalt).toBe(false);

		const afterShown = deriveKarteVisibility({
			mapShown: true,
			winnersStatus: 'error',
			geometryStatus: 'loaded',
			hasAnyWinners: false,
			jahrIsNull: false
		});
		expect(afterShown.isErrorState).toBe(false);
		expect(afterShown.showKarteInhalt).toBe(true);
	});

	it('Loading vor dem ersten Zeigen, Empty ohne Winners/Jahr', () => {
		const loading = deriveKarteVisibility({
			mapShown: false,
			winnersStatus: 'loading',
			geometryStatus: 'idle',
			hasAnyWinners: false,
			jahrIsNull: false
		});
		expect(loading.isLoadingState).toBe(true);

		const empty = deriveKarteVisibility({
			mapShown: false,
			winnersStatus: 'loaded',
			geometryStatus: 'loaded',
			hasAnyWinners: false,
			jahrIsNull: false
		});
		expect(empty.isEmptyState).toBe(true);
	});
});
