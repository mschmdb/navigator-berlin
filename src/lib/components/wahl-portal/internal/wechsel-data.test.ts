import { describe, expect, it } from 'vitest';
import {
	computeWechselFromRows,
	parentJahrFromParentSlug,
	sortWechselEntriesForDisplay,
	wechselCountByGebiet,
	wechselJahreSetByGebiet,
	type WechselEntry
} from './wechsel-data.js';
import type { WinnerApiRow } from './winner-map-data.js';

function row(overrides: Partial<WinnerApiRow>): WinnerApiRow {
	return {
		jahr: 2023,
		gebiet_slug: 'hansaviertel',
		partei: 'SPD',
		farbe_hex: '#000000',
		anteil: 0.4,
		is_repeat_election: false,
		parent_slug: null,
		...overrides
	};
}

describe('parentJahrFromParentSlug', () => {
	it('liest das Jahr aus einem Wahl-Slug', () => {
		expect(parentJahrFromParentSlug('2021-agh-zweitstimme')).toBe(2021);
		expect(parentJahrFromParentSlug('2011-bvv')).toBe(2011);
	});

	it('liefert null ohne Slug oder bei unbekanntem Format', () => {
		expect(parentJahrFromParentSlug(null)).toBeNull();
		expect(parentJahrFromParentSlug('agh-2021')).toBeNull();
	});
});

describe('computeWechselFromRows', () => {
	it('I/O-Matrix Wechsel-Liste: 2016 SPD -> 2021 GRÜNE -> 2023(W) GRÜNE ergibt genau einen Wechsel, kein zusätzlicher Eintrag durch die Wiederholung', () => {
		// Wechsel rechnen auf der effektiven Reihe (Boundary: "2023 ersetzt
		// 2021"): die Wiederholungswahl übernimmt die Jahres-Position ihrer
		// Eltern-Wahl vollständig (identisch zu analytik.ts, siehe Klammer-Test
		// unten) -- der Wechsel SPD->GRÜNE erscheint deshalb am Jahr der
		// Wiederholung (2023), nicht am ersetzten Eltern-Jahr (2021). Zentral
		// für die I/O-Matrix-Zeile ist: genau EIN Wechsel, keine Verdopplung.
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, partei: 'SPD', is_repeat_election: false, parent_slug: null }),
			row({ jahr: 2021, partei: 'GRÜNE', is_repeat_election: false, parent_slug: null }),
			row({
				jahr: 2023,
				partei: 'GRÜNE',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
		];
		const entries = computeWechselFromRows(rows);
		expect(entries).toEqual([
			{ gebietSlug: 'hansaviertel', jahr: 2023, von: 'SPD', nach: 'GRÜNE' }
		]);
	});

	it('Wiederholungswahl mit echtem Parteiwechsel: der Wechsel trägt das Wiederholungs-Jahr, nicht das Eltern-Jahr', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, partei: 'CDU', is_repeat_election: false, parent_slug: null }),
			row({ jahr: 2021, partei: 'CDU', is_repeat_election: false, parent_slug: null }),
			row({
				jahr: 2023,
				partei: 'SPD',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
		];
		const entries = computeWechselFromRows(rows);
		expect(entries).toEqual([{ gebietSlug: 'hansaviertel', jahr: 2023, von: 'CDU', nach: 'SPD' }]);
	});

	it('eine Wiederholung ohne vorherigen Vergleichspunkt kann keinen Wechsel erkennen', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2021, partei: 'CDU', is_repeat_election: false, parent_slug: null }),
			row({
				jahr: 2023,
				partei: 'SPD',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
		];
		expect(computeWechselFromRows(rows)).toEqual([]);
	});

	it('keine Wiederholung, keine Wechsel: leere Liste', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, partei: 'SPD' }),
			row({ jahr: 2021, partei: 'SPD' }),
			row({ jahr: 2023, partei: 'SPD', is_repeat_election: true, parent_slug: '2021-agh-zweitstimme' })
		];
		expect(computeWechselFromRows(rows)).toEqual([]);
	});

	it('Lücken in der Jahres-Reihe (kein Datenpunkt für ein Zwischenjahr) werden übersprungen', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2011, partei: 'CDU', gebiet_slug: 'mitte' }),
			row({ jahr: 2023, partei: 'SPD', gebiet_slug: 'mitte' })
		];
		expect(computeWechselFromRows(rows)).toEqual([
			{ gebietSlug: 'mitte', jahr: 2023, von: 'CDU', nach: 'SPD' }
		]);
	});

	it('mehrere Gebiete bleiben unabhängig voneinander', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, partei: 'SPD', gebiet_slug: 'a' }),
			row({ jahr: 2021, partei: 'CDU', gebiet_slug: 'a' }),
			row({ jahr: 2016, partei: 'GRÜNE', gebiet_slug: 'b' }),
			row({ jahr: 2021, partei: 'GRÜNE', gebiet_slug: 'b' })
		];
		const entries = computeWechselFromRows(rows);
		expect(entries).toEqual([{ gebietSlug: 'a', jahr: 2021, von: 'SPD', nach: 'CDU' }]);
	});

	it('ignoriert Rows ohne Jahr', () => {
		const rows: WinnerApiRow[] = [row({ jahr: null }), row({ jahr: 2023 })];
		expect(computeWechselFromRows(rows)).toEqual([]);
	});
});

describe('wechselJahreSetByGebiet / wechselCountByGebiet', () => {
	it('bildet je Gebiet die Menge der Wechsel-Jahre und die Häufigkeit ab', () => {
		const entries: WechselEntry[] = [
			{ gebietSlug: 'a', jahr: 2021, von: 'SPD', nach: 'CDU' },
			{ gebietSlug: 'a', jahr: 2023, von: 'CDU', nach: 'GRÜNE' },
			{ gebietSlug: 'b', jahr: 2021, von: 'SPD', nach: 'GRÜNE' }
		];
		expect(wechselCountByGebiet(entries)).toEqual(
			new Map([
				['a', 2],
				['b', 1]
			])
		);
	});

	it('wechselJahreSetByGebiet: AGH 2021 aktiv markiert nichts, das Eltern-Jahr verschwindet aus der effektiven Reihe', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, partei: 'SPD' }),
			row({ jahr: 2021, partei: 'GRÜNE' }),
			row({
				jahr: 2023,
				partei: 'GRÜNE',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
		];
		const set = wechselJahreSetByGebiet(rows);
		expect(set.get('hansaviertel')?.has(2021)).toBe(false);
	});

	it('wechselJahreSetByGebiet: eine Wiederholung mit unverändertem Sieger markiert kein Jahr', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2021, partei: 'GRÜNE' }),
			row({
				jahr: 2023,
				partei: 'GRÜNE',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
		];
		const set = wechselJahreSetByGebiet(rows);
		expect(set.get('hansaviertel')).toBeUndefined();
	});
});

describe('sortWechselEntriesForDisplay', () => {
	it('sortiert nach Häufigkeit des Gebiets absteigend, dann alphabetisch, dann chronologisch', () => {
		const entries: WechselEntry[] = [
			{ gebietSlug: 'b', gebietName: 'Bravo', jahr: 2021, von: 'SPD', nach: 'CDU' },
			{ gebietSlug: 'a', gebietName: 'Alpha', jahr: 2023, von: 'CDU', nach: 'GRÜNE' },
			{ gebietSlug: 'a', gebietName: 'Alpha', jahr: 2021, von: 'SPD', nach: 'CDU' },
			{ gebietSlug: 'c', gebietName: 'Charlie', jahr: 2021, von: 'SPD', nach: 'CDU' }
		];
		const counts = new Map([
			['a', 2],
			['b', 1],
			['c', 1]
		]);
		const sorted = sortWechselEntriesForDisplay(entries, counts);
		expect(sorted.map((e) => `${e.gebietSlug}-${e.jahr}`)).toEqual(['a-2021', 'a-2023', 'b-2021', 'c-2021']);
	});
});

// Klammer-Test (Client-Zwilling <-> Server-Semantik `analytik.ts`): liegt in
// `src/lib/server/wahl/wechsel-client-parity.test.ts`, NICHT hier -- ein
// Import von `$lib/server` aus `src/lib/components/**` verletzt die
// Architektur-Boundary (`src/lib/server/db/boundary.test.ts`), auch in Tests.
