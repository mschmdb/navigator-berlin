import { afterEach, describe, expect, it, vi } from 'vitest';
import { reportOverviewProblems } from './overview-problems.js';

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe('reportOverviewProblems', () => {
	it('tut bei leerer Liste nichts', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		reportOverviewProblems('kieze', []);
		expect(warn).not.toHaveBeenCalled();
	});

	it('warnt lokal und wirft nicht', () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(() => reportOverviewProblems('kieze', ['a', 'b'])).not.toThrow();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0])).toContain('[overview:kieze]');
	});

	it('wirft im Strict-Build mit allen Befunden', () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '1');
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(() => reportOverviewProblems('daten', ['a', 'b'])).toThrow(/\[overview:daten\].*a.*b/s);
	});
});
