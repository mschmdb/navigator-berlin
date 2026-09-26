import { describe, expect, it } from 'vitest';
import { renamedRouteRedirectTarget, resolveWahlRedirect } from './renamed-route-redirect.js';

describe('renamedRouteRedirectTarget', () => {
	it('mappt /wo-lebt-es-sich-gut auf /umwelt-infrastruktur-score', () => {
		expect(renamedRouteRedirectTarget('/wo-lebt-es-sich-gut')).toBe('/umwelt-infrastruktur-score');
	});

	it('toleriert Trailing-Slash', () => {
		expect(renamedRouteRedirectTarget('/wo-lebt-es-sich-gut/')).toBe('/umwelt-infrastruktur-score');
	});

	it('mappt umbenannten Layer-Slug /layer/kiez-score-gruen auf -gruen-hitze', () => {
		expect(renamedRouteRedirectTarget('/layer/kiez-score-gruen')).toBe(
			'/layer/kiez-score-gruen-hitze'
		);
		expect(renamedRouteRedirectTarget('/layer/kiez-score-gruen/')).toBe(
			'/layer/kiez-score-gruen-hitze'
		);
	});

	it('liefert null für unbekannte Pfade', () => {
		expect(renamedRouteRedirectTarget('/umwelt-infrastruktur-score')).toBeNull();
		expect(renamedRouteRedirectTarget('/explore')).toBeNull();
		expect(renamedRouteRedirectTarget('/')).toBeNull();
	});

	// i18n Block A, I/O-Matrix "Umbenannte Route EN": redirect bleibt innerhalb
	// der Locale, landet nicht auf dem DE-Canonical.
	it('mappt /en/wo-lebt-es-sich-gut auf /en/umwelt-infrastruktur-score', () => {
		expect(renamedRouteRedirectTarget('/en/wo-lebt-es-sich-gut')).toBe(
			'/en/umwelt-infrastruktur-score'
		);
	});

	it('mappt /en/wahl/<slug> auf /en/berlin-wahlen/<slug>', () => {
		expect(renamedRouteRedirectTarget('/en/wahl/2023-bvv')).toBe('/en/berlin-wahlen/2023-bvv');
	});

	it('liefert null für unbekannte EN-Pfade (kein falsches Locale-Matching)', () => {
		expect(renamedRouteRedirectTarget('/en/umwelt-infrastruktur-score')).toBeNull();
		expect(renamedRouteRedirectTarget('/en/explore')).toBeNull();
	});

	// Code-review fix: Groß-/Kleinschreibung des Locale-Präfix darf den Match
	// nicht verhindern (wie im Stale-Locale-Redirect bereits), Ziel wird auf
	// die kanonische Kleinschreibung normalisiert.
	it('erkennt /EN/... groß geschrieben und normalisiert das Ziel auf Kleinschreibung', () => {
		expect(renamedRouteRedirectTarget('/EN/wo-lebt-es-sich-gut')).toBe(
			'/en/umwelt-infrastruktur-score'
		);
		expect(renamedRouteRedirectTarget('/En/wahl/2023-bvv')).toBe('/en/berlin-wahlen/2023-bvv');
	});

	it('ignoriert Query (Caller hängt search wieder an)', () => {
		// Resolver bekommt nur pathname, daher kein Query-Handling hier.
		expect(renamedRouteRedirectTarget('/wo-lebt-es-sich-gut')).toBe('/umwelt-infrastruktur-score');
	});

	// Story 16: /wahl → /berlin-wahlen (Index-Redirect + Slug-Präfix-Redirect).
	it('mappt /wahl-Index auf /berlin-wahlen', () => {
		expect(renamedRouteRedirectTarget('/wahl')).toBe('/berlin-wahlen');
		expect(renamedRouteRedirectTarget('/wahl/')).toBe('/berlin-wahlen');
	});

	it('mappt /wahl/<slug> auf /berlin-wahlen/<slug> für gültige Slugs', () => {
		expect(renamedRouteRedirectTarget('/wahl/2023-bvv')).toBe('/berlin-wahlen/2023-bvv');
		expect(renamedRouteRedirectTarget('/wahl/2023-agh-zweitstimme')).toBe(
			'/berlin-wahlen/2023-agh-zweitstimme'
		);
	});

	it('redirected NICHT bei ungültigem Wahl-Slug (bleibt 404)', () => {
		expect(renamedRouteRedirectTarget('/wahl/foo')).toBeNull();
		expect(resolveWahlRedirect('/wahl/foo')).toBeNull();
	});

	it('resolveWahlRedirect toleriert Trailing-Slash', () => {
		expect(resolveWahlRedirect('/wahl/2023-bvv/')).toBe('/berlin-wahlen/2023-bvv');
	});

	// Review-Fund: nicht-kanonische, aber per parseWahlSlug gültige Kurzformen
	// leiteten vorher wörtlich um und landeten auf einer nicht existierenden
	// Detailseite (404). Ziel muss über buildWahlSlug kanonisiert werden.
	it('kanonisiert BTW/AGH-Kurzform ohne Stimmtyp auf Zweitstimme (wie die alte /wahl-Seite)', () => {
		expect(renamedRouteRedirectTarget('/wahl/2023-agh')).toBe(
			'/berlin-wahlen/2023-agh-zweitstimme'
		);
		expect(renamedRouteRedirectTarget('/wahl/2025-btw')).toBe(
			'/berlin-wahlen/2025-btw-zweitstimme'
		);
	});

	it('kanonisiert BVV mit überflüssigem Stimmtyp-Suffix auf die Kurzform', () => {
		expect(renamedRouteRedirectTarget('/wahl/2023-bvv-einstimme')).toBe('/berlin-wahlen/2023-bvv');
	});

	it('lehnt BVV mit erst-/zweitstimme weiter ab (kein gültiger Slug)', () => {
		expect(renamedRouteRedirectTarget('/wahl/2023-bvv-erststimme')).toBeNull();
		expect(renamedRouteRedirectTarget('/wahl/2023-bvv-zweitstimme')).toBeNull();
	});
});
