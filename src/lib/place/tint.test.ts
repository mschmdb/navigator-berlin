import { describe, expect, it } from 'vitest';
import { splitForTint } from './tint';

describe('splitForTint', () => {
	it('tints from the judging word to the end of its clause', () => {
		expect(
			splitForTint(
				'Lebensmittel: 16,4. Das ist besser versorgt als in 90 % der Berliner Kieze.',
				'besser versorgt'
			)
		).toEqual({
			before: 'Lebensmittel: 16,4. Das ist ',
			tinted: 'besser versorgt als in 90 % der Berliner Kieze',
			after: '.'
		});
	});
	it('stops at a comma', () => {
		expect(splitForTint('Das ist 6,1 mehr als X, insgesamt mehr als in 90 %.', 'mehr')).toEqual({
			before: 'Das ist 6,1 ',
			tinted: 'mehr als X',
			after: ', insgesamt mehr als in 90 %.'
		});
	});
	it('returns null when the phrase is missing', () => {
		expect(splitForTint('Nichts.', 'besser')).toBeNull();
	});
});
