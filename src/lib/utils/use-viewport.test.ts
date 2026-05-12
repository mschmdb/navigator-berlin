import { describe, expect, it } from 'vitest';
import { classifyViewportWidth, BREAKPOINTS } from './use-viewport.svelte.js';

describe('classifyViewportWidth', () => {
	it('Mobile bei width ≤ 640', () => {
		expect(classifyViewportWidth(375)).toBe('mobile');
		expect(classifyViewportWidth(BREAKPOINTS.mobileMax)).toBe('mobile');
	});

	it('Tablet zwischen 641 und 1024', () => {
		expect(classifyViewportWidth(641)).toBe('tablet');
		expect(classifyViewportWidth(800)).toBe('tablet');
		expect(classifyViewportWidth(BREAKPOINTS.tabletMax)).toBe('tablet');
	});

	it('Desktop bei width > 1024', () => {
		expect(classifyViewportWidth(1025)).toBe('desktop');
		expect(classifyViewportWidth(1920)).toBe('desktop');
	});
});
