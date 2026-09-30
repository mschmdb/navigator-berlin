import { describe, expect, it } from 'vitest';
import { classifyEnProfile } from './en-status.js';

describe('classifyEnProfile', () => {
	it('ok bei passendem Hash', () => {
		expect(classifyEnProfile({ sourceInputHash: 'a' }, 'a', true)).toBe('ok');
	});
	it('stale bei abweichendem oder fehlendem Hash', () => {
		expect(classifyEnProfile({ sourceInputHash: 'a' }, 'b', true)).toBe('stale');
		expect(classifyEnProfile({}, 'b', true)).toBe('stale');
		expect(classifyEnProfile({ sourceInputHash: 'a' }, undefined, true)).toBe('stale');
	});
	it('orphan ohne DE-Datei', () => {
		expect(classifyEnProfile({ sourceInputHash: 'a' }, undefined, false)).toBe('orphan');
	});
});
