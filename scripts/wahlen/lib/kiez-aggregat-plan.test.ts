import { describe, it, expect } from 'vitest';
import {
	buildKiezAggregatPlan,
	WAHLBERECHTIGTE_MISSING_THRESHOLD,
	type KiezAggregatPlanInput
} from './kiez-aggregat-plan.js';
import type { GruppeMapping } from './gruppe-mapper.js';

const m = (dbUwbId: string, gruppeId: string, bezirkCode = '09'): GruppeMapping => ({
	dbUwbId,
	gruppeId,
	bezirkCode
});

function baseInput(overrides: Partial<KiezAggregatPlanInput> = {}): KiezAggregatPlanInput {
	const mappings = [m('09W726', '09B7P'), m('09W727', '09B7P')];
	return {
		wahlSlug: 'agh26',
		stimmtyp: 'zweitstimme',
		wahlId: 1,
		geometryMappings: mappings,
		dbUrneUwbIds: ['09W726', '09W727'],
		dbBriefUwbIds: ['09B7P'],
		wahlberechtigteByUwbId: new Map([
			['09W726', 600],
			['09W727', 400]
		]),
		kiezSlugByUwbId: new Map([
			['09W726', 'kiez-a'],
			['09W727', 'kiez-b']
		]),
		ergebnisRows: [
			{ uwbId: '09W726', parteiId: 1, stimmen: 100 },
			{ uwbId: '09W727', parteiId: 1, stimmen: 50 },
			{ uwbId: '09B7P', parteiId: 1, stimmen: 100 }
		],
		berlinSumme: 250,
		...overrides
	};
}

describe('buildKiezAggregatPlan (happy path)', () => {
	it('baut Gruppen-Zuordnung + Kiez-Insert-Values, Σ anteil je Kiez = 1', () => {
		const plan = buildKiezAggregatPlan(baseInput());
		expect(plan.gruppenZuordnungValues).toEqual(
			expect.arrayContaining([
				{ uwbId: '09W726', gruppeId: '09B7P' },
				{ uwbId: '09W727', gruppeId: '09B7P' },
				{ uwbId: '09B7P', gruppeId: '09B7P' }
			])
		);
		expect(plan.gruppenZuordnungValues).toHaveLength(3);

		const byKiez = new Map<string, number>();
		for (const v of plan.kiezAggregatInsertValues) {
			byKiez.set(v.kiezSlug, (byKiez.get(v.kiezSlug) ?? 0) + v.anteil);
		}
		for (const [, sum] of byKiez) expect(sum).toBeCloseTo(1, 10);
	});

	it('zweite Partei in einem Kiez teilt sich den Anteil korrekt (Σ = 1 bleibt bei mehreren Parteien)', () => {
		const input = baseInput({
			ergebnisRows: [
				{ uwbId: '09W726', parteiId: 1, stimmen: 60 },
				{ uwbId: '09W726', parteiId: 2, stimmen: 40 },
				{ uwbId: '09W727', parteiId: 1, stimmen: 50 },
				{ uwbId: '09B7P', parteiId: 1, stimmen: 100 }
			],
			berlinSumme: 250
		});
		const plan = buildKiezAggregatPlan(input);
		const byKiez = new Map<string, number>();
		for (const v of plan.kiezAggregatInsertValues) {
			byKiez.set(v.kiezSlug, (byKiez.get(v.kiezSlug) ?? 0) + v.anteil);
		}
		for (const [, sum] of byKiez) expect(sum).toBeCloseTo(1, 10);
	});
});

describe('buildKiezAggregatPlan (Gates werfen)', () => {
	it('Urne ohne Gruppe -> throw', () => {
		const input = baseInput({ dbUrneUwbIds: ['09W726', '09W727', '09W999'] });
		expect(() => buildKiezAggregatPlan(input)).toThrow(/Urne\(n\) ohne Gruppe/);
	});

	it('verwaister Briefwahl-Stimmbezirk -> throw', () => {
		const input = baseInput({ dbBriefUwbIds: ['09B7P', '09B9Z'] });
		expect(() => buildKiezAggregatPlan(input)).toThrow(/verwaiste Briefwahl-Stimmbezirke/);
	});

	it('Gruppe ohne DB-Briefwahl-Row -> throw', () => {
		const input = baseInput({ dbBriefUwbIds: [] });
		expect(() => buildKiezAggregatPlan(input)).toThrow(/ohne DB-Briefwahl-Row/);
	});

	it('Summen-Check fehlgeschlagen (Gruppen-Summe ≠ unabhängige Berlin-Summe) -> throw', () => {
		const input = baseInput({ berlinSumme: 999 });
		expect(() => buildKiezAggregatPlan(input)).toThrow(/Summen-Check fehlgeschlagen/);
	});

	it(`Wahlberechtigte-Lücke über der ${WAHLBERECHTIGTE_MISSING_THRESHOLD * 100}%-Schwelle -> throw`, () => {
		// 100 Urnen, 2 davon ohne Wahlberechtigte (2 % > 1 %-Schwelle).
		const mappings: GruppeMapping[] = [];
		const dbUrneUwbIds: string[] = [];
		const wahlberechtigteByUwbId = new Map<string, number | null>();
		const kiezSlugByUwbId = new Map<string, string | null>();
		const ergebnisRows: KiezAggregatPlanInput['ergebnisRows'] = [];
		for (let i = 0; i < 100; i++) {
			const uwbId = `09W${String(i).padStart(3, '0')}`;
			mappings.push(m(uwbId, '09B7P'));
			dbUrneUwbIds.push(uwbId);
			wahlberechtigteByUwbId.set(uwbId, i < 2 ? null : 500);
			kiezSlugByUwbId.set(uwbId, 'kiez-a');
			ergebnisRows.push({ uwbId, parteiId: 1, stimmen: 10 });
		}
		ergebnisRows.push({ uwbId: '09B7P', parteiId: 1, stimmen: 50 });
		const input = baseInput({
			geometryMappings: mappings,
			dbUrneUwbIds,
			dbBriefUwbIds: ['09B7P'],
			wahlberechtigteByUwbId,
			kiezSlugByUwbId,
			ergebnisRows,
			berlinSumme: 100 * 10 + 50
		});
		expect(() => buildKiezAggregatPlan(input)).toThrow(/Wahlberechtigten/);
	});

	it('wahlberechtigte=0 zählt wie fehlend für die Schwelle (Review-Fund)', () => {
		const mappings: GruppeMapping[] = [];
		const dbUrneUwbIds: string[] = [];
		const wahlberechtigteByUwbId = new Map<string, number | null>();
		const kiezSlugByUwbId = new Map<string, string | null>();
		const ergebnisRows: KiezAggregatPlanInput['ergebnisRows'] = [];
		for (let i = 0; i < 100; i++) {
			const uwbId = `09W${String(i).padStart(3, '0')}`;
			mappings.push(m(uwbId, '09B7P'));
			dbUrneUwbIds.push(uwbId);
			wahlberechtigteByUwbId.set(uwbId, i < 2 ? 0 : 500); // 0 statt null
			kiezSlugByUwbId.set(uwbId, 'kiez-a');
			ergebnisRows.push({ uwbId, parteiId: 1, stimmen: 10 });
		}
		ergebnisRows.push({ uwbId: '09B7P', parteiId: 1, stimmen: 50 });
		const input = baseInput({
			geometryMappings: mappings,
			dbUrneUwbIds,
			dbBriefUwbIds: ['09B7P'],
			wahlberechtigteByUwbId,
			kiezSlugByUwbId,
			ergebnisRows,
			berlinSumme: 100 * 10 + 50
		});
		expect(() => buildKiezAggregatPlan(input)).toThrow(/Wahlberechtigten/);
	});

	it('Wahlberechtigte-Lücke unter der Schwelle bleibt grün', () => {
		const mappings: GruppeMapping[] = [];
		const dbUrneUwbIds: string[] = [];
		const wahlberechtigteByUwbId = new Map<string, number | null>();
		const kiezSlugByUwbId = new Map<string, string | null>();
		const ergebnisRows: KiezAggregatPlanInput['ergebnisRows'] = [];
		for (let i = 0; i < 200; i++) {
			const uwbId = `09W${String(i).padStart(3, '0')}`;
			mappings.push(m(uwbId, '09B7P'));
			dbUrneUwbIds.push(uwbId);
			wahlberechtigteByUwbId.set(uwbId, i < 1 ? null : 500); // 1/200 = 0,5 % < 1 %
			kiezSlugByUwbId.set(uwbId, 'kiez-a');
			ergebnisRows.push({ uwbId, parteiId: 1, stimmen: 10 });
		}
		ergebnisRows.push({ uwbId: '09B7P', parteiId: 1, stimmen: 50 });
		const input = baseInput({
			geometryMappings: mappings,
			dbUrneUwbIds,
			dbBriefUwbIds: ['09B7P'],
			wahlberechtigteByUwbId,
			kiezSlugByUwbId,
			ergebnisRows,
			berlinSumme: 200 * 10 + 50
		});
		expect(() => buildKiezAggregatPlan(input)).not.toThrow();
	});
});

describe('buildKiezAggregatPlan (Logs)', () => {
	it('loggt gefilterte Geometrie-Urnen ohne DB-Row, statt sie einfließen zu lassen', () => {
		const input = baseInput({
			geometryMappings: [m('09W726', '09B7P'), m('09W727', '09B7P'), m('09W999', '09B7P')],
			dbUrneUwbIds: ['09W726', '09W727']
		});
		const plan = buildKiezAggregatPlan(input);
		expect(plan.logs.some((l) => l.includes('09W999'))).toBe(true);
		expect(plan.gruppenZuordnungValues.some((v) => v.uwbId === '09W999')).toBe(false);
	});
});
