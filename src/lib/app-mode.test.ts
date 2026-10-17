import { describe, expect, it } from 'vitest';
import {
	resolveAppMode,
	isHitzeMode,
	hitzeReroute,
	kaelteReroute,
	pageviewPathFor
} from './app-mode.js';

describe('kaelte-Subdomain', () => {
	it('erkennt kaelte.-Subdomain als eigenen Modus', () => {
		expect(resolveAppMode('kaelte.navigator.berlin')).toBe('kaelte');
		expect(resolveAppMode('KAELTE.navigator.berlin')).toBe('kaelte');
	});

	it('?mode=kaelte schaltet den Kälte-Modus auch auf der Hauptdomain ein', () => {
		expect(resolveAppMode('navigator.berlin', 'kaelte')).toBe('kaelte');
		expect(resolveAppMode('hitze.navigator.berlin', 'kaelte')).toBe('kaelte');
	});

	it('?mode=default überschreibt den Kälte-Host', () => {
		expect(resolveAppMode('kaelte.navigator.berlin', 'default')).toBe('default');
	});

	it('kaelteReroute rewritet die Wurzel auf /kaelte', () => {
		expect(kaelteReroute(new URL('https://kaelte.navigator.berlin/'))).toBe('/kaelte');
	});

	it('kaelteReroute lässt andere Pfade und Hosts unangetastet', () => {
		expect(kaelteReroute(new URL('https://kaelte.navigator.berlin/explore'))).toBeNull();
		expect(kaelteReroute(new URL('https://kaelte.navigator.berlin/kaelte'))).toBeNull();
		expect(kaelteReroute(new URL('https://navigator.berlin/'))).toBeNull();
		expect(kaelteReroute(new URL('https://hitze.navigator.berlin/'))).toBeNull();
	});

	it('hitzeReroute greift nicht auf der kaelte-Subdomain', () => {
		expect(hitzeReroute(new URL('https://kaelte.navigator.berlin/'))).toBeNull();
	});
});

describe('pageviewPathFor', () => {
	it('meldet die Kälte-Wurzel als /kaelte', () => {
		expect(pageviewPathFor(new URL('https://kaelte.navigator.berlin/'))).toBe('/kaelte');
	});

	it('meldet die Hitze-Wurzel als /hitze', () => {
		expect(pageviewPathFor(new URL('https://hitze.navigator.berlin/'))).toBe('/hitze');
	});

	it('lässt andere Pfade der Subdomains unverändert', () => {
		expect(pageviewPathFor(new URL('https://kaelte.navigator.berlin/explore'))).toBeUndefined();
		expect(pageviewPathFor(new URL('https://hitze.navigator.berlin/explore'))).toBeUndefined();
	});

	it('lässt die Hauptdomain unverändert', () => {
		expect(pageviewPathFor(new URL('https://navigator.berlin/'))).toBeUndefined();
	});
});

describe('resolveAppMode', () => {
	it('erkennt hitze.-Subdomain', () => {
		expect(resolveAppMode('hitze.navigator.berlin')).toBe('hitze');
		expect(resolveAppMode('HITZE.navigator.berlin')).toBe('hitze');
	});

	it('default für die Hauptdomain', () => {
		expect(resolveAppMode('navigator.berlin')).toBe('default');
		expect(resolveAppMode('www.navigator.berlin')).toBe('default');
	});

	it('Override schlägt Host (lokales Testen)', () => {
		expect(resolveAppMode('navigator.berlin', 'hitze')).toBe('hitze');
		expect(resolveAppMode('hitze.navigator.berlin', 'default')).toBe('default');
	});

	it('unbekannter Override wird ignoriert, Fallback auf Host', () => {
		expect(resolveAppMode('hitze.navigator.berlin', 'quatsch')).toBe('hitze');
		expect(resolveAppMode('navigator.berlin', '')).toBe('default');
	});

	it('null/leerer Host ist default', () => {
		expect(resolveAppMode(null)).toBe('default');
		expect(resolveAppMode(undefined)).toBe('default');
		expect(resolveAppMode('')).toBe('default');
	});

	it('isHitzeMode', () => {
		expect(isHitzeMode('hitze')).toBe(true);
		expect(isHitzeMode('default')).toBe(false);
	});
});

describe('hitzeReroute', () => {
	it('rewritet die Wurzel der Hitze-Subdomain auf /hitze', () => {
		expect(hitzeReroute(new URL('https://hitze.navigator.berlin/'))).toBe('/hitze');
	});

	it('lässt andere Pfade der Hitze-Subdomain unangetastet', () => {
		expect(hitzeReroute(new URL('https://hitze.navigator.berlin/explore'))).toBeNull();
		expect(hitzeReroute(new URL('https://hitze.navigator.berlin/hitze'))).toBeNull();
	});

	it('greift nicht auf der Hauptdomain', () => {
		expect(hitzeReroute(new URL('https://navigator.berlin/'))).toBeNull();
	});

	it('Override erlaubt lokales Testen (localhost als hitze)', () => {
		expect(hitzeReroute(new URL('http://localhost:5174/'), 'hitze')).toBe('/hitze');
	});
});
