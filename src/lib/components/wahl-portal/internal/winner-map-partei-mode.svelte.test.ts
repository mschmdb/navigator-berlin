import { describe, expect, it } from 'vitest';
import { ParteiModeState, rowsMatchAktivePartei } from './winner-map-partei-mode.svelte.js';
import type { WinnerApiRow } from './winner-map-data.js';

function row(overrides: Partial<WinnerApiRow>): WinnerApiRow {
	return {
		jahr: 2023,
		gebiet_slug: 'a',
		partei: 'CDU',
		farbe_hex: '#ignored',
		anteil: 0.3,
		is_repeat_election: false,
		parent_slug: null,
		...overrides
	};
}

describe('ParteiModeState', () => {
	it('startet im Gewinner-Tab (aktivePartei null), ramp/texts sind dann null', () => {
		const state = new ParteiModeState();
		expect(state.aktivePartei).toBeNull();
		expect(state.ramp([row({})])).toBeNull();
		expect(state.texts([row({})], 2023, 143)).toBeNull();
	});

	it('select() wechselt in den Partei-Modus, ramp/texts werden aus den Rows abgeleitet', () => {
		const state = new ParteiModeState();
		state.select('CDU');
		const rows = [row({ anteil: 0.1 }), row({ anteil: 0.5, gebiet_slug: 'b' })];
		expect(state.ramp(rows)).toEqual({ min: 0.1, max: 0.5 });
		const texts = state.texts(rows, 2023, 2);
		expect(texts?.legendeTitel).toBe('Anteil CDU');
		expect(texts?.takeaway).toContain('CDU');
	});

	it('zeigt den Keine-Daten-Hinweis, wenn die Partei-Reihe leer ist', () => {
		const state = new ParteiModeState();
		state.select('BSW');
		const texts = state.texts([], 2016, 143);
		expect(texts?.takeaway).toBe('Für BSW liegen in dieser Wahl-Reihe keine Daten vor.');
	});

	it('Review-Fund #5: zeigt den Keine-Daten-Hinweis auch, wenn die REIHE Daten hat, aber NICHT fürs gewählte Jahr (BSW 2016 bei einer Reihe mit BSW erst ab 2023) -- die Rampe bleibt reihen-weit', () => {
		const state = new ParteiModeState();
		state.select('BSW');
		const rows = [
			row({ jahr: 2023, gebiet_slug: 'a', partei: 'BSW', anteil: 0.1 }),
			row({ jahr: 2023, gebiet_slug: 'b', partei: 'BSW', anteil: 0.3 })
		];
		const texts = state.texts(rows, 2016, 143);
		expect(texts?.takeaway).toBe('Für BSW liegen in dieser Wahl-Reihe keine Daten vor.');
		// Rampe bleibt reihen-weit trotz fehlender Jahres-Daten.
		expect(state.ramp(rows)).toEqual({ min: 0.1, max: 0.3 });
	});

	it('select(null) kehrt zum Gewinner-Tab zurück', () => {
		const state = new ParteiModeState();
		state.select('SPD');
		state.select(null);
		expect(state.aktivePartei).toBeNull();
	});
});

describe('rowsMatchAktivePartei (Review-Fund #7)', () => {
	it('Gewinner-Tab (aktivePartei null) passt IMMER, unabhängig vom Inhalt der Rows', () => {
		expect(rowsMatchAktivePartei([row({ partei: 'SPD' })], null)).toBe(true);
		expect(rowsMatchAktivePartei([], null)).toBe(true);
	});

	it('leere Rows gelten als passend (gültiger "keine Daten"-Zustand für die Partei)', () => {
		expect(rowsMatchAktivePartei([], 'BSW')).toBe(true);
	});

	it('Rows der aktiven Partei passen', () => {
		expect(rowsMatchAktivePartei([row({ partei: 'SPD' })], 'SPD')).toBe(true);
	});

	it('Rows einer ANDEREN Partei (noch nicht aktualisierte Response) passen NICHT', () => {
		expect(rowsMatchAktivePartei([row({ partei: 'CDU' })], 'SPD')).toBe(false);
	});
});
