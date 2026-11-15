import { describe, expect, it } from 'vitest';
import { latestLeader, partiesOf, seriesFor } from './wahl-summary';
import type { WahlPunkt } from './wahl-types';

const p = (jahr: number, partei: string, anteil: number): WahlPunkt => ({ jahr, partei, farbe: '#000', anteil });
const own = [p(2021, 'SPD', 25), p(2025, 'Linke', 31), p(2025, 'Grüne', 22), p(2021, 'Linke', 14)];
const ref = [p(2025, 'Linke', 20), p(2025, 'CDU', 18)];

describe('partiesOf', () => {
	it('orders parties by share in the latest year, others after', () => {
		expect(partiesOf(own)).toEqual(['Linke', 'Grüne', 'SPD']);
	});
});

describe('seriesFor', () => {
	it('returns the party points sorted by year', () => {
		expect(seriesFor(own, 'Linke').map((x) => x.jahr)).toEqual([2021, 2025]);
	});
});

describe('latestLeader', () => {
	it('names the strongest party of the latest year and the reference share', () => {
		expect(latestLeader(own, ref)).toEqual({ jahr: 2025, partei: 'Linke', anteil: 31, refAnteil: 20 });
	});
	it('gives refAnteil null when the reference lacks the party', () => {
		expect(latestLeader([p(2025, 'Grüne', 30)], ref)?.refAnteil).toBeNull();
	});
	it('returns null without data', () => {
		expect(latestLeader([], ref)).toBeNull();
	});
});
