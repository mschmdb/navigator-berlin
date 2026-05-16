import { describe, it, expect } from 'vitest';
import { compareKiezePrompt } from './compare-kieze.js';

describe('compare-kieze prompt', () => {
	it('hat snake_case-name', () => {
		expect(compareKiezePrompt.name).toBe('compare_kieze');
	});

	it('rendert DE mit beiden Slugs', () => {
		const out = compareKiezePrompt.render({ slug_a: 'kreuzberg-nord', slug_b: 'wedding-zentrum' }, 'de');
		expect(out).toContain('kreuzberg-nord');
		expect(out).toContain('wedding-zentrum');
		expect(out).toMatch(/get_kiez_profile/);
		expect(out).not.toContain('—');
	});

	it('rendert EN mit beiden Slugs', () => {
		const out = compareKiezePrompt.render({ slug_a: 'kreuzberg-nord', slug_b: 'wedding-zentrum' }, 'en');
		expect(out).toContain('kreuzberg-nord');
		expect(out).toContain('wedding-zentrum');
		expect(out).toMatch(/get_kiez_profile/);
	});

	it('keine lebenswert-Vokabel', () => {
		const de = compareKiezePrompt.render({ slug_a: 'a', slug_b: 'b' }, 'de');
		const en = compareKiezePrompt.render({ slug_a: 'a', slug_b: 'b' }, 'en');
		expect(de.toLowerCase()).not.toContain('lebenswert');
		expect(en.toLowerCase()).not.toContain('lebenswert');
	});
});
