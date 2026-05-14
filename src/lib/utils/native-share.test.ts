import { afterEach, describe, expect, it, vi } from 'vitest';
import { canNativeShare } from './native-share.js';

interface MockNav {
	share?: (data: ShareData) => Promise<void>;
	canShare?: (data: ShareData) => boolean;
}

function withNavigator(nav: MockNav | undefined, fn: () => void): void {
	const original = globalThis.navigator;
	if (nav === undefined) {
		delete (globalThis as { navigator?: unknown }).navigator;
	} else {
		Object.defineProperty(globalThis, 'navigator', {
			value: nav,
			configurable: true
		});
	}
	try {
		fn();
	} finally {
		Object.defineProperty(globalThis, 'navigator', {
			value: original,
			configurable: true
		});
	}
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('canNativeShare', () => {
	it('false ohne navigator', () => {
		withNavigator(undefined, () => {
			expect(canNativeShare()).toBe(false);
		});
	});

	it('false ohne share-API', () => {
		withNavigator({}, () => {
			expect(canNativeShare()).toBe(false);
		});
	});

	it('true wenn share-API verfügbar und kein Payload', () => {
		withNavigator({ share: async () => {} }, () => {
			expect(canNativeShare()).toBe(true);
		});
	});

	it('respektiert canShare wenn Payload übergeben', () => {
		withNavigator(
			{
				share: async () => {},
				canShare: (data) => data.url !== 'unsupported'
			},
			() => {
				expect(canNativeShare({ url: 'ok' })).toBe(true);
				expect(canNativeShare({ url: 'unsupported' })).toBe(false);
			}
		);
	});

	it('true wenn share verfügbar aber canShare fehlt', () => {
		withNavigator({ share: async () => {} }, () => {
			expect(canNativeShare({ url: 'foo' })).toBe(true);
		});
	});
});
