import { describe, expect, it } from 'vitest';
import {
	computeUebergaengeFromRows,
	computeWechselFromRows,
	effectiveJahreFromRows,
	parentJahrFromParentSlug,
	parteiAnzahlProJahrFromRows,
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
			row({
				jahr: 2023,
				partei: 'SPD',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
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
		expect(sorted.map((e) => `${e.gebietSlug}-${e.jahr}`)).toEqual([
			'a-2021',
			'a-2023',
			'b-2021',
			'c-2021'
		]);
	});
});

describe('computeUebergaengeFromRows', () => {
	it('I/O-Matrix Sankey-Bündelung: 3 Kieze SPD->GRÜNE, 1 Kiez SPD->SPD ergibt genau ein Band je Paar, nie 4 Einzel-Bänder', () => {
		const rows: WinnerApiRow[] = [
			...['a', 'b', 'c'].map((slug) => row({ jahr: 2016, gebiet_slug: slug, partei: 'SPD' })),
			...['a', 'b', 'c'].map((slug) => row({ jahr: 2021, gebiet_slug: slug, partei: 'GRÜNE' })),
			row({ jahr: 2016, gebiet_slug: 'd', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'd', partei: 'SPD' })
		];
		const uebergaenge = computeUebergaengeFromRows(rows);
		expect(uebergaenge).toHaveLength(2);
		expect(uebergaenge).toContainEqual({
			vonJahr: 2016,
			nachJahr: 2021,
			von: 'SPD',
			nach: 'GRÜNE',
			anzahl: 3
		});
		expect(uebergaenge).toContainEqual({
			vonJahr: 2016,
			nachJahr: 2021,
			von: 'SPD',
			nach: 'SPD',
			anzahl: 1
		});
	});

	it('I/O-Matrix Sankey AGH Kiez: Wiederholungswahl 2023 ersetzt 2021, kein eigener Übergang 2021->2023', () => {
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
		const uebergaenge = computeUebergaengeFromRows(rows);
		expect(uebergaenge).toEqual([
			{ vonJahr: 2016, nachJahr: 2023, von: 'SPD', nach: 'GRÜNE', anzahl: 1 }
		]);
	});

	it('Coverage-Grenze: ein Gebiet ohne früheres Jahr trägt keinen Übergang für die fehlende Spanne bei', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'a', partei: 'SPD' }),
			// Gebiet 'b' hat erst ab 2021 Daten (BVV-Kiez-Coverage-Grenze).
			row({ jahr: 2021, gebiet_slug: 'b', partei: 'CDU' })
		];
		const uebergaenge = computeUebergaengeFromRows(rows);
		expect(uebergaenge).toEqual([
			{ vonJahr: 2016, nachJahr: 2021, von: 'SPD', nach: 'SPD', anzahl: 1 }
		]);
	});

	it('ignoriert Rows ohne Jahr und liefert eine leere Liste ohne mind. zwei effektive Punkte', () => {
		const rows: WinnerApiRow[] = [row({ jahr: null }), row({ jahr: 2023 })];
		expect(computeUebergaengeFromRows(rows)).toEqual([]);
	});
});

describe('effectiveJahreFromRows', () => {
	it('Sankey AGH Kiez: liefert Spalten 2016, 2023(·W); 2021 erscheint nicht als eigene Spalte', () => {
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
		expect(effectiveJahreFromRows(rows)).toEqual([
			{ jahr: 2016, istWiederholung: false },
			{ jahr: 2023, istWiederholung: true }
		]);
	});

	it('Coverage-Grenze: vereinigt Spalten über Gebiete mit unterschiedlicher Datenhistorie', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'b', partei: 'CDU' })
		];
		expect(effectiveJahreFromRows(rows)).toEqual([
			{ jahr: 2016, istWiederholung: false },
			{ jahr: 2021, istWiederholung: false }
		]);
	});

	it('Teil-Coverage: 2021 verschwindet global, auch wenn EINEM Gebiet die Wiederholungs-Row fehlt', () => {
		// Gebiet 'a' hat die volle Wiederholungs-Row (2023 ersetzt 2021).
		// Gebiet 'b' hat KEINE 2023-Row -- sein 2021-Punkt bliebe ohne den
		// globalen Eltern-Jahr-Filter fälschlich eine eigene Spalte.
		const rows: WinnerApiRow[] = [
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2021, gebiet_slug: 'a', partei: 'GRÜNE' }),
			row({
				jahr: 2023,
				gebiet_slug: 'a',
				partei: 'GRÜNE',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			}),
			row({ jahr: 2016, gebiet_slug: 'b', partei: 'CDU' }),
			row({ jahr: 2021, gebiet_slug: 'b', partei: 'CDU' })
		];
		expect(effectiveJahreFromRows(rows)).toEqual([
			{ jahr: 2016, istWiederholung: false },
			{ jahr: 2023, istWiederholung: true }
		]);
	});
});

describe('parteiAnzahlProJahrFromRows', () => {
	it('zählt Gebiete je effektivem Jahr x Partei aus denselben effektiven Reihen wie die Übergänge', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2011, gebiet_slug: 'a', partei: 'CDU' }),
			row({ jahr: 2016, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2023, gebiet_slug: 'a', partei: 'SPD' }),
			row({ jahr: 2016, gebiet_slug: 'b', partei: 'SPD' }),
			row({ jahr: 2023, gebiet_slug: 'b', partei: 'GRÜNE' })
		];
		const counts = parteiAnzahlProJahrFromRows(rows);
		expect(counts.get(2011)).toEqual(new Map([['CDU', 1]]));
		expect(counts.get(2016)).toEqual(new Map([['SPD', 2]]));
		expect(counts.get(2023)).toEqual(
			new Map([
				['SPD', 1],
				['GRÜNE', 1]
			])
		);
	});

	it('Wiederholungswahl ersetzt ihr Eltern-Jahr auch in der Zählung', () => {
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
		const counts = parteiAnzahlProJahrFromRows(rows);
		expect(counts.has(2021)).toBe(false);
		expect(counts.get(2023)).toEqual(new Map([['GRÜNE', 1]]));
	});
});

// Klammer-Test (Client-Zwilling <-> Server-Semantik `analytik.ts`): liegt in
// `src/lib/server/wahl/wechsel-client-parity.test.ts`, NICHT hier -- ein
// Import von `$lib/server` aus `src/lib/components/**` verletzt die
// Architektur-Boundary (`src/lib/server/db/boundary.test.ts`), auch in Tests.
