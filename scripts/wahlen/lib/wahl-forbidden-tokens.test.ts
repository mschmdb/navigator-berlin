import { describe, it, expect } from 'vitest';
import { lintWahlText, WAHL_FORBIDDEN_PATTERNS } from './wahl-forbidden-tokens.js';

describe('lintWahlText', () => {
	it('passes clean text', () => {
		const result = lintWahlText('Die stärkste Partei erreichte 32 Prozent.');
		expect(result.ok).toBe(true);
		expect(result.violations).toEqual([]);
	});

	it('catches Hochburg', () => {
		const result = lintWahlText('Berlin-Mitte ist eine Hochburg der GRÜNEN.');
		expect(result.ok).toBe(false);
		expect(result.violations[0].token).toBe('hochburg');
	});

	it('catches case-insensitive Hochburg + Plural Hochburgen', () => {
		expect(lintWahlText('hochburg').ok).toBe(false);
		expect(lintWahlText('Hochburgen').ok).toBe(false);
	});

	it('catches rote/blaue/grüne/schwarze Bezirke', () => {
		expect(lintWahlText('rote Bezirke dominieren').ok).toBe(false);
		expect(lintWahlText('In blauen Bezirken').ok).toBe(false);
		expect(lintWahlText('grüne Bezirke').ok).toBe(false);
		expect(lintWahlText('schwarze Bezirke').ok).toBe(false);
	});

	it('catches Wahlsieger / Wahlverlierer / Wahlgewinner', () => {
		expect(lintWahlText('SPD ist Wahlsieger').ok).toBe(false);
		expect(lintWahlText('Wahlverlierer FDP').ok).toBe(false);
		expect(lintWahlText('Wahlgewinner steht fest').ok).toBe(false);
	});

	it('catches Stimmkönig + Stimmkaiser', () => {
		expect(lintWahlText('Stimmkönig').ok).toBe(false);
		expect(lintWahlText('Stimmkaiser').ok).toBe(false);
	});

	it('catches Erdrutsch + Erdrutschsieg', () => {
		expect(lintWahlText('Erdrutschsieg').ok).toBe(false);
		expect(lintWahlText('Erdrutschwahl').ok).toBe(false);
	});

	it('catches Wahldebakel + Wahldesaster + Wahlabsturz', () => {
		expect(lintWahlText('Wahldebakel').ok).toBe(false);
		expect(lintWahlText('Wahldesaster').ok).toBe(false);
		expect(lintWahlText('Wahlabsturz').ok).toBe(false);
	});

	it('catches lebenswert (NS-belastet)', () => {
		expect(lintWahlText('lebenswert').ok).toBe(false);
		expect(lintWahlText('lebenswertes Berlin').ok).toBe(false);
	});

	it('catches em-dash', () => {
		expect(lintWahlText('SPD vs CDU — knapper Sieg').ok).toBe(false);
	});

	it('captures line + snippet + hint', () => {
		const result = lintWahlText('zeile 1\nHochburg hier\nzeile 3');
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0].line).toBe(2);
		expect(result.violations[0].snippet).toBe('Hochburg hier');
		expect(result.violations[0].hint).toContain('Stimmenanteil');
	});

	it('collects multiple violations not just first', () => {
		const result = lintWahlText('Hochburg\nWahlsieger\nrote Bezirke');
		expect(result.violations).toHaveLength(3);
		expect(result.violations.map((v) => v.token)).toEqual([
			'hochburg',
			'wahlsieger',
			'rote-bezirke'
		]);
	});

	it('all patterns have non-empty hint', () => {
		for (const p of WAHL_FORBIDDEN_PATTERNS) {
			expect(p.hint.length).toBeGreaterThan(10);
		}
	});

	it('does not match neutral synonyms', () => {
		const clean =
			'Die SPD erreichte 32 Prozent. Stärkste Partei im Kiez. Deutlicher Vorsprung gegenüber 2017.';
		expect(lintWahlText(clean).ok).toBe(true);
	});
});
