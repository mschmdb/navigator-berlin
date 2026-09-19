import { describe, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import {
	bakeJahrProperties,
	buildZeitJahrOptions,
	fillColorExpression,
	fillOpacityExpression,
	fillPatternExpression,
	jahrPropKeys,
	wechselOutlineExpression,
	winnerForJahrJs
} from './winner-map-expressions.js';
import { NEUTRAL_FARBE, NEUTRAL_OPACITY, type WinnerApiRow } from './winner-map-data.js';
import { parteiColor } from '$lib/data/partei-farben.js';
import { patternImageId } from './partei-pattern-images.js';

function polygon() {
	return {
		type: 'Polygon' as const,
		coordinates: [
			[
				[0, 0],
				[0, 1],
				[1, 1],
				[0, 0]
			]
		]
	};
}

function fc(count: number): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: Array.from({ length: count }, () => ({
			type: 'Feature' as const,
			properties: {},
			geometry: polygon()
		}))
	};
}

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

describe('bakeJahrProperties', () => {
	it('backt pro Gebiet und Jahr Farbe/Partei/Anteil/has_winner', () => {
		const baked = bakeJahrProperties(fc(1), ['a'], ['Alpha'], [
			row({ jahr: 2021, gebiet_slug: 'a', partei: 'SPD', anteil: 0.4 }),
			row({ jahr: 2023, gebiet_slug: 'a', partei: 'CDU', anteil: 0.5 })
		]);
		const props = baked.features[0].properties;
		expect(props.gebiet_slug).toBe('a');
		expect(props.gebiet_name).toBe('Alpha');
		expect(props[jahrPropKeys(2021).farbe]).toBe(parteiColor('SPD'));
		expect(props[jahrPropKeys(2021).partei]).toBe('SPD');
		expect(props[jahrPropKeys(2021).anteil]).toBe(0.4);
		expect(props[jahrPropKeys(2021).hw]).toBe(1);
		expect(props[jahrPropKeys(2021).patternImageId]).toBe(patternImageId('SPD'));
		expect(props[jahrPropKeys(2023).farbe]).toBe(parteiColor('CDU'));
	});

	it('Gebiete ohne Match für ein Jahr bleiben neutral (DB-los/kein Crash)', () => {
		const baked = bakeJahrProperties(fc(1), ['a'], ['Alpha'], [
			row({ jahr: 2021, gebiet_slug: 'b' })
		]);
		const props = baked.features[0].properties;
		expect(props[jahrPropKeys(2021).farbe]).toBe(NEUTRAL_FARBE);
		expect(props[jahrPropKeys(2021).hw]).toBe(0);
		expect(props[jahrPropKeys(2021).partei]).toBeNull();
	});

	it('setzt das Wechsel-Flag am Jahr der effektiven Reihe, nicht am ersetzten Eltern-Jahr', () => {
		const baked = bakeJahrProperties(fc(1), ['a'], ['Alpha'], [
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'a', partei: 'GRÜNE' }),
			row({
				jahr: 2023,
				gebiet_slug: 'a',
				partei: 'GRÜNE',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
		]);
		const props = baked.features[0].properties;
		expect(props[jahrPropKeys(2021).wechsel]).toBe(0);
		expect(props[jahrPropKeys(2023).wechsel]).toBe(1);
		expect(props[jahrPropKeys(2016).wechsel]).toBe(0);
	});
});

describe('winnerForJahrJs <-> Expressions Klammer-Test', () => {
	it('liest dieselben Property-Keys wie fillColorExpression/fillOpacityExpression/wechselOutlineExpression', () => {
		const jahr = 2023;
		const keys = jahrPropKeys(jahr);

		const colorExpr = fillColorExpression(jahr) as unknown[];
		expect((colorExpr[1] as unknown[])[1]).toBe(keys.farbe);

		const opacityExpr = fillOpacityExpression(jahr) as unknown[];
		const caseCheck = opacityExpr[1] as unknown[];
		expect((caseCheck[1] as unknown[])[1]).toBe(keys.hw);
		const interpolate = opacityExpr[2] as unknown[];
		const toNumber = interpolate[2] as unknown[];
		expect((toNumber[1] as unknown[])[1]).toBe(keys.anteil);

		const patternExpr = fillPatternExpression(jahr, 'neutral-pattern') as unknown[];
		expect((patternExpr[1] as unknown[])[1]).toBe(keys.patternImageId);

		const outlineExpr = wechselOutlineExpression(jahr) as unknown[];
		expect((outlineExpr[1] as unknown[])[1]).toBe(keys.wechsel);

		// winnerForJahrJs liest exakt dieselben Keys: baked Properties mit
		// bekannten Werten rundtrippen und mit den Expression-Keys abgleichen.
		const props: Record<string, unknown> = {
			gebiet_name: 'Alpha',
			[keys.farbe]: '#123456',
			[keys.partei]: 'SPD',
			[keys.anteil]: 0.42,
			[keys.hw]: 1,
			[keys.wechsel]: 1
		};
		const twin = winnerForJahrJs(props, jahr);
		expect(twin).toEqual({
			gebietName: 'Alpha',
			partei: 'SPD',
			farbe: '#123456',
			anteil: 0.42,
			hasWinner: true,
			wechsel: true
		});
	});

	it('winnerForJahrJs fällt bei fehlenden/verkehrten Werten neutral zurück', () => {
		const twin = winnerForJahrJs({}, 2023);
		expect(twin).toEqual({
			gebietName: '',
			partei: null,
			farbe: NEUTRAL_FARBE,
			anteil: 0,
			hasWinner: false,
			wechsel: false
		});
	});
});

describe('buildZeitJahrOptions', () => {
	it('liefert aufsteigend sortierte, distinkte Jahre mit Wiederholungswahl-Flag', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2023, gebiet_slug: 'a', is_repeat_election: true }),
			row({ jahr: 2016, gebiet_slug: 'a', is_repeat_election: false }),
			row({ jahr: 2016, gebiet_slug: 'b', is_repeat_election: false }),
			row({ jahr: 2021, gebiet_slug: 'a', is_repeat_election: false })
		];
		expect(buildZeitJahrOptions(rows)).toEqual([
			{ jahr: 2016, isRepeatElection: false },
			{ jahr: 2021, isRepeatElection: false },
			{ jahr: 2023, isRepeatElection: true }
		]);
	});

	it('ignoriert Rows ohne Jahr und liefert eine leere Liste ohne Daten', () => {
		expect(buildZeitJahrOptions([row({ jahr: null })])).toEqual([]);
		expect(buildZeitJahrOptions([])).toEqual([]);
	});
});

describe('fillOpacityExpression', () => {
	it('nutzt dieselbe Anteils-Rampe wie der Stimmbezirks-/Init-Pfad (Neutral-Opacity als Fallback-Zweig)', () => {
		const expr = fillOpacityExpression(2023) as unknown[];
		expect(expr[0]).toBe('case');
		expect(expr[3]).toBe(NEUTRAL_OPACITY);
	});
});
