import { describe, it, expect } from 'vitest';
import { distributeLargestRemainder, computeKiezStimmenMitBriefwahl } from './briefwahl-split.js';

describe('distributeLargestRemainder', () => {
	it('verteilt exakt proportional wenn glatt teilbar', () => {
		expect(distributeLargestRemainder(100, [1, 1])).toEqual([50, 50]);
	});

	it('summiert sich immer exakt auf total (Largest-Remainder)', () => {
		// 10 Stimmen auf Gewichte 1,1,1 (je 3.33): floor=3,3,3=9, Rest=1 → erste Stelle +1
		expect(distributeLargestRemainder(10, [1, 1, 1])).toEqual([4, 3, 3]);
	});

	it('gewichtet nach wb_u (Design Notes Beispiel)', () => {
		// total=9, weights=[2,1] -> raw=[6,3] glatt
		expect(distributeLargestRemainder(9, [2, 1])).toEqual([6, 3]);
	});

	it('total 0 liefert nur Nullen', () => {
		expect(distributeLargestRemainder(0, [5, 3, 2])).toEqual([0, 0, 0]);
	});

	it('Gewichtssumme 0 liefert nur Nullen (Div-durch-0-Schutz)', () => {
		expect(distributeLargestRemainder(10, [0, 0])).toEqual([0, 0]);
	});

	it('leere Gewichte-Liste liefert leeres Array', () => {
		expect(distributeLargestRemainder(10, [])).toEqual([]);
	});
});

describe('computeKiezStimmenMitBriefwahl', () => {
	it('verteilt Briefwahl anteilig nach Wahlberechtigten auf die Urnen-Kieze (Design Notes Formel)', () => {
		const urnen = [
			{ dbUwbId: '09W726', gruppeId: '09B7P', kiezSlug: 'kiez-a', wahlberechtigte: 600 },
			{ dbUwbId: '09W727', gruppeId: '09B7P', kiezSlug: 'kiez-b', wahlberechtigte: 400 }
		];
		const ergebnis = [
			{ uwbId: '09W726', parteiId: 1, stimmen: 100 },
			{ uwbId: '09W727', parteiId: 1, stimmen: 50 },
			{ uwbId: '09B7P', parteiId: 1, stimmen: 100 } // Briefwahl-Row der Gruppe
		];
		const { kiezStimmen, ohneKiezSumme } = computeKiezStimmenMitBriefwahl(urnen, ergebnis);
		// Brief 100 * 600/1000 = 60 -> kiez-a: 100+60=160; 100*400/1000=40 -> kiez-b: 50+40=90
		expect(kiezStimmen).toContainEqual({ kiezSlug: 'kiez-a', parteiId: 1, stimmen: 160 });
		expect(kiezStimmen).toContainEqual({ kiezSlug: 'kiez-b', parteiId: 1, stimmen: 90 });
		expect(ohneKiezSumme).toBe(0);
	});

	it('Summe über alle Kieze bleibt exakt (keine verlorene Stimme, Boundary "Always")', () => {
		const urnen = [
			{ dbUwbId: '01W100', gruppeId: '01B1A', kiezSlug: 'kiez-a', wahlberechtigte: 333 },
			{ dbUwbId: '01W101', gruppeId: '01B1A', kiezSlug: 'kiez-b', wahlberechtigte: 333 },
			{ dbUwbId: '01W102', gruppeId: '01B1A', kiezSlug: 'kiez-c', wahlberechtigte: 334 }
		];
		const ergebnis = [
			{ uwbId: '01W100', parteiId: 1, stimmen: 10 },
			{ uwbId: '01W101', parteiId: 1, stimmen: 20 },
			{ uwbId: '01W102', parteiId: 1, stimmen: 30 },
			{ uwbId: '01B1A', parteiId: 1, stimmen: 77 }
		];
		const { kiezStimmen, ohneKiezSumme } = computeKiezStimmenMitBriefwahl(urnen, ergebnis);
		const total = kiezStimmen.reduce((a, r) => a + r.stimmen, 0);
		expect(total).toBe(10 + 20 + 30 + 77);
		expect(ohneKiezSumme).toBe(0);
	});

	it('fällt auf Gleichverteilung zurück, wenn eine Urne der Gruppe keine Wahlberechtigten hat', () => {
		const urnen = [
			{ dbUwbId: '09W726', gruppeId: '09B7P', kiezSlug: 'kiez-a', wahlberechtigte: 900 },
			{ dbUwbId: '09W727', gruppeId: '09B7P', kiezSlug: 'kiez-b', wahlberechtigte: null }
		];
		const ergebnis = [{ uwbId: '09B7P', parteiId: 1, stimmen: 100 }];
		const { kiezStimmen } = computeKiezStimmenMitBriefwahl(urnen, ergebnis);
		// Gleichverteilung trotz sehr unterschiedlicher (bzw. fehlender) Wahlberechtigten: 50/50
		expect(kiezStimmen).toContainEqual({ kiezSlug: 'kiez-a', parteiId: 1, stimmen: 50 });
		expect(kiezStimmen).toContainEqual({ kiezSlug: 'kiez-b', parteiId: 1, stimmen: 50 });
	});

	it('behandelt wahlberechtigte=0 wie null (Review-Fund: eine 0 bekäme sonst per Largest-Remainder immer exakt 0 Anteil statt Gleichverteilung auszulösen)', () => {
		const urnen = [
			{ dbUwbId: '09W726', gruppeId: '09B7P', kiezSlug: 'kiez-a', wahlberechtigte: 900 },
			{ dbUwbId: '09W727', gruppeId: '09B7P', kiezSlug: 'kiez-b', wahlberechtigte: 0 }
		];
		const ergebnis = [{ uwbId: '09B7P', parteiId: 1, stimmen: 100 }];
		const { kiezStimmen } = computeKiezStimmenMitBriefwahl(urnen, ergebnis);
		// Gleichverteilung (50/50), NICHT proportional zu 900:0 (was kiez-b auf 0 setzen würde).
		expect(kiezStimmen).toContainEqual({ kiezSlug: 'kiez-a', parteiId: 1, stimmen: 50 });
		expect(kiezStimmen).toContainEqual({ kiezSlug: 'kiez-b', parteiId: 1, stimmen: 50 });
	});

	it('zählt Urnen ohne Kiez-Zuordnung (Centroid außerhalb aller Kieze) separat in ohneKiezSumme statt sie fallen zu lassen', () => {
		const urnen = [
			{ dbUwbId: '09W726', gruppeId: '09B7P', kiezSlug: null, wahlberechtigte: 500 },
			{ dbUwbId: '09W727', gruppeId: '09B7P', kiezSlug: 'kiez-b', wahlberechtigte: 500 }
		];
		const ergebnis = [
			{ uwbId: '09W726', parteiId: 1, stimmen: 10 },
			{ uwbId: '09W727', parteiId: 1, stimmen: 20 },
			{ uwbId: '09B7P', parteiId: 1, stimmen: 100 }
		];
		const { kiezStimmen, ohneKiezSumme } = computeKiezStimmenMitBriefwahl(urnen, ergebnis);
		expect(kiezStimmen).toEqual([{ kiezSlug: 'kiez-b', parteiId: 1, stimmen: 70 }]);
		// 09W726 eigene 10 Stimmen + Brief-Anteil 100*500/1000=50 -> 60, landet in ohneKiezSumme
		expect(ohneKiezSumme).toBe(60);
		// Invariante: sumKiez + ohneKiezSumme == Gruppen-Summe (10+20+100=130)
		const sumKiez = kiezStimmen.reduce((a, r) => a + r.stimmen, 0);
		expect(sumKiez + ohneKiezSumme).toBe(10 + 20 + 100);
	});

	it('Gruppe ohne Briefwahl-Row in ergebnis (kein Match) verteilt nichts, eigene Urnen-Stimmen bleiben', () => {
		const urnen = [{ dbUwbId: '01W100', gruppeId: '01B1A', kiezSlug: 'kiez-a', wahlberechtigte: 100 }];
		const ergebnis = [{ uwbId: '01W100', parteiId: 1, stimmen: 5 }];
		const { kiezStimmen, ohneKiezSumme } = computeKiezStimmenMitBriefwahl(urnen, ergebnis);
		expect(kiezStimmen).toEqual([{ kiezSlug: 'kiez-a', parteiId: 1, stimmen: 5 }]);
		expect(ohneKiezSumme).toBe(0);
	});
});
