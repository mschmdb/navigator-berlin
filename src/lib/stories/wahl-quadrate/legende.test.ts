import { describe, expect, it } from 'vitest';
import { legendNames } from './legende';
import { ORDER } from './parteien';

describe('legendNames', () => {
	it('ein Eintrag je Block in ORDER, Parteinamen in der verlangten Sprache', () => {
		expect(legendNames('de', 0.05)).toHaveLength(ORDER.length);
		expect(legendNames('de', 0.05)[0]).toBe('AfD');
		expect(legendNames('de', 0.05)).toContain('Grüne');
		expect(legendNames('en', 0.05)).toContain('Greens');
	});

	it('Grau mit Schwelle oder als Sonstige', () => {
		expect(legendNames('de', 0.05).at(-1)).toBe('Grau: alle Parteien unter 5 %');
		expect(legendNames('en', 0.05).at(-1)).toBe('Grey: all parties below 5%');
		expect(legendNames('de', 0).at(-1)).toBe('Grau: Sonstige');
	});
});
