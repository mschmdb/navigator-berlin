import { describe, expect, it } from 'vitest';
import type { Adapter, Builder } from '@sveltejs/kit';
import { withRequestOrigin } from './request-origin-adapter.js';

function fakeBuilder(): Builder {
	const target = {
		config: { paths: { base: '/b', origin: 'https://navigator.berlin' }, other: 1 },
		marker: 'builder',
		getAppPath() {
			return this.marker;
		}
	};
	return target as unknown as Builder;
}

function capturingAdapter(seen: { builder?: Builder }): Adapter {
	return {
		name: 'fake',
		adapt(builder) {
			seen.builder = builder;
		},
		supports: { read: () => true }
	};
}

describe('withRequestOrigin', () => {
	it('hides paths.origin from the wrapped adapter', async () => {
		const seen: { builder?: Builder } = {};
		await withRequestOrigin(capturingAdapter(seen)).adapt(fakeBuilder());
		expect(seen.builder?.config.paths.origin).toBeUndefined();
	});

	it('keeps the other config values', async () => {
		const seen: { builder?: Builder } = {};
		await withRequestOrigin(capturingAdapter(seen)).adapt(fakeBuilder());
		expect(seen.builder?.config.paths.base).toBe('/b');
		expect((seen.builder?.config as unknown as { other: number }).other).toBe(1);
	});

	it('keeps builder methods bound to the real builder', async () => {
		const seen: { builder?: Builder } = {};
		await withRequestOrigin(capturingAdapter(seen)).adapt(fakeBuilder());
		const getAppPath = seen.builder!.getAppPath;
		expect(getAppPath()).toBe('builder');
	});

	it('keeps name and supports of the wrapped adapter', () => {
		const wrapped = withRequestOrigin(capturingAdapter({}));
		expect(wrapped.name).toBe('fake');
		expect(wrapped.supports?.read?.({ config: {}, route: { id: '/' } })).toBe(true);
	});
});
