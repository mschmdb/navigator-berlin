import { describe, expect, it } from 'vitest';
import { transformSbbRow } from './sbb-row-transformer.js';

const HEADERS = [
	'Adresse',
	'Bezirksnummer',
	'Wahlbezirk',
	'Wahlbezirksart',
	'Wahlberechtigte insgesamt',
	'Wählende',
	'Gültige Stimmen',
	'Ungültige Stimmen',
	'SPD',
	'CDU'
] as const;

function row(overrides: Partial<Record<(typeof HEADERS)[number], string>> = {}) {
	return {
		Adresse: 'Teststr. 1',
		Bezirksnummer: '01',
		Wahlbezirk: '100',
		Wahlbezirksart: 'W',
		'Wahlberechtigte insgesamt': '1000',
		Wählende: '500',
		'Gültige Stimmen': '480',
		'Ungültige Stimmen': '20',
		SPD: '300',
		CDU: '180',
		...overrides
	};
}

describe('transformSbbRow gueltig-Slot je Stimmtyp', () => {
	it('erststimme: gueltig landet im erststimme-Slot', () => {
		const t = transformSbbRow(row(), [...HEADERS], 'erststimme');
		expect(t.gueltig.erststimme).toBe(480);
		expect(t.gueltig.zweitstimme).toBe(0);
		expect(t.votes.erststimme.length).toBeGreaterThan(0);
	});

	it('zweitstimme: gueltig landet im zweitstimme-Slot', () => {
		const t = transformSbbRow(row(), [...HEADERS], 'zweitstimme');
		expect(t.gueltig.zweitstimme).toBe(480);
		expect(t.gueltig.erststimme).toBe(0);
	});

	it('einstimme (BVV): gueltig UND votes landen im erststimme-Slot, aus dem der db-loader liest (BVV-Anteil-Bug: gueltig blieb 0, alle ergebnis.anteil-Werte waren 0)', () => {
		const t = transformSbbRow(row(), [...HEADERS], 'einstimme');
		// db-loader#insertErgebnisse mappt einstimme auf den erststimme-Slot;
		// votes taten das schon immer, gueltig muss denselben Slot fuellen,
		// sonst rechnet anteil = stimmen / 0 -> 0 fuer JEDE BVV-Row.
		expect(t.votes.erststimme.length).toBeGreaterThan(0);
		expect(t.gueltig.erststimme).toBe(480);
		expect(t.ungueltig.erststimme).toBe(20);
	});
});
