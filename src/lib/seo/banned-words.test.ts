import { describe, it, expect } from 'vitest';
import { BANNED_WORDS, lintForBannedWords } from './banned-words.js';

describe('BANNED_WORDS list', () => {
	it('includes "lebenswert" lemma per memory feedback_no_lebenswert', () => {
		expect(BANNED_WORDS).toContain('lebenswert');
	});

	it('includes the related family "lebensqualität"', () => {
		expect(BANNED_WORDS).toContain('lebensqualität');
	});

	it('is a non-empty readonly list of lowercase lemmas', () => {
		expect(BANNED_WORDS.length).toBeGreaterThan(0);
		for (const word of BANNED_WORDS) {
			expect(word).toBe(word.toLowerCase());
		}
	});
});

describe('lintForBannedWords', () => {
	it('reports no hits for clean text', () => {
		const result = lintForBannedWords('Berlin hat 12 Bezirke und viele Kieze.');
		expect(result.hits).toEqual([]);
		expect(result.cleaned).toBe('Berlin hat 12 Bezirke und viele Kieze.');
	});

	it('detects the lemma "lebenswert" case-insensitive', () => {
		const result = lintForBannedWords('Ein besonders lebenswerter Kiez im Norden.');
		expect(result.hits).toContain('lebenswert');
	});

	it('detects "Lebensqualität" mid-sentence', () => {
		const result = lintForBannedWords('Die Lebensqualität ist hoch in Mitte.');
		expect(result.hits).toContain('lebensqualität');
	});

	it('catches German declensions (lebenswerten, lebenswerteste)', () => {
		const result = lintForBannedWords('Der lebenswerteste Bezirk Berlins.');
		expect(result.hits).toContain('lebenswert');
	});

	it('returns cleaned text with banned terms replaced by [REDAKTIONSFEHLER]', () => {
		const result = lintForBannedWords('Ein lebenswerter Kiez.');
		expect(result.cleaned).not.toMatch(/lebenswert/i);
		expect(result.cleaned).toContain('[REDAKTIONSFEHLER]');
	});

	it('reports each unique banned lemma only once even on multiple matches', () => {
		const result = lintForBannedWords('lebenswert lebenswerter lebenswerteste');
		const counts = result.hits.filter((h) => h === 'lebenswert').length;
		expect(counts).toBe(1);
	});

	it('does not match substrings that only resemble a banned word', () => {
		const result = lintForBannedWords('Die Lebensmittel sind teuer.');
		expect(result.hits).toEqual([]);
	});
});
