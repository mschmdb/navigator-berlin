import { describe, it, expect } from 'vitest';
import {
	findUrnenOhneGruppe,
	findVerwaisteBriefwahlbezirke,
	findGeometrieUrnenOhneDb,
	findGruppenOhneDbBriefwahl,
	checkGruppenSummeGegenBerlin
} from './gruppe-preflight.js';
import type { GruppeMapping } from './gruppe-mapper.js';

const m = (dbUwbId: string, gruppeId: string, bezirkCode: string): GruppeMapping => ({
	dbUwbId,
	gruppeId,
	bezirkCode
});

// Kein `findGruppenSpanningMultipleBezirke`-Test mehr (Review-Fund): der
// Check war strukturell wirkungslos (Gruppen-ID und `bezirkCode` kommen aus
// derselben `BEZ`-Property) und wurde entfernt, siehe Kommentar in
// `gruppe-preflight.ts`.

describe('findUrnenOhneGruppe', () => {
	it('leer, wenn jede DB-Urne ein Mapping hat', () => {
		const mappings = [m('09W726', '09B7P', '09')];
		expect(findUrnenOhneGruppe(['09W726'], mappings)).toEqual([]);
	});

	it('meldet DB-Urnen ohne Geometrie-Mapping', () => {
		const mappings = [m('09W726', '09B7P', '09')];
		expect(findUrnenOhneGruppe(['09W726', '09W999'], mappings)).toEqual(['09W999']);
	});
});

describe('findVerwaisteBriefwahlbezirke', () => {
	it('leer, wenn jeder Briefwahl-Stimmbezirk als Gruppen-ID vorkommt', () => {
		const mappings = [m('09W726', '09B7P', '09'), m('09W727', '09B7P', '09')];
		expect(findVerwaisteBriefwahlbezirke(['09B7P'], mappings)).toEqual([]);
	});

	it('meldet Briefwahl-Stimmbezirke ohne Urnen-Zuordnung', () => {
		const mappings = [m('09W726', '09B7P', '09')];
		expect(findVerwaisteBriefwahlbezirke(['09B7P', '09B9Z'], mappings)).toEqual(['09B9Z']);
	});
});

describe('findGeometrieUrnenOhneDb', () => {
	it('leer, wenn jede Geometrie-Urne eine DB-Row hat', () => {
		const mappings = [m('09W726', '09B7P', '09')];
		expect(findGeometrieUrnenOhneDb(mappings, ['09W726'])).toEqual([]);
	});

	it('meldet Geometrie-Urnen ohne DB-Row (Review-Fund: floss bisher ungefiltert in Kiez-Split/writeGruppenZuordnung ein)', () => {
		const mappings = [m('09W726', '09B7P', '09'), m('09W999', '09B7P', '09')];
		expect(findGeometrieUrnenOhneDb(mappings, ['09W726'])).toEqual(['09W999']);
	});
});

describe('findGruppenOhneDbBriefwahl', () => {
	it('leer, wenn jede Geometrie-Gruppe eine DB-Briefwahl-Row hat', () => {
		const mappings = [m('09W726', '09B7P', '09')];
		expect(findGruppenOhneDbBriefwahl(mappings, ['09B7P'])).toEqual([]);
	});

	it('meldet Geometrie-Gruppen ohne DB-Briefwahl-Row (Review-Fund: passierte bisher still, Kiez-Split verteilt für diese Gruppe nie Briefwahl)', () => {
		const mappings = [m('09W726', '09B7P', '09')];
		expect(findGruppenOhneDbBriefwahl(mappings, [])).toEqual(['09B7P']);
	});
});

// I/O-Matrix "Summen-Check": Summe aller Gruppen einer Wahl == amtliche
// Berlin-Summe (keine Stimme geht verloren, Boundary "Always"). berlinSumme
// kommt als UNABHÄNGIGER Wert vom Aufrufer (SUM über wahl_aggregat_berlin),
// nicht aus denselben ergebnisRows (Review-Fund: sonst unsichtbar gegen
// einen Bug in der ergebnis-Ladung selbst).
describe('checkGruppenSummeGegenBerlin', () => {
	it('matches=true, wenn Gruppen-Summe und unabhängige Berlin-Summe übereinstimmen', () => {
		const mappings = [m('09W726', '09B7P', '09'), m('09W727', '09B7P', '09')];
		const ergebnisRows = [
			{ uwbId: '09W726', stimmen: 10 },
			{ uwbId: '09W727', stimmen: 20 },
			{ uwbId: '09B7P', stimmen: 5 }
		];
		const result = checkGruppenSummeGegenBerlin(ergebnisRows, mappings, ['09B7P'], 35);
		expect(result).toEqual({ gruppenSumme: 35, berlinSumme: 35, matches: true });
	});

	it('matches=false, wenn eine ergebnis-Row weder Urne noch Briefwahl-Stimmbezirk der Gruppen-Zuordnung ist', () => {
		const mappings = [m('09W726', '09B7P', '09')];
		const ergebnisRows = [
			{ uwbId: '09W726', stimmen: 10 },
			{ uwbId: '09B7P', stimmen: 5 },
			{ uwbId: '99W999', stimmen: 7 } // nicht in mappings/dbBriefUwbIds
		];
		// Unabhängige Berlin-Summe (wahl_aggregat_berlin) zählt die verwaiste
		// Row mit -> 22, aber die Gruppen-Summe erreicht sie nicht -> 15.
		const result = checkGruppenSummeGegenBerlin(ergebnisRows, mappings, ['09B7P'], 22);
		expect(result).toEqual({ gruppenSumme: 15, berlinSumme: 22, matches: false });
	});

	it('matches=false, wenn ergebnis und wahl_aggregat_berlin selbst auseinanderlaufen (unabhängige Quellen decken das auf)', () => {
		const mappings = [m('09W726', '09B7P', '09')];
		const ergebnisRows = [{ uwbId: '09W726', stimmen: 10 }];
		// Gruppen-Summe (aus ergebnisRows) wäre 10, aber wahl_aggregat_berlin
		// sagt 12 -- eine Diskrepanz, die eine aus denselben Rows abgeleitete
		// Referenz nie hätte finden können.
		const result = checkGruppenSummeGegenBerlin(ergebnisRows, mappings, [], 12);
		expect(result).toEqual({ gruppenSumme: 10, berlinSumme: 12, matches: false });
	});

	it('leere ergebnis-Rows + berlinSumme 0: matches=true', () => {
		expect(checkGruppenSummeGegenBerlin([], [], [], 0)).toEqual({
			gruppenSumme: 0,
			berlinSumme: 0,
			matches: true
		});
	});
});
