import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestPosition } from './geolocation.js';

afterEach(() => vi.unstubAllGlobals());

function stubGeolocation(
	impl: (ok: (p: GeolocationPosition) => void, err: (e: unknown) => void) => void
): void {
	vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: impl } });
}

describe('requestPosition', () => {
	it('liefert Koordinaten bei Erfolg', async () => {
		stubGeolocation((ok) =>
			ok({ coords: { latitude: 52.52, longitude: 13.405 } } as GeolocationPosition)
		);
		expect(await requestPosition()).toEqual({ ok: true, lat: 52.52, lng: 13.405 });
	});

	it('reason=denied bei PERMISSION_DENIED (code 1)', async () => {
		stubGeolocation((_ok, err) => err({ code: 1 }));
		expect(await requestPosition()).toEqual({ ok: false, reason: 'denied' });
	});

	it('reason=error bei generischem Fehler', async () => {
		stubGeolocation((_ok, err) => err({ code: 2 }));
		expect(await requestPosition()).toEqual({ ok: false, reason: 'error' });
	});

	it('reason=unsupported ohne navigator.geolocation', async () => {
		vi.stubGlobal('navigator', {});
		expect(await requestPosition()).toEqual({ ok: false, reason: 'unsupported' });
	});
});
