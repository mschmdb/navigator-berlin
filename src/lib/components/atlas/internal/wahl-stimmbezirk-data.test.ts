import { describe, expect, it } from 'vitest';
import {
	buildStimmbezirkZeilen,
	stimmbezirkParteien,
	type StimmbezirkWinner
} from './wahl-stimmbezirk-data.js';

const w = (uwbId: string, parteiKurzname: string, anteil: number): StimmbezirkWinner => ({
	uwbId,
	parteiKurzname,
	farbeHex: '#000000',
	anteil
});

describe('stimmbezirkParteien (#107)', () => {
	it('listet jede vorkommende Partei einmal, häufigste zuerst', () => {
		const parteien = stimmbezirkParteien([
			w('a', 'AfD', 0.3),
			w('b', 'CDU', 0.4),
			w('c', 'CDU', 0.35),
			w('d', 'SPD', 0.3),
			w('e', 'CDU', 0.3),
			w('f', 'AfD', 0.31)
		]);
		expect(parteien).toEqual(['CDU', 'AfD', 'SPD']);
	});

	it('bricht Gleichstand alphabetisch', () => {
		expect(stimmbezirkParteien([w('a', 'SPD', 0.3), w('b', 'AfD', 0.3)])).toEqual(['AfD', 'SPD']);
	});

	it('liefert eine leere Liste ohne Daten', () => {
		expect(stimmbezirkParteien([])).toEqual([]);
	});
});

describe('buildStimmbezirkZeilen (#107)', () => {
	it('nutzt den Anzeigenamen der Gruppe und fällt sonst auf die ID zurück, sortiert nach Name', () => {
		const zeilen = buildStimmbezirkZeilen(
			[w('02', 'CDU', 0.4), w('01', 'AfD', 0.3)],
			new Map([['01', 'Wahlbezirk 101 und Brief 1']]),
			(id) => `Gruppe ${id}`
		);
		expect(zeilen).toEqual([
			{ gebiet: 'Gruppe 02', partei: 'CDU', anteil: 0.4 },
			{ gebiet: 'Wahlbezirk 101 und Brief 1', partei: 'AfD', anteil: 0.3 }
		]);
	});
});
