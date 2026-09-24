import { describe, it, expect, vi } from 'vitest';
import { handleRenamedRouteRedirect } from './hooks.server.js';

function fakeEvent(url: string): Parameters<typeof handleRenamedRouteRedirect>[0]['event'] {
	return { url: new URL(url) } as Parameters<typeof handleRenamedRouteRedirect>[0]['event'];
}

// Story 16 Matrix-Zeile „Detail-Redirect": GET /wahl/2023-agh-zweitstimme?x=1
// → 301 auf /berlin-wahlen/2023-agh-zweitstimme?x=1 (Query-String bleibt
// erhalten). Bisher nur über den Kommentar „Caller hängt search wieder an"
// in `renamed-route-redirect.ts` dokumentiert, hier der Handler selbst mit
// Fake-Event/Fake-Resolve geprüft.
describe('hooks.server.ts: handleRenamedRouteRedirect', () => {
	it('301 auf die umgezogene Wahl-Detailseite, Query-String bleibt am Location-Header erhalten', async () => {
		const resolve = vi.fn(() => {
			throw new Error('resolve() darf beim Redirect nicht aufgerufen werden');
		});

		const response = await handleRenamedRouteRedirect({
			event: fakeEvent('http://localhost/wahl/2023-agh-zweitstimme?x=1'),
			resolve
		} as unknown as Parameters<typeof handleRenamedRouteRedirect>[0]);

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('/berlin-wahlen/2023-agh-zweitstimme?x=1');
		expect(resolve).not.toHaveBeenCalled();
	});

	it('301 ohne Query bleibt ohne „?" am Location-Header', async () => {
		const resolve = vi.fn(() => {
			throw new Error('resolve() darf beim Redirect nicht aufgerufen werden');
		});

		const response = await handleRenamedRouteRedirect({
			event: fakeEvent('http://localhost/wahl'),
			resolve
		} as unknown as Parameters<typeof handleRenamedRouteRedirect>[0]);

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('/berlin-wahlen');
	});

	it('ruft resolve(event) unverändert durch, wenn kein Redirect-Ziel matched', async () => {
		const expected = new Response('ok');
		const resolve = vi.fn(async () => expected);

		const response = await handleRenamedRouteRedirect({
			event: fakeEvent('http://localhost/explore'),
			resolve
		} as unknown as Parameters<typeof handleRenamedRouteRedirect>[0]);

		expect(resolve).toHaveBeenCalledTimes(1);
		expect(response).toBe(expected);
	});
});
