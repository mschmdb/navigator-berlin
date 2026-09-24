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
	computeVolatilitaetTerzile,
	buildVolatilitaetLegende,
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

describe('computeVolatilitaetTerzile', () => {
	it('liefert die Terzil-Grenzen (lineare Interpolation) der übergebenen Werte', () => {
		const t = computeVolatilitaetTerzile([0.3, 0.1, 0.2, 0.4]);
		// sortiert 0.1..0.4, Position (n-1)*p: 1/3 -> 1.0 -> 0.2; 2/3 -> 2.0 -> 0.3
		expect(t?.untere).toBeCloseTo(0.2, 10);
		expect(t?.obere).toBeCloseTo(0.3, 10);
	});

	it('null bei weniger als 3 Werten oder ohne Streuung (keine sinnvolle Drittelung)', () => {
		expect(computeVolatilitaetTerzile([])).toBeNull();
		expect(computeVolatilitaetTerzile([0.1, 0.2])).toBeNull();
		expect(computeVolatilitaetTerzile([0.2, 0.2, 0.2])).toBeNull();
	});
});

describe('farbeForVolatilitaet', () => {
	const terzile = { untere: 0.18, obere: 0.22 };

	it('klassifiziert relativ zu den Terzil-Grenzen der Reihe', () => {
		expect(farbeForVolatilitaet(0.15, terzile)).toBe(VOLATILITAET_NEUTRAL_FARBE);
		expect(farbeForVolatilitaet(0.18, terzile)).toBe(VOLATILITAET_FARBE_STUFE_1);
		expect(farbeForVolatilitaet(0.2, terzile)).toBe(VOLATILITAET_FARBE_STUFE_1);
		expect(farbeForVolatilitaet(0.22, terzile)).toBe(VOLATILITAET_FARBE_STUFE_2_PLUS);
		expect(farbeForVolatilitaet(0.28, terzile)).toBe(VOLATILITAET_FARBE_STUFE_2_PLUS);
	});

	it('ohne Terzile (zu wenige Kieze) eine einheitliche Mittelstufe statt Scheingenauigkeit', () => {
		expect(farbeForVolatilitaet(0.05, null)).toBe(VOLATILITAET_FARBE_STUFE_1);
		expect(farbeForVolatilitaet(0.3, null)).toBe(VOLATILITAET_FARBE_STUFE_1);
	});

	it('echte Kiez-Werte (Pedersen 9 bis 29 %) verteilen sich auf alle drei Stufen', () => {
		const werte = [0.087, 0.12, 0.15, 0.18, 0.19, 0.2, 0.21, 0.22, 0.25, 0.287];
		const t = computeVolatilitaetTerzile(werte);
		const farben = new Set(werte.map((w) => farbeForVolatilitaet(w, t)));
		expect(farben).toEqual(
			new Set([VOLATILITAET_NEUTRAL_FARBE, VOLATILITAET_FARBE_STUFE_1, VOLATILITAET_FARBE_STUFE_2_PLUS])
		);
	});
});

describe('buildVolatilitaetLegende', () => {
	it('nennt die echten Spannen der Reihe in Prozent, ohne „Keine Daten“ wenn alle Gebiete Daten haben', () => {
		const labels = buildVolatilitaetLegende({ untere: 0.185, obere: 0.217 }, false).map((e) => e.label);
		expect(labels).toEqual([
			'Stabiler: unter 18,5 %',
			'Mittel: 18,5 bis 21,7 %',
			'Wechselhafter: ab 21,7 %'
		]);
	});

	it('führt „Keine Daten“ nur, wenn es Gebiete ohne Daten gibt', () => {
		const labels = buildVolatilitaetLegende({ untere: 0.185, obere: 0.217 }, true).map((e) => e.label);
		expect(labels.at(-1)).toBe('Keine Daten');
	});

	it('ohne Terzile nur eine Stufe', () => {
		const labels = buildVolatilitaetLegende(null, false).map((e) => e.label);
		expect(labels).toEqual(['Netto-Verschiebung je Wahl']);
	});

	it('Grenzen, die gerundet gleich sind, fallen auf die einstufige Legende zurück', () => {
		const labels = buildVolatilitaetLegende({ untere: 0.1851, obere: 0.1854 }, false).map((e) => e.label);
		expect(labels).toEqual(['Netto-Verschiebung je Wahl']);
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
	it('formatiert als Prozent Netto-Verschiebung mit de-DE-Komma', () => {
		expect(formatVolatilitaetLabel(0.084)).toBe('8,4 % Netto-Verschiebung');
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

describe('buildVolatilitaetTakeaway mit Terzilen', () => {
	it('nennt die Drittel-Grenzen der Reihe', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.1, trends: [] }],
			['b', { kiez_slug: 'b', volatilitaet: 0.2, trends: [] }],
			['c', { kiez_slug: 'c', volatilitaet: 0.3, trends: [] }]
		]);
		const trendFc = buildTrendsFeatureCollection(
			fc(3),
			['a', 'b', 'c'],
			['A', 'B', 'C'],
			gebiete,
			'volatilitaet',
			'SPD'
		);
		expect(buildVolatilitaetTakeaway(trendFc)).toContain(
			'Ein Drittel der Kieze liegt unter 16,7 %, ein Drittel ab 23,3 %.'
		);
	});
});

describe('buildTrendsFeatureCollection Volatilität', () => {
	it('Terzile nur aus Gebieten, die die Karte auch zeigt (Geometrie-Slugs)', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.1, trends: [] }],
			['b', { kiez_slug: 'b', volatilitaet: 0.2, trends: [] }],
			['c', { kiez_slug: 'c', volatilitaet: 0.3, trends: [] }],
			['x', { kiez_slug: 'x', volatilitaet: 0.05, trends: [] }]
		]);
		const out = buildTrendsFeatureCollection(
			fc(3),
			['a', 'b', 'c'],
			['A', 'B', 'C'],
			gebiete,
			'volatilitaet',
			'SPD'
		);
		expect(out.features.map((f) => f.properties.farbe)).toEqual([
			VOLATILITAET_NEUTRAL_FARBE,
			VOLATILITAET_FARBE_STUFE_1,
			VOLATILITAET_FARBE_STUFE_2_PLUS
		]);
	});

	it('färbt nach den Terzilen aller Gebiete der Reihe', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.1, trends: [] }],
			['b', { kiez_slug: 'b', volatilitaet: 0.2, trends: [] }],
			['c', { kiez_slug: 'c', volatilitaet: 0.3, trends: [] }]
		]);
		const out = buildTrendsFeatureCollection(
			fc(3),
			['a', 'b', 'c'],
			['A', 'B', 'C'],
			gebiete,
			'volatilitaet',
			'SPD'
		);
		expect(out.features.map((f) => f.properties.farbe)).toEqual([
			VOLATILITAET_NEUTRAL_FARBE,
			VOLATILITAET_FARBE_STUFE_1,
			VOLATILITAET_FARBE_STUFE_2_PLUS
		]);
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
		expect(takeaway).not.toContain('Drittel');
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
		expect(takeaway).toContain('8,0 % Netto-Verschiebung');
		expect(takeaway).not.toMatch(/stabilster|wechselhaftester/i);
	});
});
