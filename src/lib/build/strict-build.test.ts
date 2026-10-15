import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHandleHttpError, isStrictBuild } from './strict-build.js';

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe('isStrictBuild', () => {
	it('ist wahr bei NAVIGATOR_STRICT_BUILD=1', () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '1');
		expect(isStrictBuild()).toBe(true);
	});

	it('ist falsch ohne Flag, auch bei NODE_ENV=production (vite build setzt das selbst)', () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '');
		vi.stubEnv('NODE_ENV', 'production');
		expect(isStrictBuild()).toBe(false);
	});

	it('ist falsch bei anderen Werten', () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '0');
		expect(isStrictBuild()).toBe(false);
	});
});

describe('createHandleHttpError', () => {
	const error = { path: '/kaputt', referrer: '/', message: '404 /kaputt' };

	it('wirft im strikten Build', () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '1');
		const handler = createHandleHttpError([]);
		expect(() => handler(error)).toThrow(/404 \/kaputt/);
	});

	it('warnt nur im nicht strikten Build', () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const handler = createHandleHttpError([]);
		expect(() => handler(error)).not.toThrow();
		expect(warn).toHaveBeenCalledTimes(1);
	});

	it('wirft nicht für Pfade der Allowlist, warnt aber', () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '1');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const handler = createHandleHttpError(['/kaputt']);
		expect(() => handler(error)).not.toThrow();
		expect(warn).toHaveBeenCalledTimes(1);
	});
});
