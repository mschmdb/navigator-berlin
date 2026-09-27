import { describe, it, expect } from 'vitest';
import { SCORE_DIMENSION_KEYS } from './comparison-types.js';

// i18n Block B4a Review-Fund: `SCORE_DIMENSION_KEYS` ersetzt eine vormals
// 3x duplizierte field→key-Zuordnung (kiez/bezirk `+page.server.ts`,
// `kiez-hero.svelte`). Pin auf die konkreten Paare, damit ein Tippfehler in
// der camelCase↔hyphen-Übersetzung (z. B. beim Umbenennen eines DB-Feldes)
// sofort auffällt.
describe('SCORE_DIMENSION_KEYS', () => {
	it('enthält alle 7 Dimensionen genau einmal', () => {
		expect(SCORE_DIMENSION_KEYS).toHaveLength(7);
	});

	it('pinnt field -> key für ruheLuft/gruenHitze (Bindestrich-Umlaut-Fälle)', () => {
		expect(SCORE_DIMENSION_KEYS.find((d) => d.field === 'ruheLuft')?.key).toBe('ruhe-luft');
		expect(SCORE_DIMENSION_KEYS.find((d) => d.field === 'gruenHitze')?.key).toBe('gruen-hitze');
	});

	it('pinnt field -> key für die übrigen 5 Dimensionen', () => {
		const asMap = Object.fromEntries(SCORE_DIMENSION_KEYS.map((d) => [d.field, d.key]));
		expect(asMap).toEqual({
			ruheLuft: 'ruhe-luft',
			gruenHitze: 'gruen-hitze',
			mobilitaet: 'mobilitaet',
			versorgung: 'versorgung',
			wohnschutz: 'wohnschutz',
			kultur: 'kultur',
			kriminalitaet: 'kriminalitaet'
		});
	});
});
