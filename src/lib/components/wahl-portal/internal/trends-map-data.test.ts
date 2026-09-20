import type { FeatureCollection } from 'geojson';
import { describe, expect, it } from 'vitest';
import { blendOverBasemap, contrastRatio } from './wechsel-map-data.js';
import {
	buildTrendsFeatureCollection,
	buildTrendsTableRows,
	buildTrendTakeaway,
	buildVolatilitaetTakeaway,
	farbeForTrendSlope,
	farbeForVolatilitaet,
	formatVolatilitaetLabel,
	slopeForPartei,
	TRENDS_FILL_OPACITY,
	TREND_FALLEND_DUNKEL,
	TREND_FALLEND_HELL,
	TREND_NEUTRAL_FARBE,
	TREND_STEIGEND_DUNKEL,
	TREND_STEIGEND_HELL,
	VOLATILITAET_FARBE_STUFE_1,
	VOLATILITAET_FARBE_STUFE_2_PLUS,
	VOLATILITAET_NEUTRAL_FARBE,
	type TrendsGebietInput
} from './trends-map-data.js';

function polygon() {
	return {
		type: 'Polygon' as const,
		coordinates: [
			[
				[13.3, 52.5],
				[13.3, 52.51],
				[13.31, 52.51],
				[13.3, 52.5]
			]
		]
	};
}

function fc(slugCount: number): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: Array.from({ length: slugCount }, () => ({
			type: 'Feature' as const,
			geometry: polygon(),
			properties: {}
		}))
	};
}

describe('WCAG-Kontrast der Trend-/Volatilitäts-Rampen (≥3:1 zwischen Nachbarstufen, Muster wechsel-map-data.ts)', () => {
	it('Volatilität: neutral<->stufe1 und stufe1<->stufe2+ erreichen ≥3:1', () => {
		const n = blendOverBasemap(VOLATILITAET_NEUTRAL_FARBE, TRENDS_FILL_OPACITY);
		const s1 = blendOverBasemap(VOLATILITAET_FARBE_STUFE_1, TRENDS_FILL_OPACITY);
		const s2 = blendOverBasemap(VOLATILITAET_FARBE_STUFE_2_PLUS, TRENDS_FILL_OPACITY);
		expect(contrastRatio(n, s1)).toBeGreaterThanOrEqual(3);
		expect(contrastRatio(s1, s2)).toBeGreaterThanOrEqual(3);
	});

	it('Trend steigend: neutral<->hell und hell<->dunkel erreichen ≥3:1', () => {
		const n = blendOverBasemap(TREND_NEUTRAL_FARBE, TRENDS_FILL_OPACITY);
		const hell = blendOverBasemap(TREND_STEIGEND_HELL, TRENDS_FILL_OPACITY);
		const dunkel = blendOverBasemap(TREND_STEIGEND_DUNKEL, TRENDS_FILL_OPACITY);
		expect(contrastRatio(n, hell)).toBeGreaterThanOrEqual(3);
		expect(contrastRatio(hell, dunkel)).toBeGreaterThanOrEqual(3);
	});

	it('Trend fallend: neutral<->hell und hell<->dunkel erreichen ≥3:1 (luminanz-identisch zu steigend)', () => {
		const n = blendOverBasemap(TREND_NEUTRAL_FARBE, TRENDS_FILL_OPACITY);
		const hell = blendOverBasemap(TREND_FALLEND_HELL, TRENDS_FILL_OPACITY);
		const dunkel = blendOverBasemap(TREND_FALLEND_DUNKEL, TRENDS_FILL_OPACITY);
		expect(contrastRatio(n, hell)).toBeGreaterThanOrEqual(3);
		expect(contrastRatio(hell, dunkel)).toBeGreaterThanOrEqual(3);
	});
});

describe('farbeForTrendSlope', () => {
	it('nahe 0 (< 0,2 Pp./Jahr) bleibt neutral', () => {
		expect(farbeForTrendSlope(0.0005)).toBe(TREND_NEUTRAL_FARBE);
		expect(farbeForTrendSlope(-0.0005)).toBe(TREND_NEUTRAL_FARBE);
	});

	it('steigend hell/dunkel je Schwelle', () => {
		expect(farbeForTrendSlope(0.005)).toBe(TREND_STEIGEND_HELL); // 0,5 Pp./Jahr
		expect(farbeForTrendSlope(0.015)).toBe(TREND_STEIGEND_DUNKEL); // 1,5 Pp./Jahr
	});

	it('fallend hell/dunkel je Schwelle', () => {
		expect(farbeForTrendSlope(-0.005)).toBe(TREND_FALLEND_HELL);
		expect(farbeForTrendSlope(-0.015)).toBe(TREND_FALLEND_DUNKEL);
	});
});

describe('farbeForVolatilitaet', () => {
	it('klassifiziert nach Schwellen', () => {
		expect(farbeForVolatilitaet(0.01)).toBe(VOLATILITAET_NEUTRAL_FARBE);
		expect(farbeForVolatilitaet(0.08)).toBe(VOLATILITAET_FARBE_STUFE_1);
		expect(farbeForVolatilitaet(0.2)).toBe(VOLATILITAET_FARBE_STUFE_2_PLUS);
	});
});

describe('slopeForPartei', () => {
	it('liefert 0 ohne Eintrag (kein erfundener Wert)', () => {
		expect(slopeForPartei([{ partei: 'SPD', slope: 0.01 }], 'GRÜNE')).toBe(0);
		expect(slopeForPartei([{ partei: 'SPD', slope: 0.01 }], 'SPD')).toBe(0.01);
	});
});

describe('buildTrendsFeatureCollection', () => {
	const gebiete = new Map<string, TrendsGebietInput>([
		[
			'a',
			{
				kiez_slug: 'a',
				volatilitaet: 0.08,
				trends: [{ partei: 'GRÜNE', slope: 0.015 }]
			}
		]
	]);

	it('Toggle Trend: Gebiet ohne Trend-Eintrag für die aktive Partei bleibt neutral, hat_daten 0', () => {
		const result = buildTrendsFeatureCollection(fc(1), ['a'], ['Kiez A'], gebiete, 'trend', 'SPD');
		expect(result.features[0].properties.hat_daten).toBe(0);
		expect(result.features[0].properties.farbe).toBe(TREND_NEUTRAL_FARBE);
	});

	it('Toggle Trend: Gebiet mit Trend-Eintrag färbt nach Slope', () => {
		const result = buildTrendsFeatureCollection(fc(1), ['a'], ['Kiez A'], gebiete, 'trend', 'GRÜNE');
		expect(result.features[0].properties.hat_daten).toBe(1);
		expect(result.features[0].properties.farbe).toBe(TREND_STEIGEND_DUNKEL);
		expect(result.features[0].properties.wert).toBeCloseTo(0.015);
	});

	it('Toggle Volatilität: färbt unabhängig von der aktiven Partei', () => {
		const result = buildTrendsFeatureCollection(
			fc(1),
			['a'],
			['Kiez A'],
			gebiete,
			'volatilitaet',
			'SPD'
		);
		expect(result.features[0].properties.wert).toBeCloseTo(0.08);
		expect(result.features[0].properties.farbe).toBe(VOLATILITAET_FARBE_STUFE_1);
	});

	it('Gebiet ohne Analytik-Daten (DB-los/leer) bleibt neutral, kein Crash', () => {
		const result = buildTrendsFeatureCollection(
			fc(1),
			['unbekannt'],
			['Unbekannt'],
			gebiete,
			'volatilitaet',
			'SPD'
		);
		expect(result.features[0].properties.hat_daten).toBe(0);
	});
});

describe('buildTrendsTableRows', () => {
	it('nur Gebiete mit Daten, formatiert nach Toggle', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.08, trends: [{ partei: 'GRÜNE', slope: 0.015 }] }],
			['b', { kiez_slug: 'b', volatilitaet: 0.02, trends: [] }]
		]);
		const trendFc = buildTrendsFeatureCollection(
			fc(2),
			['a', 'b'],
			['Kiez A', 'Kiez B'],
			gebiete,
			'trend',
			'GRÜNE'
		);
		const rows = buildTrendsTableRows(trendFc, 'trend');
		expect(rows).toEqual([{ gebiet: 'Kiez A', wert: '+1,5 Pp.' }]);
	});

	it('Rundungs-Clamp: ein Wert nahe 0 rundet auf "0,0 Pp." ohne Vorzeichen (EC-18)', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0, trends: [{ partei: 'GRÜNE', slope: -0.0003 }] }]
		]);
		const trendFc = buildTrendsFeatureCollection(fc(1), ['a'], ['Kiez A'], gebiete, 'trend', 'GRÜNE');
		const rows = buildTrendsTableRows(trendFc, 'trend');
		expect(rows).toEqual([{ gebiet: 'Kiez A', wert: '0,0 Pp.' }]);
	});
});

describe('formatVolatilitaetLabel', () => {
	it('formatiert als Pp. mit de-DE-Komma und nennt die Gesamtverschiebung', () => {
		expect(formatVolatilitaetLabel(0.084)).toBe('8,4 Pp. Gesamtverschiebung');
	});
});

describe('buildTrendTakeaway', () => {
	it('leer ohne Daten', () => {
		const trendFc = buildTrendsFeatureCollection(fc(1), ['a'], ['A'], new Map(), 'trend', 'SPD');
		expect(buildTrendTakeaway(trendFc, 'SPD')).toContain('keine Trend-Daten');
	});

	it('nennt Anzahl steigender/fallender Kieze', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0, trends: [{ partei: 'SPD', slope: 0.02 }] }],
			['b', { kiez_slug: 'b', volatilitaet: 0, trends: [{ partei: 'SPD', slope: -0.02 }] }]
		]);
		const trendFc = buildTrendsFeatureCollection(
			fc(2),
			['a', 'b'],
			['A', 'B'],
			gebiete,
			'trend',
			'SPD'
		);
		const takeaway = buildTrendTakeaway(trendFc, 'SPD');
		expect(takeaway).toContain('1 von 2');
		expect(takeaway).toContain('steigendem');
		expect(takeaway).toContain('fallendem');
	});
});

describe('buildVolatilitaetTakeaway', () => {
	it('leer ohne Daten', () => {
		const trendFc = buildTrendsFeatureCollection(
			fc(1),
			['a'],
			['A'],
			new Map(),
			'volatilitaet',
			'SPD'
		);
		expect(buildVolatilitaetTakeaway(trendFc)).toContain('keine Volatilitäts-Daten');
	});

	it('nennt stabilsten und wechselhaftesten Kiez, keine Wertungs-Sprache', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.02, trends: [] }],
			['b', { kiez_slug: 'b', volatilitaet: 0.3, trends: [] }]
		]);
		const trendFc = buildTrendsFeatureCollection(
			fc(2),
			['a', 'b'],
			['Ruhig', 'Wechselhaft'],
			gebiete,
			'volatilitaet',
			'SPD'
		);
		const takeaway = buildVolatilitaetTakeaway(trendFc);
		expect(takeaway).toContain('Ruhig');
		expect(takeaway).toContain('Wechselhaft');
		expect(takeaway).not.toMatch(/hochburg/i);
	});

	it('Gleichstand ALLER Werte: eigener Satz statt willkürlich benannter Extreme (EC-12)', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.08, trends: [] }],
			['b', { kiez_slug: 'b', volatilitaet: 0.08, trends: [] }],
			['c', { kiez_slug: 'c', volatilitaet: 0.08, trends: [] }]
		]);
		const trendFc = buildTrendsFeatureCollection(
			fc(3),
			['a', 'b', 'c'],
			['Alpha', 'Beta', 'Gamma'],
			gebiete,
			'volatilitaet',
			'SPD'
		);
		const takeaway = buildVolatilitaetTakeaway(trendFc);
		expect(takeaway).toContain('Alle 3 Kieze liegen bei');
		expect(takeaway).toContain('8,0 Pp. Gesamtverschiebung');
		expect(takeaway).not.toMatch(/stabilster|wechselhaftester/i);
	});
});
