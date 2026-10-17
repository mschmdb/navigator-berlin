import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, scrollBehavior } from './reduced-motion.js';

function stubMatchMedia(reduce: boolean): void {
	vi.stubGlobal('window', {
		matchMedia: (query: string) => ({
			matches: query === '(prefers-reduced-motion: reduce)' && reduce
		})
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('prefersReducedMotion', () => {
	it('ist true, wenn die Person weniger Bewegung wünscht', () => {
		stubMatchMedia(true);
		expect(prefersReducedMotion()).toBe(true);
	});

	it('ist false ohne Wunsch', () => {
		stubMatchMedia(false);
		expect(prefersReducedMotion()).toBe(false);
	});

	it('ist false ohne window (SSR)', () => {
		expect(prefersReducedMotion()).toBe(false);
	});
});

describe('scrollBehavior', () => {
	it('springt bei reduzierter Bewegung', () => {
		stubMatchMedia(true);
		expect(scrollBehavior()).toBe('auto');
	});

	it('scrollt sonst weich', () => {
		stubMatchMedia(false);
		expect(scrollBehavior()).toBe('smooth');
	});
});
