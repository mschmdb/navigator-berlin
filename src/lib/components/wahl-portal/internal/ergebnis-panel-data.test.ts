import { describe, expect, it } from 'vitest';
import { buildErgebnisPanelRows, type ErgebnisSeriesPoint } from './ergebnis-panel-data.js';

// Fixture-Reihe (AGH Zweitstimme, Berlin gesamt): 2016 (erste Wahl der
// Fixture-Reihe), 2021, 2023 (Wiederholungswahl von 2021). Anteile bewusst
// mit bekannten Deltas gewählt: CDU 2021->2023 +10,2 Pp., SPD -2,9 Pp.
const POINTS: ErgebnisSeriesPoint[] = [
	// 2016
	{
		jahr: 2016,
		partei: 'SPD',
		farbe_hex: '#A50C1A',
		anteil: 0.215,
		stimmen: 100,
		is_repeat_election: false,
		parent_slug: null
	},
	{
		jahr: 2016,
		partei: 'CDU',
		farbe_hex: '#1A1A1A',
		anteil: 0.18,
		stimmen: 90,
		is_repeat_election: false,
		parent_slug: null
	},
	// 2021
	{
		jahr: 2021,
		partei: 'SPD',
		farbe_hex: '#A50C1A',
		anteil: 0.213,
		stimmen: 110,
		is_repeat_election: false,
		parent_slug: null
	},
	{
		jahr: 2021,
		partei: 'CDU',
		farbe_hex: '#1A1A1A',
		anteil: 0.18,
		stimmen: 95,
		is_repeat_election: false,
		parent_slug: null
	},
	{
		jahr: 2021,
		partei: 'GRÜNE',
		farbe_hex: '#0F6E2C',
		anteil: 0.189,
		stimmen: 100,
		is_repeat_election: false,
		parent_slug: null
	},
	// 2023 (Wiederholungswahl von 2021)
	{
		jahr: 2023,
		partei: 'SPD',
		farbe_hex: '#A50C1A',
		anteil: 0.184,
		stimmen: 105,
		is_repeat_election: true,
		parent_slug: '2021-agh-zweitstimme'
	},
	{
		jahr: 2023,
		partei: 'CDU',
		farbe_hex: '#1A1A1A',
		anteil: 0.282,
		stimmen: 160,
		is_repeat_election: true,
		parent_slug: '2021-agh-zweitstimme'
	},
	{
		jahr: 2023,
		partei: 'GRÜNE',
		farbe_hex: '#0F6E2C',
		anteil: 0.189,
		stimmen: 108,
		is_repeat_election: true,
		parent_slug: '2021-agh-zweitstimme'
	},
	{
		jahr: 2023,
		partei: 'Sonstige',
		farbe_hex: '#525252',
		anteil: 0.05,
		stimmen: 30,
		is_repeat_election: true,
		parent_slug: '2021-agh-zweitstimme'
	}
];

describe('buildErgebnisPanelRows', () => {
	it('sortiert nach Anteil absteigend, Sonstige immer ans Ende', () => {
		const { rows } = buildErgebnisPanelRows(POINTS, 2023);
		expect(rows.map((r) => r.partei)).toEqual(['CDU', 'GRÜNE', 'SPD', 'Sonstige']);
		expect(rows.map((r) => r.rang)).toEqual([1, 2, 3, 4]);
	});

	it('löst Gleichstand alphabetisch auf (Haus-Regel)', () => {
		// GRÜNE und SPD liegen 2021 gleichauf bei Betrachtung mit CDU-Führung;
		// echte Gleichstand-Probe: zwei Parteien mit identischem Anteil im Jahr 2021.
		const tie: ErgebnisSeriesPoint[] = [
			{
				jahr: 2021,
				partei: 'SPD',
				farbe_hex: '#A50C1A',
				anteil: 0.2,
				stimmen: 10,
				is_repeat_election: false,
				parent_slug: null
			},
			{
				jahr: 2021,
				partei: 'CDU',
				farbe_hex: '#1A1A1A',
				anteil: 0.2,
				stimmen: 10,
				is_repeat_election: false,
				parent_slug: null
			}
		];
		const { rows } = buildErgebnisPanelRows(tie, 2021);
		expect(rows.map((r) => r.partei)).toEqual(['CDU', 'SPD']);
	});

	it('berechnet Deltas zur unmittelbar vorherigen Wahl der Reihe (AGH 2023 vs. 2021)', () => {
		const { rows, vorjahr } = buildErgebnisPanelRows(POINTS, 2023);
		expect(vorjahr).toBe(2021);
		const cdu = rows.find((r) => r.partei === 'CDU');
		const spd = rows.find((r) => r.partei === 'SPD');
		expect(cdu?.deltaPp).toBeCloseTo(10.2, 5);
		expect(cdu?.deltaLabel).toBe('+10,2 Pp.');
		expect(spd?.deltaPp).toBeCloseTo(-2.9, 5);
		expect(spd?.deltaLabel).toBe('−2,9 Pp.');
	});

	it('erste Wahl der Reihe hat kein Vorjahr und keine Delta-Badges', () => {
		const { rows, vorjahr } = buildErgebnisPanelRows(POINTS, 2016);
		expect(vorjahr).toBeNull();
		expect(rows.every((r) => r.deltaPp === null && r.deltaLabel === null)).toBe(true);
	});

	it('Partei ohne Vorjahres-Row bekommt kein Delta (keine erfundene 0-Basis)', () => {
		const withNewParty: ErgebnisSeriesPoint[] = [
			...POINTS,
			{
				jahr: 2023,
				partei: 'BSW',
				farbe_hex: '#4A1559',
				anteil: 0.03,
				stimmen: 20,
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			}
		];
		const { rows } = buildErgebnisPanelRows(withNewParty, 2023);
		const bsw = rows.find((r) => r.partei === 'BSW');
		expect(bsw?.deltaPp).toBeNull();
		expect(bsw?.deltaLabel).toBeNull();
	});

	it('formatiert Anteil mit einer Dezimalstelle, de-DE-Komma', () => {
		const { rows } = buildErgebnisPanelRows(POINTS, 2023);
		const cdu = rows.find((r) => r.partei === 'CDU');
		expect(cdu?.anteilLabel).toBe('28,2 %');
	});

	it('liefert leere Rows für ein Jahr ohne Punkte', () => {
		const { rows, vorjahr } = buildErgebnisPanelRows(POINTS, 1999);
		expect(rows).toEqual([]);
		expect(vorjahr).toBeNull();
	});
});
