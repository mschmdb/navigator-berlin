import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../../scripts/lib/oklch-interpolate.js';
import { SMALL_MARK_PX, STORY_FONT, STORY_INK, STORY_PAPER, STORY_SERIES } from './tokens';

const HEX = /^#[0-9a-f]{6}$/i;

describe('story tokens', () => {
	it('nutzt Papier und Tinte als gültige Hex-Farben', () => {
		expect(STORY_PAPER).toMatch(HEX);
		expect(STORY_INK).toMatch(HEX);
	});

	it('erreicht Tinte auf Papier mindestens 7:1', () => {
		expect(contrastRatio(STORY_INK, STORY_PAPER)).toBeGreaterThanOrEqual(7);
	});

	it('setzt Jost vor IBM Plex', () => {
		expect(STORY_FONT).toBe("'Jost', 'IBM Plex Sans', sans-serif");
	});

	it('vereinfacht Zeichen unter 120 px', () => {
		expect(SMALL_MARK_PX).toBe(120);
	});

	for (const [id, series] of Object.entries(STORY_SERIES)) {
		describe(id, () => {
			const entries = Object.entries(series.colors);

			it('hat nur gültige Hex-Farben', () => {
				for (const [, color] of entries) expect(color.hex).toMatch(HEX);
			});

			it('belegt keine Farbe doppelt', () => {
				const hexes = entries.map(([, color]) => color.hex.toLowerCase());
				expect(new Set(hexes).size).toBe(hexes.length);
			});

			it('benennt jede Farbe mit einer Bedeutung', () => {
				for (const [, color] of entries) expect(color.meaning.trim()).not.toBe('');
			});

			it('hat genau zwei verschiedene Linienstärken', () => {
				expect(series.lineWidths).toHaveLength(2);
				expect(series.lineWidths[0]).toBeGreaterThan(0);
				expect(series.lineWidths[1]).toBeGreaterThan(series.lineWidths[0]);
			});
		});
	}

	it('führt die Farben von Punkt, Linie, Kiez', () => {
		const colors = STORY_SERIES['punkt-linie-kiez'].colors;
		expect(colors.kreis).toEqual({ hex: '#3a8a55', meaning: 'Grünversorgung' });
		expect(colors.quadrat).toEqual({ hex: '#cf4128', meaning: 'Altbau' });
		expect(colors.dreieck).toEqual({ hex: '#efbd2c', meaning: 'Lärm' });
		expect(colors.donut).toEqual({ hex: '#24579e', meaning: 'Clubs' });
		expect(colors.balken.hex).toBe(STORY_INK);
	});

	it('führt die Farben der Berliner Signete', () => {
		const colors = STORY_SERIES.signete.colors;
		expect(colors.patina.hex).toBe('#4f7152');
		expect(colors.gold.hex).toBe('#b88a2e');
		expect(colors.ochsenblut.hex).toBe('#5e2b22');
		expect(colors.rot.hex).toBe('#9e2a2b');
		expect(colors.toenung.hex).toBe('#d4c39e');
	});
});
