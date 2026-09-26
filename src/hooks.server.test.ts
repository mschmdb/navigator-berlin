import { describe, it, expect, vi } from 'vitest';
import { handleRenamedRouteRedirect, handleNoIndexHeaders } from './hooks.server.js';

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

// Code-review fix (i18n Block A): /en/api/* muss den X-Robots-Tag-Header
// genauso wie /api/* bekommen -- basePathname() normalisiert den
// Locale-Präfix weg, bevor der /api/-Check läuft.
describe('hooks.server.ts: handleNoIndexHeaders', () => {
	it('setzt X-Robots-Tag auf /api/*-Responses', async () => {
		const resolve = vi.fn(async () => new Response('{}'));
		const response = await handleNoIndexHeaders({
			event: fakeEvent('http://localhost/api/geocode'),
			resolve
		} as unknown as Parameters<typeof handleNoIndexHeaders>[0]);
		expect(response.headers.get('X-Robots-Tag')).toBe('noindex,nofollow');
	});

	it('setzt X-Robots-Tag auch auf /en/api/*-Responses (Locale-Präfix)', async () => {
		const resolve = vi.fn(async () => new Response('{}'));
		const response = await handleNoIndexHeaders({
			event: fakeEvent('http://localhost/en/api/geocode'),
			resolve
		} as unknown as Parameters<typeof handleNoIndexHeaders>[0]);
		expect(response.headers.get('X-Robots-Tag')).toBe('noindex,nofollow');
	});

	it('lässt Nicht-API-Responses unverändert (auch mit Locale-Präfix)', async () => {
		const resolve = vi.fn(async () => new Response('<html></html>'));
		const response = await handleNoIndexHeaders({
			event: fakeEvent('http://localhost/en/kiez/mitte'),
			resolve
		} as unknown as Parameters<typeof handleNoIndexHeaders>[0]);
		expect(response.headers.get('X-Robots-Tag')).toBeNull();
	});
});
