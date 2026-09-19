import { describe, expect, it } from 'vitest';
import { computeWechsel, type SeriesEntry } from './analytik.js';
import {
	computeWechselFromRows,
	parentJahrFromParentSlug
} from '$lib/components/wahl-portal/internal/wechsel-data.js';
import type { WinnerApiRow } from '$lib/components/wahl-portal/internal/winner-map-data.js';

/**
 * Klammer-Test (Finder-Muster; Story 7 Boundary "Client-Zwilling ... per
 * Fixture-Test an die Server-Semantik geklammert"): der Client-Zwilling der
 * Wiederholungswahl-Merge-Regel (`wechsel-data.ts`, kein `$lib/server`-Import
 * dort erlaubt, siehe `boundary.test.ts`) muss auf demselben Fixture
 * dieselben Wechsel-Jahre liefern wie der Server-Rechenkern (`analytik.ts`).
 * Deshalb liegt dieser Vergleich hier (Server-Test importiert Client-Modul,
 * die verbotene Richtung ist nur Client -> Server) statt im Komponenten-Baum.
 */
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

describe('Klammer-Test: Client-Zwilling (wechsel-data.ts) <-> Server-Semantik (analytik.ts)', () => {
	it('liefert dieselben Wechsel-Jahre wie computeWechsel für eine Legislatur-Reihe mit Wiederholungswahl', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2011, partei: 'CDU' }),
			row({ jahr: 2016, partei: 'SPD' }),
			row({ jahr: 2021, partei: 'GRÜNE' }),
			row({
				jahr: 2023,
				partei: 'GRÜNE',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
		];
		const clientJahre = computeWechselFromRows(rows).map((e) => e.jahr);

		const seriesPoints: SeriesEntry[] = rows.map((r) => ({
			jahr: r.jahr as number,
			isRepeatElection: r.is_repeat_election,
			parentJahr: parentJahrFromParentSlug(r.parent_slug),
			shares: new Map([[r.partei, r.anteil]])
		}));
		const serverJahre = computeWechsel(seriesPoints).wechselJahre;

		expect(clientJahre).toEqual(serverJahre);
	});

	it('klammert auch den Wiederholungswahl-Fall ohne Parteiwechsel (2021 nie als Wechsel)', () => {
		const rows: WinnerApiRow[] = [
			row({ jahr: 2021, partei: 'SPD' }),
			row({
				jahr: 2023,
				partei: 'SPD',
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			})
		];
		const clientJahre = computeWechselFromRows(rows).map((e) => e.jahr);
		const seriesPoints: SeriesEntry[] = rows.map((r) => ({
			jahr: r.jahr as number,
			isRepeatElection: r.is_repeat_election,
			parentJahr: parentJahrFromParentSlug(r.parent_slug),
			shares: new Map([[r.partei, r.anteil]])
		}));
		const serverJahre = computeWechsel(seriesPoints).wechselJahre;
		expect(clientJahre).toEqual([]);
		expect(serverJahre).toEqual([]);
	});
});
