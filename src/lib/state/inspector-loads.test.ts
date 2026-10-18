import { describe, expect, it } from 'vitest';
import {
	IDLE_PENDING,
	createInspectorLoads,
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
});
