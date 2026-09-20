import { describe, expect, it } from 'vitest';
import {
	buildPartyMiniMap,
	buildSmallMultiplesTableRow,
	computeExtremes,
	type KiezPathCell
} from './small-multiples-data.js';
import { parteiAnteilSpanne } from './winner-map-expressions.js';
import { parteiColor } from '$lib/data/partei-farben.js';
import { NEUTRAL_FARBE, NEUTRAL_OPACITY, type WinnerApiRow } from './winner-map-data.js';

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

const CELLS: KiezPathCell[] = [
	{ slug: 'alpha', name: 'Alpha', path: 'M0,0Z' },
	{ slug: 'beta', name: 'Beta', path: 'M1,1Z' },
	{ slug: 'gamma', name: 'Gamma', path: 'M2,2Z' }
];

describe('computeExtremes', () => {
	it('findet stärksten und schwächsten Eintrag', () => {
		const { staerkste, schwaechste } = computeExtremes([
			{ slug: 'a', name: 'Alpha', anteil: 0.3 },
			{ slug: 'b', name: 'Beta', anteil: 0.5 },
			{ slug: 'c', name: 'Gamma', anteil: 0.1 }
		]);
		expect(staerkste).toEqual({ slug: 'b', name: 'Beta', anteil: 0.5 });
		expect(schwaechste).toEqual({ slug: 'c', name: 'Gamma', anteil: 0.1 });
	});

	it('löst Gleichstand alphabetisch auf (de) -- für stärkste UND schwächste', () => {
		const { staerkste, schwaechste } = computeExtremes([
			{ slug: 'z', name: 'Zeta', anteil: 0.5 },
			{ slug: 'a', name: 'Alpha', anteil: 0.5 }
		]);
		expect(staerkste?.name).toBe('Alpha');
		expect(schwaechste?.name).toBe('Alpha');
	});

	it('liefert null/null für eine leere Liste, kein Crash', () => {
		expect(computeExtremes([])).toEqual({ staerkste: null, schwaechste: null });
	});
});

describe('buildPartyMiniMap', () => {
	it('backt Farbe/Opacity/Extrem-Flags aus den Rows', () => {
		const rows = [
			row({ gebiet_slug: 'alpha', anteil: 0.1 }),
			row({ gebiet_slug: 'beta', anteil: 0.5 }),
			row({ gebiet_slug: 'gamma', anteil: 0.3 })
		];
		const mini = buildPartyMiniMap('CDU', CELLS, rows, parteiAnteilSpanne(rows));
		expect(mini.hasData).toBe(true);
		expect(mini.farbe).toBe(parteiColor('CDU'));
		expect(mini.staerkste).toEqual({ slug: 'beta', name: 'Beta', anteil: 0.5 });
		expect(mini.schwaechste).toEqual({ slug: 'alpha', name: 'Alpha', anteil: 0.1 });
		const betaCell = mini.cells.find((c) => c.slug === 'beta');
		expect(betaCell?.isStaerkste).toBe(true);
		expect(betaCell?.farbe).toBe(parteiColor('CDU'));
		const alphaCell = mini.cells.find((c) => c.slug === 'alpha');
		expect(alphaCell?.isSchwaechste).toBe(true);
	});

	it('Gebiete ohne Match bleiben neutral (has kein anteil), Karte crasht nicht', () => {
		const rows = [row({ gebiet_slug: 'alpha', anteil: 0.2 })];
		const mini = buildPartyMiniMap('CDU', CELLS, rows, parteiAnteilSpanne(rows));
		const beta = mini.cells.find((c) => c.slug === 'beta');
		expect(beta?.anteil).toBeNull();
		expect(beta?.farbe).toBe(NEUTRAL_FARBE);
		expect(beta?.opacity).toBe(NEUTRAL_OPACITY);
	});

	it('Partei ohne Daten (leere Rows, z.B. BSW vor 2023): neutraler Zustand statt Crash', () => {
		const mini = buildPartyMiniMap('BSW', CELLS, [], { min: 0, max: 1 });
		expect(mini.hasData).toBe(false);
		expect(mini.staerkste).toBeNull();
		expect(mini.schwaechste).toBeNull();
		expect(mini.cells).toHaveLength(3);
		expect(mini.cells.every((c) => c.anteil === null && c.farbe === NEUTRAL_FARBE)).toBe(true);
	});

	it('Review-Fund #3/#20: nutzt die übergebene REIHEN-weite Spanne für die Opacity, nicht die Jahres-Spanne der Rows', () => {
		// Reihen-weite Spanne (z. B. über mehrere Jahre) ist breiter als die
		// Jahres-Rows dieser Mini-Karte -- die Opacity muss die REIHEN-Spanne
		// widerspiegeln, sonst wären Karte und Mini nicht deckungsgleich.
		const rowsForJahr = [
			row({ gebiet_slug: 'alpha', anteil: 0.2 }),
			row({ gebiet_slug: 'beta', anteil: 0.2 })
		];
		const reihenSpanne = { min: 0.1, max: 0.5 };
		const mini = buildPartyMiniMap('CDU', CELLS, rowsForJahr, reihenSpanne);
		const alphaCell = mini.cells.find((c) => c.slug === 'alpha');
		// Anteil 0,2 liegt bei einer 0,1-0,5-Spanne klar unter der Mitte --
		// mit der (falschen) Jahres-Spanne {min:0.2,max:0.2} wäre die Opacity
		// stattdessen die maximale (konstante Rows -> min===max-Fallback).
		expect(alphaCell?.opacity).toBeLessThan(0.9);
	});

	it('Mini-Zellen-Opacity: stärkste Zelle erreicht die maxOpacity der Spanne, schwächere Zellen bleiben klar darunter (Review-Fund #20)', () => {
		const rows = [
			row({ gebiet_slug: 'alpha', anteil: 0.1 }),
			row({ gebiet_slug: 'beta', anteil: 0.5 }),
			row({ gebiet_slug: 'gamma', anteil: 0.3 })
		];
		const spanne = parteiAnteilSpanne(rows);
		const mini = buildPartyMiniMap('CDU', CELLS, rows, spanne);
		const alphaCell = mini.cells.find((c) => c.slug === 'alpha');
		const betaCell = mini.cells.find((c) => c.slug === 'beta');
		const gammaCell = mini.cells.find((c) => c.slug === 'gamma');
		expect(betaCell?.opacity).toBeCloseTo(0.9, 5);
		expect(alphaCell?.opacity).toBeLessThan(gammaCell!.opacity);
		expect(gammaCell?.opacity).toBeLessThan(betaCell!.opacity);
	});
});

describe('buildSmallMultiplesTableRow', () => {
	it('nennt Partei, stärksten/schwächsten Kiez mit Anteil', () => {
		const rows = [
			row({ gebiet_slug: 'alpha', anteil: 0.1 }),
			row({ gebiet_slug: 'beta', anteil: 0.5 })
		];
		const mini = buildPartyMiniMap('CDU', CELLS, rows, parteiAnteilSpanne(rows));
		const tableRow = buildSmallMultiplesTableRow(mini);
		expect(tableRow).toEqual({
			partei: 'CDU',
			staerksterKiez: 'Beta',
			staerksterAnteil: 0.5,
			schwaechsterKiez: 'Alpha',
			schwaechsterAnteil: 0.1
		});
	});

	it('nennt "Keine Daten" ohne Partei-Daten', () => {
		const mini = buildPartyMiniMap('BSW', CELLS, [], { min: 0, max: 1 });
		const tableRow = buildSmallMultiplesTableRow(mini);
		expect(tableRow.staerksterKiez).toBe('Keine Daten');
		expect(tableRow.staerksterAnteil).toBeNull();
	});
});
