import { describe, expect, it } from 'vitest';
import { colorsInOrder, legendNames, PARTY_COLORS, PARTY_NAMES } from './palette';
import { ORDER } from './parteien';

describe('palette', () => {
	it('eine Farbe je Partei in ORDER, Hex-Werte', () => {
		const c = colorsInOrder();
		expect(c).toHaveLength(ORDER.length);
		for (const hex of c) expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it('CDU Anthrazit und Piraten Orange nach regeln.md', () => {
		expect(PARTY_COLORS.cdu).toBe('#3b3936');
		expect(PARTY_COLORS.piraten).toBe('#FF820A');
		expect(colorsInOrder()[ORDER.indexOf('cdu')]).toBe('#3b3936');
	});

	it('Namen für Grau-Caption in beiden Sprachen vollständig', () => {
		for (const lang of ['de', 'en'] as const) {
			const n = PARTY_NAMES[lang];
			for (const k of [...ORDER.filter((k) => k !== 'rest'), 'fw', 'tier'] as const)
				expect(n[k].length).toBeGreaterThan(0);
		}
		expect(PARTY_NAMES.de.gruene).toBe('Grüne');
		expect(PARTY_NAMES.en.gruene).toBe('Greens');
	});

	it('Legende nennt Grau mit Schwelle oder als Sonstige', () => {
		expect(legendNames('de', 0.05).at(-1)).toBe('Grau: alle Parteien unter 5 %');
		expect(legendNames('en', 0.05).at(-1)).toBe('Grey: all parties below 5%');
		expect(legendNames('de', 0).at(-1)).toBe('Grau: Sonstige');
		expect(legendNames('de', 0.05)).toHaveLength(ORDER.length);
		expect(legendNames('de', 0.05)[0]).toBe('AfD');
	});
});
