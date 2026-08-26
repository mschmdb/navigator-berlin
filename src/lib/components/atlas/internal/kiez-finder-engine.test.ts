import { describe, expect, it } from 'vitest';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import {
	buildFinderCollection,
	computeFitJs,
	FINDER_METRIC_KEYS,
	FINDER_RAMP,
	fitColorExpression,
	fitDomain,
	fitOpacityExpression,
	hasActiveWeights,
	NEUTRAL_METRIC,
	neutralWeights,
	rankNormalize,
	sbahnFit,
	topResults,
	type FinderWeights
} from './kiez-finder-engine.js';

function plrFixture(): FeatureCollection {
	return { type: 'FeatureCollection', features: [plr('01100101', 'Stülerstraße')] };
}

function plr(id: string, name: string): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: { PLR_ID: id, PLR_NAME: name },
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[0, 0],
					[1, 0],
					[1, 1],
					[0, 1],
					[0, 0]
				]
			]
		}
	};
}

const fc: FeatureCollection = {
	type: 'FeatureCollection',
	features: [plr('01100101', 'Stülerstraße'), plr('01100102', 'Großer Tiergarten')]
};

describe('rankNormalize', () => {
	it('bildet Werte rangbasiert auf 0..1 ab, robust gegen schiefe Verteilungen', () => {
		const out = rankNormalize(
			new Map([
				['a', 100],
				['b', 200],
				['c', 100000]
			])
		);
		expect(out.get('a')).toBe(0);
		expect(out.get('b')).toBe(0.5);
		expect(out.get('c')).toBe(1);
	});

	it('gibt bei einem einzigen Wert die Mitte zurück', () => {
		expect(rankNormalize(new Map([['a', 42]])).get('a')).toBe(0.5);
	});
});

describe('sbahnFit', () => {
	it('1 bei nah, 0 bei fern, linear dazwischen', () => {
		expect(sbahnFit(3)).toBe(1);
		expect(sbahnFit(5)).toBe(1);
		expect(sbahnFit(30)).toBe(0);
		expect(sbahnFit(45)).toBe(0);
		expect(sbahnFit(17.5)).toBeCloseTo(0.5, 5);
	});
});

describe('buildFinderCollection', () => {
	it('schreibt alle Metriken als Properties, fehlende Werte neutral', () => {
		const out = buildFinderCollection(fc, {
			m_ruhe_luft: new Map([['01100101', 0.8]])
		});
		const [a, b] = out.features;
		expect(a.properties?.m_ruhe_luft).toBe(0.8);
		expect(b.properties?.m_ruhe_luft).toBe(NEUTRAL_METRIC);
		for (const key of FINDER_METRIC_KEYS) {
			expect(typeof a.properties?.[key]).toBe('number');
		}
		expect(a.properties?.PLR_NAME).toBe('Stülerstraße');
	});
});

describe('Fit-Formel · JS und Expression', () => {
	const weights: FinderWeights = {
		...neutralWeights(),
		ruheLuft: 2,
		kultur: -1
	};

	it('computeFitJs gewichtet Richtung und Stärke', () => {
		// ruhe 1.0 (perfekt), kultur 0 → invertiert 1.0 → Passung 100
		expect(computeFitJs({ m_ruhe_luft: 1, m_kultur: 0 }, weights)).toBe(100);
		// ruhe 0, kultur 1 → beides schlechtester Fall → 0
		expect(computeFitJs({ m_ruhe_luft: 0, m_kultur: 1 }, weights)).toBe(0);
		// nur ruhe halb: (2*0.5 + 1*1) / 3
		expect(computeFitJs({ m_ruhe_luft: 0.5, m_kultur: 0 }, weights)).toBeCloseTo(66.67, 1);
	});

	it('neutralWeights ergeben keine aktiven Kriterien', () => {
		expect(hasActiveWeights(neutralWeights())).toBe(false);
		expect(hasActiveWeights(weights)).toBe(true);
	});

	it('fitColorExpression referenziert genau die aktiven Metrik-Properties', () => {
		const expr = JSON.stringify(fitColorExpression(weights));
		expect(expr).toContain('m_ruhe_luft');
		expect(expr).toContain('m_kultur');
		expect(expr).not.toContain('m_versorgung');
		expect(expr).toContain('interpolate');
	});

	it('Expression und JS-Formel ranken identisch (Stichprobe)', () => {
		// Die Expression selbst können wir ohne MapLibre nicht evaluieren; wir
		// prüfen die geteilte Kern-Summe: computeFitJs ist die Referenz, die
		// Expression baut aus denselben Gewichts-Termen (Konstanten-Test).
		const out = buildFinderCollection(fc, {
			m_ruhe_luft: new Map([
				['01100101', 0.9],
				['01100102', 0.2]
			]),
			m_kultur: new Map([
				['01100101', 0.1],
				['01100102', 0.9]
			])
		});
		const top = topResults(out, weights, 2);
		expect(top[0].name).toBe('Stülerstraße');
		expect(top[0].fit).toBeGreaterThan(top[1].fit);
	});
});

describe('topResults', () => {
	it('liefert sortierte Top-N mit Name, plrId und Passung', () => {
		const out = buildFinderCollection(fc, {
			m_versorgung: new Map([
				['01100101', 0.2],
				['01100102', 0.7]
			])
		});
		const top = topResults(out, { ...neutralWeights(), versorgung: 1 }, 1);
		expect(top).toHaveLength(1);
		expect(top[0]).toMatchObject({ plrId: '01100102', name: 'Großer Tiergarten', fit: 70 });
	});
});

describe('fitColorExpression · Neutral-Guard', () => {
	it('liefert bei Neutral-Gewichten eine konstante Farbe statt kaputter Expression', () => {
		const expr = fitColorExpression(neutralWeights());
		expect(expr).toEqual(FINDER_RAMP[0]);
	});
});

describe('Kiez-Name in Collection und Top-Liste', () => {
	it('buildFinderCollection bakt den Kiez-Namen über die BZR-Id ein', () => {
		const fc = buildFinderCollection(
			plrFixture(),
			{ m_ruhe_luft: new Map([['01100101', 0.9]]) },
			new Map([['011001', 'Tiergarten Süd']])
		);
		expect(fc.features[0].properties?.kiez_name).toBe('Tiergarten Süd');
	});
	it('topResults trägt den Kiez-Namen mit', () => {
		const fc = buildFinderCollection(
			plrFixture(),
			{ m_ruhe_luft: new Map([['01100101', 0.9]]) },
			new Map([['011001', 'Tiergarten Süd']])
		);
		const results = topResults(fc, { ...neutralWeights(), ruheLuft: 1 }, 1);
		expect(results[0].kiez).toBe('Tiergarten Süd');
	});
});

describe('fitOpacityExpression · Passung steuert Deckkraft', () => {
	it('interpoliert die Opacity von schwach nach kräftig über die Domain', () => {
		const expr = fitOpacityExpression({ ...neutralWeights(), ruheLuft: 1 }, { lo: 20, hi: 80 });
		const flat = JSON.stringify(expr);
		expect(flat).toContain('"interpolate"');
		expect(flat).toContain(',20,');
		expect(flat).toContain(',80,');
		expect(flat).toContain('0.15');
		expect(flat).toContain('0.8');
	});
	it('liefert bei Neutral-Gewichten eine Konstante', () => {
		expect(fitOpacityExpression(neutralWeights())).toBe(0.15);
	});
});

describe('fitDomain · Kontrast-Spreizung', () => {
	it('liefert P5..Maximum der tatsächlichen Passungs-Verteilung', () => {
		// Untere Klammer P5 gegen Ausreißer, oben das echte Maximum: eine
		// P95-Kappe würde die ganze Spitzengruppe in eine Einheits-Farbe
		// kollabieren und Rang-Verschiebungen unsichtbar machen.
		const values = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
		const domain = fitDomain(values);
		expect(domain.lo).toBeCloseTo(5.95, 1);
		expect(domain.hi).toBe(100);
	});

	it('fällt bei degenerierter Verteilung auf 0..100 zurück', () => {
		expect(fitDomain([])).toEqual({ lo: 0, hi: 100 });
		expect(fitDomain([50, 50, 50])).toEqual({ lo: 0, hi: 100 });
	});

	it('fitColorExpression spreizt die Rampe über die Domain', () => {
		const expr = fitColorExpression({ ...neutralWeights(), ruheLuft: 1 }, { lo: 40, hi: 80 });
		const flat = JSON.stringify(expr);
		// Farb-Stops liegen auf 40..80 statt 0..100 (das 100 im Gewichts-Faktor
		// ['*',100,...] zählt nicht als Stop).
		expect(flat).toContain(',40,"#');
		expect(flat).toContain(',80,"#');
		expect(flat).not.toContain(',100,"#');
		expect(flat).not.toContain(',0,"#');
	});
});

describe('topResults Zentroide', () => {
	// 26.08.: Agenten geocodierten Kiez-NAMEN per address_lookup, nur um
	// Koordinaten für Folge-Tools zu bekommen. Die Treffer liefern sie mit.
	it('liefert lat/lng als BBox-Zentrum der Feature-Geometrie', () => {
		const fc = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					properties: { PLR_ID: '1', PLR_NAME: 'Test', kiez_name: 'Testkiez', m_ruhe_luft: 0.9 },
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[13.3, 52.5],
								[13.5, 52.5],
								[13.5, 52.6],
								[13.3, 52.6],
								[13.3, 52.5]
							]
						]
					}
				}
			]
		} as never;
		const [r] = topResults(fc, { ...neutralWeights(), ruheLuft: 2 }, 1);
		expect(r.lng).toBeCloseTo(13.4, 5);
		expect(r.lat).toBeCloseTo(52.55, 5);
	});
});
