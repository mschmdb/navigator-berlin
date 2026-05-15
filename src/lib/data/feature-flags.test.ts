import { describe, expect, it } from 'vitest';
import { featureFlags } from './feature-flags.js';

describe('featureFlags', () => {
	it('compareMode ist true in Story 1.27', () => {
		expect(featureFlags.compareMode).toBe(true);
	});

	it('Objekt ist immutable (readonly via Object.freeze)', () => {
		expect(Object.isFrozen(featureFlags)).toBe(true);
	});

	it('alle Flags sind Booleans', () => {
		for (const [key, value] of Object.entries(featureFlags)) {
			expect(typeof value, `${key} muss boolean sein`).toBe('boolean');
		}
	});
});
