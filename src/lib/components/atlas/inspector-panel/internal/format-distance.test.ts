import { describe, expect, it } from 'vitest';
import { formatDistanceDe } from './format-distance.js';

describe('formatDistanceDe', () => {
	it('unter 1000 m in Metern', () => {
		expect(formatDistanceDe(0)).toBe('0 m');
		expect(formatDistanceDe(950)).toBe('950 m');
		expect(formatDistanceDe(999)).toBe('999 m');
	});

	it('ab 1000 m in Kilometern mit deutschem Dezimalkomma', () => {
		expect(formatDistanceDe(1000)).toBe('1,0 km');
		expect(formatDistanceDe(1500)).toBe('1,5 km');
		expect(formatDistanceDe(12340)).toBe('12,3 km');
	});
});
