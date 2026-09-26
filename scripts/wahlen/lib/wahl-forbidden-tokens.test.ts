import { describe, it, expect } from 'vitest';
import {
	lintWahlText,
	WAHL_FORBIDDEN_PATTERNS,
	WAHL_FORBIDDEN_PATTERNS_EN
} from './wahl-forbidden-tokens.js';

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

describe('lintWahlText mit WAHL_FORBIDDEN_PATTERNS_EN (i18n Block B, nur messages/en.json)', () => {
	it('passes clean EN text', () => {
		const result = lintWahlText(
			'The strongest party reached 32 percent.',
			WAHL_FORBIDDEN_PATTERNS_EN
		);
		expect(result.ok).toBe(true);
	});

	it('catches stronghold (singular + plural)', () => {
		expect(lintWahlText('a Green stronghold', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
		expect(lintWahlText('traditional strongholds', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
	});

	it('catches colour-coded districts', () => {
		expect(lintWahlText('red districts dominate', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
		expect(lintWahlText('in green districts', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
	});

	it('catches election winner/loser', () => {
		expect(lintWahlText('SPD is the election winner', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
		expect(lintWahlText('the election loser', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
	});

	it('catches vote king', () => {
		expect(lintWahlText('the vote king', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
	});

	it('catches landslide', () => {
		expect(lintWahlText('a landslide victory', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
		expect(lintWahlText('landslide', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
	});

	it('catches election debacle/disaster/collapse', () => {
		expect(lintWahlText('an election debacle', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
		expect(lintWahlText('election disaster', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
	});

	it('catches em-dash', () => {
		expect(lintWahlText('SPD vs CDU — close win', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(false);
	});

	it('does not apply DE-only patterns like hochburg to EN text', () => {
		// "hochburg" ist kein WAHL_FORBIDDEN_PATTERNS_EN-Eintrag; EN-Scan
		// nutzt ausschließlich die EN-Musterliste.
		expect(lintWahlText('Hochburg', WAHL_FORBIDDEN_PATTERNS_EN).ok).toBe(true);
	});

	it('all EN patterns have non-empty hint', () => {
		for (const p of WAHL_FORBIDDEN_PATTERNS_EN) {
			expect(p.hint.length).toBeGreaterThan(10);
		}
	});

	// Matrix-Zeile "Lint" (spec-i18n-b-wahlportal.md): "EN-Text stronghold ->
	// lint:wahl meldet Verstoß". Simuliert ein `messages/en.json`-Fragment mit
	// einem verbotenen Wort, wie es `lint-wahl-editorial.ts` real scannt
	// (JSON-Text, nicht Fließtext) -- belegt, dass ein Verstoß in echtem
	// en.json-JSON von der EN-Musterliste gefunden würde.
	it('findet einen Verstoß in einem en.json-artigen JSON-Ausschnitt (nicht nur in Fließtext)', () => {
		const enJsonExcerpt = [
			'{',
			'\t"$schema": "https://inlang.com/schema/inlang-message-format",',
			'\t"wahl_portal_beispiel": "SPD remains a stronghold in this district."',
			'}'
		].join('\n');
		const result = lintWahlText(enJsonExcerpt, WAHL_FORBIDDEN_PATTERNS_EN);
		expect(result.ok).toBe(false);
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0].token).toBe('stronghold');
		expect(result.violations[0].line).toBe(3);
	});
});
