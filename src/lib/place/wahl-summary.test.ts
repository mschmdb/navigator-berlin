import { describe, expect, it } from 'vitest';
import { partiesOf, seriesFor } from './wahl-summary';
import type { WahlPunkt } from './wahl-types';

const p = (jahr: number, partei: string, anteil: number): WahlPunkt => ({
	jahr,
	partei,
	farbe: '#000',
	anteil
});
const own = [p(2021, 'SPD', 25), p(2025, 'Linke', 31), p(2025, 'Grüne', 22), p(2021, 'Linke', 14)];

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
