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
	// Prerender: SvelteKit wirft beim Zugriff auf url.search. Ein früher Stand
	// las search für jeden Pfad und ließ alle prerenderten Seiten scheitern.
	it('liest url.search außerhalb von /explore nicht (Prerender-sicher)', async () => {
		const url = new URL('http://localhost/kiez/mitte');
		Object.defineProperty(url, 'search', {
			get() {
				throw new Error('Cannot access url.search on a page with prerendering enabled');
			}
		});
		const resolve = vi.fn(async () => new Response('<html></html>'));
		const response = await handleNoIndexHeaders({
			event: { url },
			resolve
		} as unknown as Parameters<typeof handleNoIndexHeaders>[0]);
		expect(response.headers.get('X-Robots-Tag')).toBeNull();
	});

	it('übersteht /explore, wenn url.search beim Prerender wirft', async () => {
		const url = new URL('http://localhost/explore');
		Object.defineProperty(url, 'search', {
			get() {
				throw new Error('Cannot access url.search on a page with prerendering enabled');
			}
		});
		const resolve = vi.fn(async () => new Response('<html></html>'));
		const response = await handleNoIndexHeaders({
			event: { url },
			resolve
		} as unknown as Parameters<typeof handleNoIndexHeaders>[0]);
		expect(response.headers.get('X-Robots-Tag')).toBeNull();
	});

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

describe('hooks.server.ts: handleNoIndexHeaders (Indexierungs-Hygiene S1)', () => {
	async function headerFor(url: string): Promise<string | null> {
		const resolve = vi.fn(async () => new Response('<html></html>'));
		const response = await handleNoIndexHeaders({
			event: fakeEvent(url),
			resolve
		} as unknown as Parameters<typeof handleNoIndexHeaders>[0]);
		return response.headers.get('X-Robots-Tag');
	}

	it('setzt noindex, follow auf /explore mit Query', async () => {
		expect(await headerFor('http://localhost/explore?kiez=reuterstrasse')).toBe('noindex, follow');
	});

	it('setzt noindex, follow auf /en/explore mit Query', async () => {
		expect(await headerFor('http://localhost/en/explore?layers=x')).toBe('noindex, follow');
	});

	it('lässt /explore ohne Query indexierbar', async () => {
		expect(await headerFor('http://localhost/explore')).toBeNull();
		expect(await headerFor('http://localhost/explore?')).toBeNull();
	});

	it('setzt noindex, follow auf /demo und Unterseiten', async () => {
		expect(await headerFor('http://localhost/demo')).toBe('noindex, follow');
		expect(await headerFor('http://localhost/demo/playwright')).toBe('noindex, follow');
	});

	it('behandelt Trailing Slash, /en/demo und Tracking-Parameter', async () => {
		expect(await headerFor('http://localhost/explore/?kiez=x')).toBe('noindex, follow');
		expect(await headerFor('http://localhost/en/demo')).toBe('noindex, follow');
		// utm_* ist bewusst noindex: jede Query-URL auf /explore bleibt aus dem Index.
		expect(await headerFor('http://localhost/explore?utm_source=x')).toBe('noindex, follow');
	});

	it('trifft keine Pfade, die nur mit demo beginnen', async () => {
		expect(await headerFor('http://localhost/demokratie')).toBeNull();
	});
});
