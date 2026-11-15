import { describe, expect, it } from 'vitest';
import { signedPoints } from './labels';

describe('signedPoints', () => {
	it('rounds and signs the gap in score points', () => {
		expect(signedPoints(12.6)).toBe('+13');
		expect(signedPoints(-15.6)).toBe('−16');
		expect(signedPoints(0.4)).toBe('±0');
	});
});
