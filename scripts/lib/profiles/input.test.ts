import { describe, it, expect } from 'vitest';
import { hashInput, collectNumbers, type ProfileInput } from './input.js';

const BASE: ProfileInput = {
	pageType: 'kiez',
	slug: 'test',
	name: 'Test',
	bezirk: 'Mitte',
	einwohner: 12000,
	flaecheHa: 80,
	composite: { score: 55, rang: 70, total: 143 },
	dims: [
		{ label: 'Grün & Hitze', score: 72, rang: 12, total: 143, bezirkMean: 65, berlinMedian: 58 }
	],
	facts: { gruenanlagen: 75, dominantWohnlage: 'mittel' }
};

describe('hashInput', () => {
	it('ist deterministisch', () => {
		expect(hashInput(BASE)).toBe(hashInput({ ...BASE }));
	});
	it('ändert sich bei geänderten Daten', () => {
		expect(hashInput(BASE)).not.toBe(hashInput({ ...BASE, einwohner: 12001 }));
	});
});

describe('collectNumbers', () => {
	it('sammelt alle Zahlen rekursiv, dedupliziert, gerundet', () => {
		const nums = collectNumbers(BASE);
		expect(nums).toContain(72);
		expect(nums).toContain(12000);
		expect(nums).toContain(75);
		expect(nums).toContain(58);
		// dedupe: total 143 nur einmal
		expect(nums.filter((n) => n === 143)).toHaveLength(1);
	});
	it('extrahiert Ziffern aus Strings (z. B. LOR-Namen), ignoriert Wörter', () => {
		const withNameDigit = { ...BASE, name: 'West 1 Tegel' };
		expect(collectNumbers(withNameDigit)).toContain(1);
		// reine Wörter ohne Ziffer liefern nichts
		expect(collectNumbers(BASE)).not.toContain(NaN);
	});
});
