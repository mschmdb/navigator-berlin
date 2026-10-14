import { describe, expect, it } from 'vitest';
import { pickKiezStrength } from './kiez-strength.js';
import type { ComparisonDimRow } from './comparison-types.js';

function row(partial: Partial<ComparisonDimRow> & Pick<ComparisonDimRow, 'key'>): ComparisonDimRow {
	return {
		value: 50,
		berlinMedian: 50,
		rang: null,
		quartil: null,
		total: 143,
		...partial
	};
}

describe('pickKiezStrength', () => {
	it('liefert null bei leerer Liste', () => {
		expect(pickKiezStrength([])).toBeNull();
	});

	it('liefert die Dimension mit dem besten Rang im oberen Viertel', () => {
		const result = pickKiezStrength([
			row({ key: 'ruhe-luft', rang: 30, quartil: 1 }),
			row({ key: 'gruen-hitze', rang: 12, quartil: 1 }),
			row({ key: 'mobilitaet', rang: 20, quartil: 1 })
		]);
		expect(result).toEqual({ key: 'gruen-hitze', rang: 12, total: 143 });
	});

	it('liefert null, wenn keine Dimension im oberen Viertel liegt', () => {
		expect(
			pickKiezStrength([
				row({ key: 'ruhe-luft', rang: 50, quartil: 2 }),
				row({ key: 'gruen-hitze', rang: 140, quartil: 4 })
			])
		).toBeNull();
	});

	it('wählt bei Gleichstand die erste Dimension der Eingabe-Reihenfolge', () => {
		const result = pickKiezStrength([
			row({ key: 'mobilitaet', rang: 5, quartil: 1 }),
			row({ key: 'versorgung', rang: 5, quartil: 1 })
		]);
		expect(result?.key).toBe('mobilitaet');
	});

	it('überspringt Zeilen ohne Rang oder ohne Gesamtzahl', () => {
		const result = pickKiezStrength([
			row({ key: 'wohnschutz', rang: null, quartil: null }),
			row({ key: 'versorgung', rang: 1, quartil: 1, total: 0 }),
			row({ key: 'mobilitaet', rang: 9, quartil: 1 })
		]);
		expect(result?.key).toBe('mobilitaet');
	});

	it('wertet Kultur nicht als Stärke (nicht im Kiez-Score)', () => {
		expect(pickKiezStrength([row({ key: 'kultur', rang: 1, quartil: 1 })])).toBeNull();
	});

	it('wertet die Kontext-Dimension Kriminalität nie als Stärke', () => {
		expect(pickKiezStrength([row({ key: 'kriminalitaet', rang: 1, quartil: 1 })])).toBeNull();
	});
});
