import { describe, expect, it } from 'vitest';
import { PARTY_COLORS, colorsInOrder } from './farben';
import { ORDER } from './parteien';

describe('farben', () => {
	it('hat für jede Partei in ORDER eine #rrggbb-Farbe', () => {
		for (const k of ORDER) expect(PARTY_COLORS[k]).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it('folgt der Vorgabe: CDU Anthrazit, Piraten Orange', () => {
		expect(PARTY_COLORS.cdu).toBe('#3b3936');
		expect(PARTY_COLORS.piraten).toBe('#ff820a');
	});

	it('liefert die Farben in ORDER-Reihenfolge, Grau zuletzt', () => {
		const c = colorsInOrder();
		expect(c).toHaveLength(ORDER.length);
		expect(c[0]).toBe(PARTY_COLORS.afd);
		expect(c.at(-1)).toBe(PARTY_COLORS.rest);
	});
});
