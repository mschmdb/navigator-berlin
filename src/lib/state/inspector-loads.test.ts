import { describe, expect, it } from 'vitest';
import {
	IDLE_PENDING,
	createInspectorLoads,
	settledValues,
	type InspectorLoadTarget
} from './inspector-loads.js';

function target(): InspectorLoadTarget {
	return {
		kiezScore: { overall: 64 } as unknown as InspectorLoadTarget['kiezScore'],
		wahlResults: { wahlen: [] } as unknown as InspectorLoadTarget['wahlResults'],
		kiezLaermDb: 52,
		climateSeries: { summerDays: [] } as unknown as InspectorLoadTarget['climateSeries'],
		inspectorPending: { ...IDLE_PENDING }
	};
}

describe('createInspectorLoads', () => {
	it('lässt bei offenem Inspector die alten Werte stehen und markiert alle Blöcke als ladend', () => {
		const t = target();
		const before = { score: t.kiezScore, wahl: t.wahlResults };
		const loads = createInspectorLoads(t);
		loads.begin({ keepStale: true });
		expect(t.kiezScore).toBe(before.score);
		expect(t.wahlResults).toBe(before.wahl);
		expect(t.kiezLaermDb).toBe(52);
		expect(t.climateSeries).not.toBeNull();
		expect(t.inspectorPending).toEqual({ score: true, wahl: true, laerm: true, climate: true });
	});

	it('leert beim ersten Öffnen die Werte, damit keine fremde Adresse durchscheint', () => {
		const t = target();
		const loads = createInspectorLoads(t);
		loads.begin({ keepStale: false });
		expect(t.kiezScore).toBeNull();
		expect(t.wahlResults).toBeNull();
		expect(t.kiezLaermDb).toBeNull();
		expect(t.climateSeries).toBeNull();
		expect(t.inspectorPending).toEqual({ score: true, wahl: true, laerm: true, climate: true });
	});

	it('übernimmt eine Antwort der aktuellen Anfrage und beendet nur diesen Block', () => {
		const t = target();
		const loads = createInspectorLoads(t);
		const token = loads.begin({ keepStale: true });
		const applied = loads.settle(token, 'wahl', () => {
			t.wahlResults = null;
		});
		expect(applied).toBe(true);
		expect(t.wahlResults).toBeNull();
		expect(t.inspectorPending).toEqual({ score: true, wahl: false, laerm: true, climate: true });
	});

	it('verwirft eine Antwort einer älteren Anfrage, auch wenn sie später ankommt', () => {
		const t = target();
		const loads = createInspectorLoads(t);
		const first = loads.begin({ keepStale: true });
		const second = loads.begin({ keepStale: true });
		let staleApplied = false;
		const applied = loads.settle(first, 'score', () => {
			staleApplied = true;
		});
		expect(applied).toBe(false);
		expect(staleApplied).toBe(false);
		expect(t.inspectorPending.score).toBe(true);
		expect(loads.isCurrent(second)).toBe(true);
		expect(loads.isCurrent(first)).toBe(false);
	});

	it('cancel beendet alle Ladezustände und macht laufende Anfragen ungültig', () => {
		const t = target();
		const loads = createInspectorLoads(t);
		const token = loads.begin({ keepStale: true });
		loads.cancel();
		expect(t.inspectorPending).toEqual(IDLE_PENDING);
		expect(loads.settle(token, 'laerm', () => {})).toBe(false);
	});

	it('meldet einen Block als fertig, ohne Werte anzufassen, wenn nichts neu zu laden ist', () => {
		const t = target();
		const loads = createInspectorLoads(t);
		const token = loads.begin({ keepStale: true });
		const series = t.climateSeries;
		expect(loads.settle(token, 'climate', () => {})).toBe(true);
		expect(t.climateSeries).toBe(series);
		expect(t.inspectorPending.climate).toBe(false);
	});

	it('Klima-Reihe gilt nur für die Station, deren Antwort angekommen ist', () => {
		const t = target();
		t.climateSeries = null;
		const loads = createInspectorLoads(t);
		const a = loads.begin({ keepStale: false });
		const seriesX = { station: 'X' } as unknown as InspectorLoadTarget['climateSeries'];
		loads.settleClimate(a, 'X', seriesX);
		expect(loads.hasClimateFor('X')).toBe(true);

		// A -> B (Station Y) lädt noch, dann C (auch Station Y): die alte Reihe ist von X.
		loads.begin({ keepStale: true });
		const c = loads.begin({ keepStale: true });
		expect(t.climateSeries).toBe(seriesX);
		expect(loads.hasClimateFor('Y')).toBe(false);
		expect(loads.hasClimateFor('X')).toBe(true);

		const seriesY = { station: 'Y' } as unknown as InspectorLoadTarget['climateSeries'];
		expect(loads.settleClimate(c, 'Y', seriesY)).toBe(true);
		expect(t.climateSeries).toBe(seriesY);
		expect(loads.hasClimateFor('Y')).toBe(true);
		expect(t.inspectorPending.climate).toBe(false);
	});

	it('vergisst die Klima-Station, wenn die Werte geleert werden', () => {
		const t = target();
		const loads = createInspectorLoads(t);
		const a = loads.begin({ keepStale: false });
		loads.settleClimate(a, 'X', {
			station: 'X'
		} as unknown as InspectorLoadTarget['climateSeries']);
		loads.begin({ keepStale: false });
		expect(loads.hasClimateFor('X')).toBe(false);
	});

	it('settledValues blendet Werte aus, die noch zur vorigen Adresse gehören', () => {
		const t = target();
		t.inspectorPending = { score: true, wahl: false, laerm: true, climate: false };
		expect(settledValues(t)).toEqual({
			kiezScore: null,
			wahlResults: t.wahlResults,
			kiezLaermDb: null,
			climateSeries: t.climateSeries
		});
		t.inspectorPending = { ...IDLE_PENDING };
		expect(settledValues(t).kiezScore).toBe(t.kiezScore);
	});
});
