import { describe, expect, it } from 'vitest';
import { renamedRouteRedirectTarget } from './renamed-route-redirect.js';

describe('renamedRouteRedirectTarget', () => {
	it('mappt /wo-lebt-es-sich-gut auf /umwelt-infrastruktur-score', () => {
		expect(renamedRouteRedirectTarget('/wo-lebt-es-sich-gut')).toBe('/umwelt-infrastruktur-score');
	});

	it('toleriert Trailing-Slash', () => {
		expect(renamedRouteRedirectTarget('/wo-lebt-es-sich-gut/')).toBe(
			'/umwelt-infrastruktur-score'
		);
	});

	it('liefert null für unbekannte Pfade', () => {
		expect(renamedRouteRedirectTarget('/umwelt-infrastruktur-score')).toBeNull();
		expect(renamedRouteRedirectTarget('/explore')).toBeNull();
		expect(renamedRouteRedirectTarget('/')).toBeNull();
	});

	it('ignoriert Query (Caller hängt search wieder an)', () => {
		// Resolver bekommt nur pathname, daher kein Query-Handling hier.
		expect(renamedRouteRedirectTarget('/wo-lebt-es-sich-gut')).toBe('/umwelt-infrastruktur-score');
	});
});
