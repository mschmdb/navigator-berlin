import { describe, expect, it, vi } from 'vitest';
import { isHttpError } from '@sveltejs/kit';

vi.mock('$app/environment', () => ({ dev: false, browser: false, building: false, version: '' }));

const { load } = await import('./+page.server');
const runLoad = () => (load as unknown as () => Promise<unknown>)();

describe('cross-layer-templates in production', () => {
	it('answers 404, the preview is an internal dev tool', async () => {
		const err = await runLoad().then(
			() => null,
			(error: unknown) => error
		);
		expect(isHttpError(err)).toBe(true);
		expect(isHttpError(err) && err.status).toBe(404);
	});
});
